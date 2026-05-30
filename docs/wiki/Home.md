# 추억열차 Wiki

추억열차는 카카오톡 단체방에서 확정된 일정과 행사 후 추억을 기록하는 메모리얼 웹앱입니다.

## 빠른 링크
- PRD: [PRD](PRD)
- 설계/아키텍처: [Architecture](Architecture)
- 개발기록: [Development-Log](Development-Log)
- 운영정책: [Operations-Policy](Operations-Policy)
- 배포/환경설정: [Deployment-Setup](Deployment-Setup)
- 런치 체크리스트: [Launch-Checklist](Launch-Checklist)

## 지금 바로 볼 수 있는 것
- GitHub Pages에 현재 코드를 배포하면 기본형은 바로 볼 수 있습니다.
- 이유:
  - 프론트엔드는 환경변수가 없어도 빌드되도록 되어 있습니다.
  - 환경변수가 없으면 앱은 `데모 모드`로 열립니다.
  - 데모 모드에서는 화면 구조, 라우팅, 권한 상태 전환, 이벤트/메모리/코멘트 UX를 바로 확인할 수 있습니다.

## 키를 넣어야 열리는 기능
- 아래 3개 값을 넣으면 실사용 모드가 열립니다.
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_ADMIN_USER_ID`
- 이 값이 없으면:
  - GitHub Pages에서 기본형은 보임
  - Kakao 로그인, 실제 데이터 저장, 운영자 승인/삭제는 실서버와 연결되지 않음

## 운영 원칙
- 단톡방의 결정은 단톡방에서 한다.
- 추억열차는 결정된 결과를 기억으로 정리한다.
- 승인된 사용자만 작성 가능하고, 운영자만 삭제한다.
