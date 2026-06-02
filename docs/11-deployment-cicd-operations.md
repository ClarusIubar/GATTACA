# 11. 배포, CI/CD, 운영

## 배포 파이프라인

현재 배포 기준은 다음과 같습니다.

1. `main` 브랜치 push 또는 수동 실행
2. 의존성 설치
3. 테스트 실행
4. Worker 배포
5. Worker 출력에서 `workers.dev` URL 추출
6. 해당 URL을 `VITE_CLOUDFLARE_API_URL`로 주입해 프론트 build
7. `npm run pages:deploy`로 Cloudflare Pages 배포

관련 파일:

- [D:\Code305\GATTACA\.github\workflows\deploy.yml](D:\Code305\GATTACA\.github\workflows\deploy.yml)

## 필수 설정

GitHub Secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `KAKAO_REST_API_KEY` (Worker secret 자동 동기화용)
- `KAKAO_CLIENT_SECRET` (Worker secret 자동 동기화용)

Worker vars:

- `APP_BASE_URL`
- `SESSION_TTL_SECONDS`
- `ADMIN_AUTH_USER_ID` (선택)

Worker secrets:

- `KAKAO_REST_API_KEY`
- `KAKAO_CLIENT_SECRET`

현재 workflow는 GitHub Actions 실행 중 위 두 secret이 존재하면 `wrangler secret put`으로 Worker secret까지 자동 동기화합니다.
Kakao Developers에서 어떤 값을 가져와야 하는지는 [D:\Code305\GATTACA\docs\15-kakao-credential-setup.md](D:\Code305\GATTACA\docs\15-kakao-credential-setup.md)를 기준으로 합니다.

프론트 local/manual build env:

- `VITE_CLOUDFLARE_API_URL`
- `VITE_ADMIN_USER_ID` (선택)
- `VITE_ENABLE_DEMO_MODE`

## 운영 체크

- `wrangler.toml`의 D1 / KV / R2 binding이 실제 리소스와 일치하는지 확인
- [D:\Code305\GATTACA\docs\sql\cloudflare-d1-schema.sql](D:\Code305\GATTACA\docs\sql\cloudflare-d1-schema.sql)을 D1에 적용
- `npm run worker:deploy:dry-run` 통과 확인
- `npm run live:check -- --api-url <workers-url>`로 live binding 상태 확인
- `npm run live:check:kakao -- --api-url <workers-url>`로 Kakao secret 주입 완료 여부 확인
- `npm run pages:deploy`가 정상 동작하는지 확인
- production build에서 demo fallback이 열리지 않는지 확인
- `/api/runtime-status`에서 binding과 Kakao 구성 상태 확인

## 현재 live 상태

확인된 live endpoint:

- Pages: [https://61610380.gattaca-di0.pages.dev/](https://61610380.gattaca-di0.pages.dev/)
- Worker health: [https://gattaca-backend.yhh4433.workers.dev/api/health](https://gattaca-backend.yhh4433.workers.dev/api/health)
- Worker runtime status: [https://gattaca-backend.yhh4433.workers.dev/api/runtime-status](https://gattaca-backend.yhh4433.workers.dev/api/runtime-status)

현재 readback:

- `DB=true`
- `SESSION=true`
- `BUCKET=true`
- `auth.kakaoRestApiKeyConfigured=false`
- `auth.kakaoClientSecretConfigured=false`
- `auth.kakaoOAuthConfigured=false`

즉, 앱은 배포되어 있으나 마지막 외부 블로커는 Kakao Worker secrets입니다.

## Kakao 연동 완료 조건

다음을 모두 확인하면 "카카오 API만 붙이면 되는 수준"에서 실제 Kakao까지 검증한 상태가 됩니다.

1. Worker secrets 주입
2. `/api/runtime-status`에서 `auth.kakaoOAuthConfigured=true`
3. Kakao login redirect / callback / session restore 확인
4. 승인 사용자 event create -> memory upload -> comment -> Kakao relay readback 확인

## 롤백 기준

- 프론트 문제: Cloudflare Pages에서 이전 deployment로 rollback
- Worker 문제: 이전 Worker version으로 되돌리거나 마지막 정상 commit 기준으로 재배포
- DB 문제: D1 schema/migration 변경 이력 기준 수동 rollback
