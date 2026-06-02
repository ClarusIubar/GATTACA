# Deployment Setup

이 문서는 `추억열차 (GATTACA)`의 실제 배포 기준과 현재 live 상태를 정리합니다.

## 1. Local Setup

```bash
git clone https://github.com/ClarusIubar/GATTACA.git
cd GATTACA
npm install
npm run dev
```

로컬에서만 데모 모드를 켜고 싶다면 `.env.local`에 아래 값을 둡니다.

```bash
VITE_ENABLE_DEMO_MODE=true
```

## 2. Frontend Build Variables

프론트엔드가 읽는 build env:

- `VITE_CLOUDFLARE_API_URL`
- `VITE_ADMIN_USER_ID` (선택)
- `VITE_ENABLE_DEMO_MODE`

규칙:

- `VITE_ENABLE_DEMO_MODE=true`는 local/test seam에서만 사용
- production build에서는 비우거나 `false`
- SPA 라우팅을 위해 `public/_redirects` 포함

## 3. Worker Resources

Worker bindings:

- `DB`: Cloudflare D1
- `SESSION`: Cloudflare KV
- `BUCKET`: Cloudflare R2
- `APP_BASE_URL`
- `SESSION_TTL_SECONDS`
- `ADMIN_AUTH_USER_ID` (선택)

Worker secrets:

- `KAKAO_REST_API_KEY`
- `KAKAO_CLIENT_SECRET`

D1 schema:

- [docs/sql/cloudflare-d1-schema.sql](https://github.com/ClarusIubar/GATTACA/blob/main/docs/sql/cloudflare-d1-schema.sql)

## 4. Validation Commands

```bash
npm run lint
npm run test
npm run build
npm run worker:deploy:dry-run
npm run live:check -- --api-url https://gattaca-backend.yhh4433.workers.dev
```

Manual Pages deploy:

```bash
npm run pages:deploy
```

Require Kakao-ready runtime:

```bash
npm run live:check:kakao -- --api-url https://gattaca-backend.yhh4433.workers.dev
```

## 5. Public Runtime Endpoints

현재 공개 검증 가능한 경로:

- `GET /api/health`
- `GET /api/runtime-status`
- `GET /api/session`
- `GET /api/auth/kakao`
- `GET /api/auth/callback`
- `POST /api/auth/logout`
- `POST /api/upload`
- `GET /uploads/<objectKey>`
- `GET/POST /api/events`
- `GET/POST /api/memories`
- `GET/POST /api/comments`
- `GET /api/profiles`
- `PUT /api/profiles/:id/approval`
- `POST /api/notifications/kakao-event`

`/api/runtime-status`는 다음을 노출합니다.

- `bindings.db`
- `bindings.session`
- `bindings.bucket`
- `auth.kakaoRestApiKeyConfigured`
- `auth.kakaoClientSecretConfigured`
- `auth.kakaoOAuthConfigured`

## 6. Build/Deploy Source of Truth

현재 GitHub Actions 배포 흐름은 아래 순서입니다.

1. Worker를 먼저 배포
2. 배포 출력에서 `workers.dev` URL 추출
3. 그 값을 `VITE_CLOUDFLARE_API_URL`로 build에 주입
4. `npm run pages:deploy`로 build 결과를 Cloudflare Pages에 배포

즉 production 배포 기준으로 필수 GitHub Secrets는 아래 두 개입니다.

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Worker secret을 GitHub Actions에서 같이 동기화하려면 아래 secret도 GitHub 저장소에 등록합니다.

- `KAKAO_REST_API_KEY`
- `KAKAO_CLIENT_SECRET`

Kakao Developers에서 가져와야 하는 값은 `REST API 키`와 `Client secret 코드`입니다. 화면 위치와 secret 이름 매핑은 [Kakao-Credential-Setup](Kakao-Credential-Setup)을 기준으로 합니다.

`CLOUDFLARE_API_URL` repo variable은 현재 GitHub Actions source-of-truth가 아닙니다.

## 7. Live Readback Status (2026-06-02)

Verified Pages deployment:

- [https://61610380.gattaca-di0.pages.dev/](https://61610380.gattaca-di0.pages.dev/)

Verified Worker health:

- [https://gattaca-backend.yhh4433.workers.dev/api/health](https://gattaca-backend.yhh4433.workers.dev/api/health)

Verified runtime status:

- [https://gattaca-backend.yhh4433.workers.dev/api/runtime-status](https://gattaca-backend.yhh4433.workers.dev/api/runtime-status)

Verified live state:

- Worker deployed
- D1 attached
- KV attached
- R2 attached
- production UI does not fall back to demo
- production UI disables Kakao login when Worker secrets are missing

## 8. Remaining External Step

실제 Kakao OAuth E2E를 열기 위해 아직 필요한 외부 작업:

```bash
npx wrangler secret put KAKAO_REST_API_KEY
npx wrangler secret put KAKAO_CLIENT_SECRET
```

주입 후 검증 순서:

1. `GET /api/runtime-status`에서 `auth.kakaoOAuthConfigured=true` 확인
2. Kakao login redirect -> callback -> session restore 확인
3. approved-user event create -> memory upload -> comment -> Kakao relay readback 확인

## 9. Completion Boundary

현재 상태는 "카카오 secret만 주입하면 live OAuth E2E를 바로 검증할 수 있는 수준"입니다.

아직 완료로 닫지 않는 이유:

- live Worker secrets 미주입
- 실제 Kakao account를 통한 redirect/callback/session readback 미검증
- 실제 Kakao memo relay 수신 미검증
