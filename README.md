# 추억열차 (GATTACA)

추억열차는 카카오톡 단체방에서 이미 결정된 일정과 그날의 기록을 남기는 메모리얼 서비스입니다. 프론트엔드는 Cloudflare Pages, 백엔드는 Cloudflare Workers를 사용하고, 데이터는 D1/R2/KV에 저장합니다.

현재 구현 상태는 다음 범위까지 도달했습니다.

- 이벤트 / 메모리 / 코멘트 CRUD
- 승인 사용자 CRU / 운영자 delete 권한 강제
- Kakao OAuth callback 경계
- KV 세션 저장 및 복원
- R2 사진 업로드
- Kakao relay endpoint
- production에서 demo fallback 차단
- Kakao secret 미구성 상태를 UI에서 명시

남은 마지막 단계는 Worker secrets에 Kakao 값을 주입하고, 실제 계정으로 live OAuth와 relay를 검증하는 일입니다.

## 기술 구성

- Frontend: React 19, TypeScript, Vite
- Routing: React Router
- Backend: Cloudflare Workers
- Storage:
  - D1: relational data
  - R2: uploaded images
  - KV: session store
- Testing: Vitest, Testing Library

## 로컬 실행

```bash
npm install
npm run dev
```

`.env.local` 예시:

```bash
VITE_CLOUDFLARE_API_URL=https://gattaca-backend.your-subdomain.workers.dev
VITE_ADMIN_USER_ID=your-admin-user-id
VITE_ENABLE_DEMO_MODE=true
```

규칙:

- `VITE_ENABLE_DEMO_MODE=true`는 local/test seam에서만 사용합니다.
- production build에서는 비우거나 `false`로 둡니다.

## 검증 명령

```bash
npm run lint
npm run test
npm run build
npm run worker:deploy:dry-run
npm run live:check -- --api-url https://gattaca-backend.yhh4433.workers.dev
```

Pages 수동 배포:

```bash
npm run pages:deploy
```

Kakao 포함 live 준비 검증:

```bash
npm run live:check:kakao -- --api-url https://gattaca-backend.yhh4433.workers.dev
```

## 배포 흐름

GitHub Actions는 다음 순서로 동작합니다.

1. Worker를 먼저 배포
2. 배포 출력에서 `workers.dev` URL 추출
3. 그 URL을 `VITE_CLOUDFLARE_API_URL`로 build에 주입
4. `npm run pages:deploy`로 `dist`를 Cloudflare Pages에 배포

필수 GitHub Secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

GitHub Actions에서 Worker secret까지 같이 동기화하려면 아래 secret도 GitHub 저장소에 넣어야 합니다.

- `KAKAO_REST_API_KEY`
- `KAKAO_CLIENT_SECRET`

Worker secrets:

- `KAKAO_REST_API_KEY`
- `KAKAO_CLIENT_SECRET`

Kakao Developers에서 가져올 값은 `REST API 키`와 `Client secret 코드`입니다. 화면 위치와 secret 이름 매핑은 [docs/15-kakao-credential-setup.md](D:\Code305\GATTACA\docs\15-kakao-credential-setup.md)에 정리했습니다.

선택 Worker var:

- `ADMIN_AUTH_USER_ID`

## 현재 live readback

- Pages latest verified deployment:
  - [https://61610380.gattaca-di0.pages.dev/](https://61610380.gattaca-di0.pages.dev/)
- Worker health:
  - [https://gattaca-backend.yhh4433.workers.dev/api/health](https://gattaca-backend.yhh4433.workers.dev/api/health)
- Worker runtime status:
  - [https://gattaca-backend.yhh4433.workers.dev/api/runtime-status](https://gattaca-backend.yhh4433.workers.dev/api/runtime-status)

현재 확인된 상태:

- `bindings.db = true`
- `bindings.session = true`
- `bindings.bucket = true`
- `auth.kakaoRestApiKeyConfigured = false`
- `auth.kakaoClientSecretConfigured = false`
- `auth.kakaoOAuthConfigured = false`

즉, 앱 인프라는 live로 붙어 있지만 Kakao Worker secrets는 아직 주입되지 않았습니다.

## 공개 API 범위

- `GET /api/health`
- `GET /api/runtime-status`
- `GET /api/session`
- `GET /api/auth/kakao`
- `GET /api/auth/callback`
- `POST /api/auth/logout`
- `POST /api/upload`
- `GET /uploads/<objectKey>`
- `GET /api/profiles`
- `PUT /api/profiles/:id/approval`
- `GET/POST /api/events`
- `PUT/DELETE /api/events/:id`
- `GET/POST /api/memories`
- `PUT/DELETE /api/memories/:id`
- `GET/POST /api/comments`
- `PUT/DELETE /api/comments/:id`
- `POST /api/notifications/kakao-event`

## 권한 모델

- 비로그인 사용자는 공개 읽기만 가능합니다.
- 승인 대기 사용자는 읽기 가능, 쓰기 차단 상태입니다.
- 승인 사용자는 이벤트, 메모리, 코멘트 create/update가 가능합니다.
- 운영자는 승인 관리와 delete가 가능합니다.

서버는 request body의 `createdBy`, `authorId`, `userId`를 권한 근거로 쓰지 않습니다. 세션과 D1 owner lookup을 기준으로 강제합니다.

## 문서 링크

- 배포/운영: [docs/11-deployment-cicd-operations.md](D:\Code305\GATTACA\docs\11-deployment-cicd-operations.md)
- Kakao relay 상태: [docs/14-kakao-relay-status.md](D:\Code305\GATTACA\docs\14-kakao-relay-status.md)
- Wiki 원고: [docs/wiki/Home.md](D:\Code305\GATTACA\docs\wiki\Home.md)
