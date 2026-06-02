# 추억열차 Wiki

추억열차는 카카오톡 단체방에서 이미 결정된 일정과 그날의 사진, 코멘트를 남기는 메모리얼 서비스입니다.

현재 구현은 GitHub Wiki의 기획 의도 기준으로 다음 범위까지 도달했습니다.

- Cloudflare Pages 프론트엔드
- Cloudflare Workers 백엔드
- D1 기반 이벤트 / 메모리 / 코멘트 CRUD
- KV 기반 세션
- R2 기반 사진 업로드
- 승인 사용자 CRU / 운영자 delete 권한 강제
- Kakao OAuth 및 Kakao relay 경계 구현

마지막 남은 단계는 실제 Kakao Worker secrets 주입과 live OAuth 수신 검증입니다.

## 빠른 링크

- PRD: [PRD](PRD)
- 설계/아키텍처: [Architecture](Architecture)
- 인프라 명세: [Infrastructure-Specification](Infrastructure-Specification)
- 배포 설정: [Deployment-Setup](Deployment-Setup)
- Kakao 키 설정: [Kakao-Credential-Setup](Kakao-Credential-Setup)
- 런치 체크리스트: [Launch-Checklist](Launch-Checklist)
- 운영 정책: [Operations-Policy](Operations-Policy)
- 개발 기록: [Development-Log](Development-Log)
- Kakao relay 상태: [Kakao-Relay-Status](Kakao-Relay-Status)

## 현재 live 상태

- Pages latest verified deployment:
  - [https://61610380.gattaca-di0.pages.dev/](https://61610380.gattaca-di0.pages.dev/)
- Worker verified health:
  - [https://gattaca-backend.yhh4433.workers.dev/api/health](https://gattaca-backend.yhh4433.workers.dev/api/health)
- Worker runtime readiness:
  - [https://gattaca-backend.yhh4433.workers.dev/api/runtime-status](https://gattaca-backend.yhh4433.workers.dev/api/runtime-status)

현재 `runtime-status` 기준:

- `bindings.db = true`
- `bindings.session = true`
- `bindings.bucket = true`
- `auth.kakaoRestApiKeyConfigured = false`
- `auth.kakaoClientSecretConfigured = false`
- `auth.kakaoOAuthConfigured = false`

즉 Cloudflare 인프라는 live로 붙어 있지만, Kakao OAuth secret은 아직 주입되지 않았습니다.

## 지금 가능한 것

- 공개 페이지 렌더링 확인
- 이벤트 / 메모리 / 코멘트 구조 확인
- production에서 demo fallback 없이 live 배포 상태 확인
- Kakao 미구성 상태가 UI에서 명확히 드러나는지 확인

## 아직 남아 있는 것

- 실제 Kakao 로그인 redirect/callback
- live 세션 생성 readback
- 실제 Kakao memo relay 수신 확인

이 단계는 Cloudflare Worker secrets 주입 후 바로 검증할 수 있습니다.

## 필요한 설정값

GitHub Secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Frontend local/manual build env:

- `VITE_CLOUDFLARE_API_URL`
- `VITE_ADMIN_USER_ID` (선택)
- `VITE_ENABLE_DEMO_MODE`

Worker vars/secrets:

- `ADMIN_AUTH_USER_ID` (선택)
- `KAKAO_REST_API_KEY`
- `KAKAO_CLIENT_SECRET`

## 구현 완료 경계

현재 평가는 다음과 같습니다.

- "카카오 API만 붙이면 되는 수준"까지는 이미 도달
- 실제 Kakao account 기준 end-to-end 완료는 아직 미검증

따라서 지금은 완료 직전 상태이고, 남은 것은 secret 주입 후 live readback입니다.
