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
- Cloudflare Pages에 현재 코드를 배포하면 비민감 환경변수가 없더라도 기본적으로 **데모 모드(Demo Mode)**가 즉각 구동되어 빠르게 열람 및 체험이 가능합니다.
- 데모 모드에서는 화면 구조, 라우팅, 가상 권한 상태 전환, 이벤트/메모리/코멘트 생성/조회 등 전체 UX 흐름을 실시간으로 확인해볼 수 있습니다.

## 실사용 연결 방법
- 다음 자격 증명 및 설정 값을 알맞게 세팅하면 완벽한 실사용 운영 모드가 활성화됩니다.
  - **GitHub Secrets**:
    - `CLOUDFLARE_API_TOKEN` (Cloudflare Pages 배포 러너 인증용)
    - `CLOUDFLARE_ACCOUNT_ID` (Cloudflare Pages 배포 대상 계정 식별용)
  - **GitHub Variables (vars)**:
    - `CLOUDFLARE_API_URL` (Cloudflare Workers 백엔드 에이전트 주소)
    - `ADMIN_USER_ID` (운영자의 고유 ID 문자열)
  - **Cloudflare Workers Secrets**:
    - `KAKAO_REST_API_KEY` (카카오 API 키)
    - `KAKAO_CLIENT_SECRET` (카카오 OAuth 시크릿 키)

## 핵심 아키텍처 및 구현 완료 범위 (R1)
1. **의존성 역전 원칙(DIP) 기반 설계**: UI 비즈니스 정책 레이어와 실제 스토리지 기술을 인터페이스로 완전히 물리 격리.
2. **Cloudflare Native 마이그레이션**: D1 SQL 데이터베이스, R2 스토리지 업로드, KV 글로벌 세션 연동으로 수평 마이그레이션 및 Supabase 의존성 100% 완전 소거.
3. **5단계 다차원 TDD 검증망**: 단위/통합/회귀/스모크/E2E 시나리오로 완벽하게 다져진 19개 자동 테스트 스위트 통과 완료.
4. **Cloudflare Pages 단일 배포 정착**: 무인 CI/CD 배포 파이프라인에서 불필요한 GitHub Pages 레거시 잔재를 전면 삭제하고 오직 Cloudflare Pages로 빌드/배포를 일원화 정착.

## 운영 원칙
- 단톡방의 결정은 단톡방에서 한다.
- 추억열차는 결정된 결과를 기억으로 정리한다.
- 승인된 사용자만 작성 가능하고, 운영자만 삭제한다.

