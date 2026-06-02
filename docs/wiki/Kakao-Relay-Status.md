# Kakao Relay Status

## 구현된 것

- 세션 저장소가 OAuth callback의 Kakao access token을 보관합니다.
- Worker route: `POST /api/notifications/kakao-event`
- 권한: 승인 사용자 또는 운영자만 허용
- 프론트 동작:
  - cloudflare mode -> Worker relay
  - demo mode -> mock only

## 왜 이렇게 바꿨는가

실제 runtime에서는 브라우저가 Kakao Talk API를 직접 호출하면 안 됩니다. 현재 live 경로는 아래와 같습니다.

`Browser -> Worker relay -> Kakao Talk API`

## 실패 규칙

이벤트 저장은 Kakao 전송을 자동 호출하지 않습니다. Kakao 전송은 별도 알림 채널 등록과 명시 전송 기능에서만 수행해야 합니다.

## 검증 명령

```bash
npm run lint
npm run test
npm run build
npm run worker:deploy:dry-run
```

## 남은 live 체크

실제 Worker/Pages 환경에 배포한 뒤, 실제 Kakao 계정으로 end-to-end 전달을 검증해야 합니다.
