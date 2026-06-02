# 14. Kakao Relay Status

## 범위

이 문서는 Worker 인증, CRUD, 업로드, 서버 권한 강제가 이미 들어간 뒤 `TSK-002-07`에서 추가한 Kakao relay 경계를 기록합니다.

## 구현된 것

- Kakao OAuth callback이 받은 Kakao access token을 Worker KV session record에 저장합니다.
- Worker route `POST /api/notifications/kakao-event`가 검증된 Kakao 템플릿을 Kakao Talk memo API로 relay 합니다.
- relay 권한은 서버에서 강제합니다.
  - 승인 사용자
  - 운영자
- Cloudflare runtime의 이벤트 생성 후 Worker relay를 호출합니다.
- demo mode는 여전히 mock 전용이며, live Kakao 전송처럼 보이게 하지 않습니다.

## 실패 동작

- 이벤트 생성이 실패하면 relay 호출을 시도하지 않습니다.
- 이벤트 저장은 성공했지만 Kakao 전송이 실패하면 UI는 "부분 성공"으로 보고합니다.
- 세션에 Kakao access token이 없으면 Worker는 fail-closed로 relay 전송을 거부합니다.

## 검증

- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run worker:deploy:dry-run`

## 남은 live 체크

- 실제 Cloudflare Worker/Pages 환경에 배포
- 실제 Kakao 계정으로 로그인
- 승인 사용자 세션에서 이벤트 생성
- Kakao Talk이 relay 경로로 메모 알림을 수신하는지 확인
