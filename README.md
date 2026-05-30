# 추억열차

카카오톡 단체방에서 함께 정한 일정을 기록하고, 그날의 사진과 코멘트를 남기는 메모리얼 웹앱입니다. `추억열차`는 GitHub Pages에 배포되는 정적 프론트엔드와 Supabase 기반 인증/데이터 계층을 조합해, 단체방 구성원 중심의 추억 기록 공간을 만드는 것을 목표로 합니다.

## 핵심 기능

- 확정된 이벤트 등록: 언제, 어디서, 무엇을, 어떻게 할지 기록
- 이벤트별 메모리 등록: 사진과 코멘트가 달린 기록 작성
- 승인 기반 권한 통제: 승인된 사용자만 Create/Read/Update, 운영자만 Delete
- 운영 문서 체계: Dodecagon Dev Framework 기준 문서 세트 제공
- GitHub Pages 배포: 정적 호스팅으로 운영 가능한 프론트엔드 구성

## 기술 구성

- Frontend: React 19, TypeScript, Vite
- Routing: React Router
- Backend as a Service: Supabase Auth, Database, Storage
- Deployment: GitHub Pages + GitHub Actions
- Testing: Vitest, Testing Library

## 실행 방법

1. 의존성 설치

```bash
npm install
```

2. 환경변수 설정

`.env.example`를 참고해 `.env.local` 파일을 생성합니다.

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_ADMIN_USER_ID=
```

3. 개발 서버 실행

```bash
npm run dev
```

환경변수가 없으면 앱은 읽기 중심의 데모 모드로 동작합니다. 데모 모드에서는 헤더에서 `방문자 / 승인대기 / 승인회원 / 운영자` 상태를 전환하며 권한 흐름을 검증할 수 있습니다.

## Supabase 설정

- SQL 스키마: [docs/sql/supabase-schema.sql](./docs/sql/supabase-schema.sql)
- Kakao 로그인 설정: [docs/11-deployment-cicd-operations.md](./docs/11-deployment-cicd-operations.md)
- 운영 아키텍처: [docs/06-architecture-data-model.md](./docs/06-architecture-data-model.md)

필수 준비 사항:

- Supabase 프로젝트 생성
- Authentication에서 Kakao provider 연결
- Storage에 `memory-photos` 버킷 생성
- SQL 스키마 실행
- `VITE_ADMIN_USER_ID`에 운영자 Auth User ID 등록

## 배포

GitHub Actions 워크플로우는 `main` 브랜치 푸시 시 Pages 아티팩트를 빌드하고 배포합니다.

- 워크플로우: [.github/workflows/deploy.yml](./.github/workflows/deploy.yml)
- Vite `base`는 GitHub Actions 환경에서 `/GATTACA/`를 사용하도록 설정되어 있습니다.
- SPA 라우팅 새로고침 대응을 위해 `index.html`과 `public/404.html`에 GitHub Pages redirect 스크립트를 포함했습니다.

## 권한 모델

- 비로그인 사용자: 홈, 소개, 이벤트 목록/상세 조회 가능
- 승인 대기 사용자: 열람 가능, 작성 불가
- 승인 사용자: 이벤트, 메모리, 코멘트 생성/수정 가능
- 운영자: 승인/반려, 전체 삭제 가능

카카오톡 단체방 연동은 v1에서 자동화하지 않으며, 단체방에서 결정된 결과를 `추억열차`에 기록하는 운영 흐름으로 정의합니다.

## 문서 링크

- 중앙 정책: [docs/00-human-ai-collaboration-policy.md](./docs/00-human-ai-collaboration-policy.md)
- 비전: [docs/01-vision-success-metrics.md](./docs/01-vision-success-metrics.md)
- PRD/백로그: [docs/04-prd-backlog.md](./docs/04-prd-backlog.md)
- UI/UX: [docs/05-ui-ux-design-system.md](./docs/05-ui-ux-design-system.md)
- 아키텍처: [docs/06-architecture-data-model.md](./docs/06-architecture-data-model.md)
- 기술 스택: [docs/07-tech-stack-dev-env.md](./docs/07-tech-stack-dev-env.md)
- 워크플로우: [docs/08-workflow-coding-standards.md](./docs/08-workflow-coding-standards.md)
- AI 활용: [docs/09-ai-strategy-prompts.md](./docs/09-ai-strategy-prompts.md)
- 테스트/QA: [docs/10-test-qa-strategy.md](./docs/10-test-qa-strategy.md)
- 배포/운영: [docs/11-deployment-cicd-operations.md](./docs/11-deployment-cicd-operations.md)
- 회고/개선: [docs/12-retrospective-improvement.md](./docs/12-retrospective-improvement.md)
- GitHub Wiki 원고: [docs/wiki/Home.md](./docs/wiki/Home.md)

## 현재 구현 범위

- v1 프론트엔드 화면과 권한 흐름
- Supabase 연동용 클라이언트/데이터 액션
- 데모 모드 기반 UX 검증 흐름
- 문서, 위키 원고, 스키마, 배포 워크플로우

향후 확장:

- 카카오 공유 문구 자동 생성
- 다중 운영자 권한
- Supabase Storage 업로드 진행률 표시
- 실사용 운영 대시보드와 감사 로그
