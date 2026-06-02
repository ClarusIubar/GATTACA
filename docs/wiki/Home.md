# 추억열차 Wiki

추억열차는 카카오톡 단체방에서 확정된 일정과 그날의 사진, 메모, 코멘트를 하나의 정거장으로 보관하는 메모리얼 서비스입니다.

## 현재 구현 범위

- Cloudflare Pages 프론트엔드
- Cloudflare Workers 백엔드
- D1 기반 이벤트/메모리/코멘트 CRUD
- KV 기반 세션
- R2 기반 사진 업로드
- 승인 사용자 CRU / 운영자 delete 권한 강제
- Kakao OAuth callback 경계
- Kakao relay endpoint
- 추억열차 콘셉트 기반 홈/목록/상세/등록/소개 UI
- TDD 계층과 SDD 추적 문서

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
- SDD 추적성: [SDD-Traceability](SDD-Traceability)

## live 기준

- Production: [https://gattaca.jamissue.com/](https://gattaca.jamissue.com/)
- Auth callback: [https://gattaca.jamissue.com/api/auth/callback](https://gattaca.jamissue.com/api/auth/callback)
- Runtime status: [https://gattaca.jamissue.com/api/runtime-status](https://gattaca.jamissue.com/api/runtime-status)

## 필요한 설정값

GitHub Secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `KAKAO_REST_API_KEY`
- `KAKAO_CLIENT_SECRET`

Frontend env:

- `VITE_CLOUDFLARE_API_URL`
- `VITE_ADMIN_USER_ID` optional
- `VITE_ENABLE_DEMO_MODE` local/test only

Worker vars/secrets:

- `APP_BASE_URL`
- `SESSION_TTL_SECONDS`
- `ADMIN_AUTH_USER_ID` optional
- `KAKAO_REST_API_KEY`
- `KAKAO_CLIENT_SECRET`

## 완료 기준

추억열차 v1은 단순 정적 껍데기가 아니라 다음 증거를 모두 만족해야 완료로 본다.

- UI가 정거장/노선/메모리 콘셉트로 실제 사용 흐름을 설명한다.
- unit, integration, regression, e2e, build, smoke 검증이 통과한다.
- docs 원본과 Wiki 원본이 구현 범위, 권한, 배포, Kakao 키 설정을 같은 용어로 설명한다.
- main에 머지된 코드가 production domain에 배포된다.
