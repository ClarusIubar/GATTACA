# 13. 런치 체크리스트

## A. Cloudflare 공개 기본형 체크리스트

- [ ] `main` 브랜치에 현재 코드가 반영되어 있다.
- [ ] 원격 저장소 `origin`에 푸시되어 있다.
- [ ] GitHub Actions 권한이 활성화되어 있다.
- [ ] Worker 배포가 성공했다.
- [ ] Pages 배포가 성공했다.
- [ ] Pages URL에서 홈, 이벤트 목록, 상세 페이지가 열린다.
- [ ] 새로고침 시 404 없이 SPA 라우팅이 유지된다.

## B. Cloudflare 리소스 체크리스트

- [ ] D1 데이터베이스가 생성되어 있다.
- [ ] KV 세션 저장소가 생성되어 있다.
- [ ] R2 버킷이 생성되어 있다.
- [ ] [docs/sql/cloudflare-d1-schema.sql](./sql/cloudflare-d1-schema.sql)을 적용했다.
- [ ] `wrangler.toml` 바인딩이 실제 리소스와 일치한다.

## C. Kakao 로그인 연결 체크리스트

- [ ] Kakao Developers에서 앱을 생성했다.
- [ ] Kakao 로그인 기능을 활성화했다.
- [ ] 앱 설정 > 앱 키에서 REST API key를 확인했다.
- [ ] 해당 값을 `KAKAO_REST_API_KEY`로 등록했다.
- [ ] 카카오 로그인 > 보안 또는 REST API key 상세 설정에서 Client secret code를 확인했다.
- [ ] 해당 값을 `KAKAO_CLIENT_SECRET`로 등록했다.
- [ ] Worker callback URL을 Kakao Redirect URI로 등록했다.
- [ ] 첫 운영자 계정으로 로그인해 `auth_user_id`를 확인했다.
- [ ] 해당 값을 `ADMIN_AUTH_USER_ID` 또는 운영자 정책으로 정리했다.

## D. GitHub / Build 변수 체크리스트

- [ ] 저장소 Settings > Secrets and variables > Actions 에 아래 값을 등록했다.
- [ ] `CLOUDFLARE_API_TOKEN`
- [ ] `CLOUDFLARE_ACCOUNT_ID`
- [ ] `KAKAO_REST_API_KEY`
- [ ] `KAKAO_CLIENT_SECRET`
- [ ] 필요 시 `VITE_ADMIN_USER_ID`

## E. 운영 검증 체크리스트

- [ ] 비로그인 사용자는 공개 읽기만 가능한지 확인했다.
- [ ] 첫 로그인 사용자가 pending 상태로 생성되는지 확인했다.
- [ ] 운영자 승인 전에는 작성이 차단되는지 확인했다.
- [ ] 승인 후 이벤트 등록이 가능한지 확인했다.
- [ ] 메모리 등록과 코멘트 등록이 가능한지 확인했다.
- [ ] 운영자만 삭제 가능한지 확인했다.
- [ ] Kakao relay가 Worker 경유로만 동작하는지 확인했다.

## F. 릴리스 직전 최종 확인

- [ ] `npm run lint` 통과
- [ ] `npm run test` 통과
- [ ] `npm run build` 통과
- [ ] `npm run live:check -- --api-url <workers-url>` 통과
- [ ] `auth.kakaoOAuthConfigured=true` readback 확인
- [ ] README와 Wiki 설정 설명이 최신 상태다.
