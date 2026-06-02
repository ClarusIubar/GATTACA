# 10. 테스트와 QA 전략

## 테스트 범위

- 단위 테스트:
  - 홈 화면 핵심 문구 렌더링
  - Kakao 미구성 상태 배너 노출
  - Worker route / auth / upload / relay helper
- 통합 테스트:
  - 이벤트 상세에서 메모리/코멘트 흐름
  - 권한 상태별 버튼 활성/비활성
  - cloudflare mode session bootstrap
- 수동 QA:
  - demo mode 전환
  - Worker runtime-status 확인
  - live Pages 새로고침 및 라우팅

## 테스트 우선순위

1. 비로그인 / 승인대기 / 승인회원 / 운영자 권한 흐름
2. 이벤트 등록 -> 상세 진입 -> 메모리 추가 -> 코멘트 추가
3. 운영자 승인 / 삭제 흐름
4. Kakao secret 미구성 시 UI와 Worker가 fail-closed 하는지 확인

## 품질 기준

- 린트 오류 0건
- 타입 오류 0건
- 핵심 route/state 테스트 통과
- 프로덕션 빌드 통과

## 릴리스 전 필수 검증

- `runtime-status` readback 확인
- live Pages에서 공개 진입 확인
- 관리자 승인 페이지 접근 통제 확인
- SPA 새로고침 대응 확인
- Worker secret 미구성 시 Kakao 로그인 차단 확인

## 현재 기술 부채

- 실계정 Kakao OAuth E2E는 아직 자동화되지 않음
- 이미지 업로드 진행률/실패 재시도 UX 미구현
- live secret 주입 이후 relay 수신 readback은 수동 검증 필요
