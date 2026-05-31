# 추억열차 Wiki

추억열차는 카카오톡 단체방에서 확정된 일정과 행사 후 추억을 기록하는 메모리얼 웹앱입니다.

## 빠른 링크
- PRD: [PRD](PRD)
- 설계/아키텍처: [Architecture](Architecture)
- 개발기록: [Development-Log](Development-Log)
- 운영정책: [Operations-Policy](Operations-Policy)
- 배포/환경설정: [Deployment-Setup](Deployment-Setup)
- 런치 체크리스트: [Launch-Checklist](Launch-Checklist)
- 인프라 사양 및 연동 가이드: [Infrastructure-Specification](Infrastructure-Specification)

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

## 미구현 항목 및 차기 개발 로드맵

현재 R1 마일스톤(아키텍처 분리 및 5단계 TDD 구축)을 성공적으로 완수하였으며, 실서버 상용 릴리즈를 위해 구현해야 할 잔여 및 차기 과제는 다음과 같습니다.

### 1. ⚠️ 아직 구현되지 않은 것 (Out of Scope / Residuals)
- **실서버 Supabase API 바인딩**: 현재 모킹 및 LocalStorage 기반인 `DemoRepository` 단계에 머물러 있으며, 실제 Supabase PostgreSQL 서버와의 쿼리 통신 및 핑 상태 검증이 완료되지 않았습니다.
- **카카오 OAuth 소셜 로그인 연동**: 데모 권한 강제 전환 외에 실제 카카오 Developers 계정과 연계된 사용자 인증 및 로그인 세션 획득이 구현 대기 상태입니다.
- **사진 업로드 스토리지 연동**: Supabase Storage 연계를 통한 실제 추억 이미지 업로드, 이미지 CDN 서빙 기능이 결여되어 있습니다.

### 2. 🚀 바로 다음에 구현해야 할 로드맵 (Immediate Next Action Items)
- **`TSK-001-02`**: Supabase 실제 BaaS 연동 및 스키마/마이그레이션 설정 (이슈: [#4](https://github.com/ClarusIubar/GATTACA/issues/4))
  - 스토리지 인터페이스 규격에 맞춰 PostgreSQL 스키마(사용자, 메모리, 코멘트 테이블 등) 마이그레이션 및 RLS(Row Level Security) 실 가드 규칙 구축.
- **`TSK-001-03`**: 카카오 OAuth 소셜 로그인 및 사용자 권한 가드 연동 (이슈: [#5](https://github.com/ClarusIubar/GATTACA/issues/5))
  - 카카오 REST API 기반 인가 코드를 프론트엔드로 수신하고, 로그인 시 사용자 등급을 승인 대기 회원(`PENDING`) 상태로 신규 가입 및 가드 연동 구현.
- **`TSK-001-04`**: Supabase Storage 기반 사진 메모리 업로드 및 CDN 최적화 연동 (이슈: [#6](https://github.com/ClarusIubar/GATTACA/issues/6))
  - 프론트 이미지 파일 업로드 컴포넌트, 용량(5MB 제한) 및 MIME 포맷 검증 가드 로직 및 API 구현.
- **`TSK-001-05`**: 운영자(ADMIN) 전용 회원 등급 승인 및 부적절 콘텐츠 삭제 UI 구현 (이슈: [#7](https://github.com/ClarusIubar/GATTACA/issues/7))
  - 운영자 등급 판단 및 가입 대기 회원 승인 관리 대시보드 UI, 글/사진/코멘트 강제 영구 삭제 API 결합.
- **`TSK-001-06`**: 모임 일정 확정 시 카카오 알림톡/메시지 템플릿 자동 발송 구현 (이슈: [#8](https://github.com/ClarusIubar/GATTACA/issues/8))
  - 모임 일정 신규 개설 시 백엔드 Worker를 거쳐 멤버들 단톡방/개인톡으로 전송 알림톡 API 트리거 연동.
- **`TSK-001-07`**: GitHub Actions CI/CD 워크플로우 구성 및 Cloudflare 자동 배포 활성화 (이슈: [#9](https://github.com/ClarusIubar/GATTACA/issues/9))
  - 테스트 무결 검증 후 Pages/Workers 자동 무인 배포를 위한 CI/CD 워크플로우 파이프라인 구성.

## 운영 원칙
- 단톡방의 결정은 단톡방에서 한다.
- 추억열차는 결정된 결과를 기억으로 정리한다.
- 승인된 사용자만 작성 가능하고, 운영자만 삭제한다.
