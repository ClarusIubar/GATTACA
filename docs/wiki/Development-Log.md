# 개발기록

이 문서는 현재 저장소의 구현 흐름을 "실사용 MVP 재구축" 기준으로 다시 정리한 기록입니다. 과거 실험성 Supabase 시도나 중간 프로토타입도 있었지만, 지금 중요하게 봐야 할 것은 `TSK-002` 계열에서 어떤 경계를 실구현했는지입니다.

## 2026-06-02

### TSK-002-01 Worker foundation

- `wrangler.toml` 추가
- Worker 엔트리 및 라우터 추가
- `/api/health`, `/api/session` foundation 추가
- `public/_redirects` 추가
- `worker:deploy:dry-run` 기준 배포 가능성 확인

### TSK-002-02 D1 CRUD

- D1 repository 추가
- `profiles`, `events`, `memories`, `comments` CRUD route 연결
- fake D1 기반 route/repository 테스트 추가
- `docs/sql/cloudflare-d1-schema.sql` 정리

### TSK-002-03 Kakao OAuth / KV Session

- `GET /api/auth/kakao`
- `GET /api/auth/callback`
- `GET /api/session`
- `POST /api/auth/logout`
- Kakao code 교환 -> 사용자 조회 -> D1 profile upsert -> KV session 생성 흐름 구현
- 프론트가 더 이상 "첫 번째 프로필/관리자 자동 선택"을 하지 않도록 정리

### TSK-002-04 R2 Upload

- `POST /api/upload`
- `GET /uploads/<objectKey>`
- JPEG / PNG / WEBP + 5MB 제한 검증
- 메모리 사진을 실제 Worker/R2 경로로 저장

### TSK-002-05 Server Authorization

- 승인 사용자 / 운영자 권한 강제
- 세션 사용자 + D1 owner lookup 기준으로 update/delete/approval 강제
- request body의 `createdBy`, `authorId`, `userId`를 권한 근거로 사용하지 않도록 정리

### TSK-002-06 Demo fallback 격리

- runtime mode를 `cloudflare / demo / setup`으로 분리
- production에서 demo fallback이 실사용처럼 보이지 않도록 차단
- Kakao 미구성 상태를 setup blocker와 UI 경고로 명시

### TSK-002-07 Kakao Relay

- Kakao access token을 session record에 저장
- `POST /api/notifications/kakao-event` 추가
- 브라우저가 직접 Kakao API를 치지 않고 Worker relay를 사용하도록 변경
- 이벤트 저장 성공 / Kakao 전송 실패 시 부분 성공으로 보고
- live readback 기준 문서/위키/체크리스트 정리

## 현재 live 기준 확인된 것

- Pages preview: [https://61610380.gattaca-di0.pages.dev/](https://61610380.gattaca-di0.pages.dev/)
- Worker health: [https://gattaca-backend.yhh4433.workers.dev/api/health](https://gattaca-backend.yhh4433.workers.dev/api/health)
- Worker runtime status: [https://gattaca-backend.yhh4433.workers.dev/api/runtime-status](https://gattaca-backend.yhh4433.workers.dev/api/runtime-status)

현재 확인된 runtime 상태:

- `bindings.db=true`
- `bindings.session=true`
- `bindings.bucket=true`
- `auth.kakaoRestApiKeyConfigured=false`
- `auth.kakaoClientSecretConfigured=false`
- `auth.kakaoOAuthConfigured=false`

## 현재 남은 외부 블로커

- `KAKAO_REST_API_KEY`
- `KAKAO_CLIENT_SECRET`

이 두 값이 live Worker에 주입되면 다음 검증으로 바로 넘어갈 수 있습니다.

1. Kakao login redirect
2. callback / session restore
3. 승인 사용자 event create
4. memory upload
5. comment create
6. Kakao relay 수신 확인
