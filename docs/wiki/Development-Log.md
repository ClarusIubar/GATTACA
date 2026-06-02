# 개발기록

이 문서는 저장소의 구현 흐름을 GitHub Wiki에 반영하기 위한 요약 원본이다. 자세한 source-of-truth는 `docs/` 문서와 GitHub issue를 따른다.

## 2026-06-02

### TSK-002-01 Worker foundation

- `wrangler.toml` 추가.
- Worker entry와 라우터 추가.
- `/api/health`, `/api/session` foundation 추가.
- `public/_redirects` 추가.
- `worker:deploy:dry-run` 기준 배포 가능성 확인.

### TSK-002-02 D1 CRUD

- D1 repository 추가.
- `profiles`, `events`, `memories`, `comments` CRUD route 연결.
- fake D1 기반 route/repository 테스트 추가.

### TSK-002-03 Kakao OAuth / KV Session

- `GET /api/auth/kakao`
- `GET /api/auth/callback`
- `GET /api/session`
- `POST /api/auth/logout`
- Kakao code exchange -> 사용자 조회 -> D1 profile upsert -> KV session 생성 흐름 구현.

### TSK-002-04 R2 Upload

- `POST /api/upload`
- `GET /uploads/<objectKey>`
- JPEG / PNG / WEBP + 5MB 제한 검증.
- 메모리 사진이 실제 Worker/R2 경로로 저장되도록 구성.

### TSK-002-05 Server Authorization

- 승인 사용자와 운영자 권한 강제.
- 세션 사용자와 D1 owner lookup 기준으로 update/delete/approval 강제.
- request body 권한 위조를 신뢰하지 않도록 정리.

### TSK-002-06 Demo fallback 격리

- runtime mode를 `cloudflare / demo / setup`으로 분리.
- production에서 demo fallback이 실제 서비스처럼 보이지 않도록 차단.
- Kakao 미구성 상태를 setup blocker와 UI 경고로 명시.

### TSK-002-07 Kakao Relay

- Kakao access token을 session record에 저장.
- `POST /api/notifications/kakao-event` 추가.
- 브라우저가 직접 Kakao API를 치지 않고 Worker relay를 사용하도록 변경.
- 이벤트 저장 성공과 Kakao 전송 실패를 분리해 보고.

### TSK-002-08 UI/UX, TDD, SDD 보강

- 홈, 목록, 상세, 등록, 소개 화면을 추억열차 정거장/노선 콘셉트로 정리.
- 깨진 사용자 문구를 정상 한국어 계약으로 교체.
- `test:unit`, `test:integration`, `test:regression`, `test:e2e`, `test:smoke` 스크립트 계층을 명시.
- e2e는 데모 승인 사용자 기준으로 일정 등록 -> 상세 진입 -> 메모리 작성 -> 코멘트 작성 흐름을 검증.
- `docs/16-sdd-traceability.md`와 `SDD-Traceability` Wiki 원본을 추가.

## 현재 live 기준 확인 대상

- Production: [https://gattaca.jamissue.com/](https://gattaca.jamissue.com/)
- Runtime status: [https://gattaca.jamissue.com/api/runtime-status](https://gattaca.jamissue.com/api/runtime-status)
- Auth callback: [https://gattaca.jamissue.com/api/auth/callback](https://gattaca.jamissue.com/api/auth/callback)

## 다음 검증 순서

1. PR에서 lint/unit/integration/regression/e2e/build 통과.
2. main merge.
3. production deploy.
4. live smoke readback.
5. 실제 Kakao OAuth redirect/callback/session restore 확인.
