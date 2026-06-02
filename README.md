# 추억열차 (GATTACA)

추억열차는 카카오톡 단체방에서 확정된 일정과 그날의 사진, 메모, 코멘트를 하나의 정거장으로 보관하는 메모리얼 웹앱입니다. 프론트엔드는 React + TypeScript, 백엔드는 Cloudflare Workers, 데이터는 D1/R2/KV를 사용합니다.

## 현재 구현 범위

- 이벤트, 메모리, 코멘트 CRUD
- 비로그인 공개 읽기, 승인 사용자 CRU, 운영자 delete 권한 모델
- Kakao OAuth callback 경계
- KV 세션 저장과 복원
- R2 사진 업로드
- Kakao relay endpoint
- production demo fallback 차단
- Cloudflare Pages + Workers 배포
- UI/UX 고도화: 홈, 목록, 상세, 등록, 소개 화면을 정거장/노선 콘셉트로 재구성
- TDD 검증 계층: unit, integration, regression, smoke, e2e
- SDD 추적: 문서 요구사항과 구현/테스트 증거 매핑

## 기술 구성

- Frontend: React 19, TypeScript, Vite
- Routing: React Router
- Backend: Cloudflare Workers
- Storage: D1, R2, KV
- Testing: Vitest, Testing Library
- Deployment: GitHub Actions, Cloudflare Pages, Cloudflare Workers

## 로컬 실행

```bash
npm install
npm run dev
```

`.env.local` 예시:

```bash
VITE_CLOUDFLARE_API_URL=https://gattaca.jamissue.com
VITE_ADMIN_USER_ID=your-admin-user-id
VITE_ENABLE_DEMO_MODE=true
```

`VITE_ENABLE_DEMO_MODE=true`는 local/test seam에서만 사용합니다. production build에서는 비우거나 `false`로 둡니다.

## 검증 명령

```bash
npm run lint
npm run test:unit
npm run test:integration
npm run test:regression
npm run test:e2e
npm run build
npm run test:smoke
```

전체 Vitest 묶음:

```bash
npm run test
```

## 배포 흐름

GitHub Actions는 `main`에 머지된 코드를 production으로 배포합니다.

1. 의존성 설치
2. 테스트 실행
3. Worker secret 동기화
4. Worker version upload/deploy
5. production API URL로 프론트엔드 build
6. Cloudflare Pages project 확인
7. `dist`를 Cloudflare Pages에 배포

필수 GitHub Secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `KAKAO_REST_API_KEY`
- `KAKAO_CLIENT_SECRET`

Kakao 값의 정확한 위치는 [docs/15-kakao-credential-setup.md](D:/Code305/GATTACA/docs/15-kakao-credential-setup.md)에 정리합니다.

## 권한 모델

- 비로그인 사용자는 공개 기록만 볼 수 있습니다.
- 승인 대기 사용자는 읽기는 가능하지만 작성은 차단됩니다.
- 승인 사용자는 이벤트, 메모리, 코멘트를 생성하고 본인 작성물을 수정할 수 있습니다.
- 운영자는 사용자 승인/반려와 삭제를 수행합니다.
- 서버는 request body의 `createdBy`, `authorId`, `userId`를 권한 근거로 신뢰하지 않고 세션과 D1 owner lookup을 기준으로 강제합니다.

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

## 문서 링크

- PRD/백로그: [docs/04-prd-backlog.md](D:/Code305/GATTACA/docs/04-prd-backlog.md)
- UI/UX 디자인 시스템: [docs/05-ui-ux-design-system.md](D:/Code305/GATTACA/docs/05-ui-ux-design-system.md)
- 아키텍처/데이터 모델: [docs/06-architecture-data-model.md](D:/Code305/GATTACA/docs/06-architecture-data-model.md)
- 테스트/QA 전략: [docs/10-test-qa-strategy.md](D:/Code305/GATTACA/docs/10-test-qa-strategy.md)
- 배포/운영: [docs/11-deployment-cicd-operations.md](D:/Code305/GATTACA/docs/11-deployment-cicd-operations.md)
- SDD 추적성: [docs/16-sdd-traceability.md](D:/Code305/GATTACA/docs/16-sdd-traceability.md)
- Wiki 원본: [docs/wiki/Home.md](D:/Code305/GATTACA/docs/wiki/Home.md)
