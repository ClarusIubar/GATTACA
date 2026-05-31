# 추억열차 (GATTACA)

카카오톡 단체방에서 함께 정한 일정을 기록하고, 그날의 사진과 코멘트를 남기는 메모리얼 웹앱입니다. `추억열차`는 Cloudflare Pages에 배포되는 초고속 프론트엔드와 Cloudflare Workers 기반 에지 백엔드(D1 SQL, R2 스토리지, KV 세션)를 조합해, 단체방 구성원 중심의 추억 기록 공간을 만드는 것을 목표로 합니다.

## 핵심 기능

- **확정된 이벤트 등록**: 언제, 어디서, 무엇을, 어떻게 할지 기록
- **이벤트별 메모리 등록**: 사진과 코멘트가 달린 기록 작성
- **승인 기반 권한 통제**: 승인대기(`PENDING`), 승인회원(`APPROVED`), 운영자(`ADMIN`) 계정별 세밀한 권한 통제
- **에지 서버리스 아키텍처**: Cloudflare 인프라를 활용하여 서버 유지보수 비용을 0원에 가깝게 극소화
- **Cloudflare Pages 배포**: GitHub Actions와 연동된 글로벌 무인 배포 최적화

## 기술 구성

- **Frontend**: React 19, TypeScript, Vite
- **Routing**: React Router
- **Backend & Data**: Cloudflare Workers (Edge Gateway), Cloudflare D1 (SQL DB), Cloudflare R2 (Object Storage), Cloudflare KV (Global Session)
- **Deployment**: Cloudflare Pages (Frontend) & Cloudflare Workers (Backend Gateway)
- **Testing**: Vitest, Testing Library

## 실행 방법

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

GitHub Variables(`vars`)에 비민감 설정 변수들을 보관하고, 빌드 파이프라인에서 자동으로 접두사를 매핑해 인라이닝합니다. 로컬 실행을 위해서는 `.env.local` 파일을 생성하여 수동 주입할 수 있습니다:

```bash
VITE_CLOUDFLARE_API_URL=https://gattaca-backend.your-subdomain.workers.dev
VITE_ADMIN_USER_ID=your-admin-user-id-here
```

### 3. 개발 서버 실행

```bash
npm run dev
```

환경변수가 없으면 앱은 읽기 중심의 **데모 모드(Demo Mode)**로 동작합니다. 데모 모드에서는 헤더에서 `방문자 / 승인대기 / 승인회원 / 운영자` 상태를 전환하며 권한 흐름 및 UI를 실시간으로 간편히 검증할 수 있습니다.

## Cloudflare Native 설정

- **D1 Database 스키마**: D1 SQL 대시보드 또는 Wrangler CLI를 경유해 테이블 마이그레이션 적용
- **R2 Storage**: `memory-photos` 버킷을 생성하여 실제 사진 자산 적재 및 퍼블릭 CDN 연동
- **KV Namespace**: `SESSION` 바인딩을 생성하여 무상태 에지 세션 정보 및 토큰 보관
- **Workers Secrets**: 카카오 API 민감 보안 키(`KAKAO_REST_API_KEY`, `KAKAO_CLIENT_SECRET`)는 깃허브가 아닌 Workers Secrets 영역에 직접 암호화 락다운 주입

## 배포

GitHub Actions 워크플로우는 `main` 브랜치 푸시 시 정적 에셋 빌드 검증을 거친 후 Cloudflare Pages로 즉각 자동 배포합니다.

- **워크플로우**: [.github/workflows/deploy.yml](./.github/workflows/deploy.yml)
- **보안 격리 정책**:
  - **GitHub Secrets (배포 권한 - 단 2개!)**: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
  - **GitHub Variables (설정 변수 - vars)**: `CLOUDFLARE_API_URL`, `ADMIN_USER_ID`

## 권한 모델

- **비로그인 사용자**: 홈, 소개, 이벤트 목록 및 상세 정보 열람 가능
- **승인 대기 사용자 (PENDING)**: 열람은 가능하나, 추가 작성이 엄격히 제한되며 승인 대기 안내 메시지 노출
- **승인 사용자 (APPROVED)**: 이벤트, 메모리, 코멘트를 원활히 생성 및 수정 가능
- **운영자 (ADMIN)**: 승인 대기 회원 등급 심사 승인/반려 권한 및 모든 부적절한 데이터 강제 영구 삭제 가능

카카오톡 단체방 연동은 v1에서 자동화하지 않으며, 단체방에서 결정된 결과를 `추억열차`에 기록하는 운영 흐름으로 정의합니다.

## 문서 링크

- **중앙 정책**: [docs/00-human-ai-collaboration-policy.md](./docs/00-human-ai-collaboration-policy.md)
- **비전**: [docs/01-vision-success-metrics.md](./docs/01-vision-success-metrics.md)
- **PRD/백로그**: [docs/04-prd-backlog.md](./docs/04-prd-backlog.md)
- **UI/UX**: [docs/05-ui-ux-design-system.md](./docs/05-ui-ux-design-system.md)
- **아키텍처**: [docs/06-architecture-data-model.md](./docs/06-architecture-data-model.md)
- **기술 스택**: [docs/07-tech-stack-dev-env.md](./docs/07-tech-stack-dev-env.md)
- **워크플로우**: [docs/08-workflow-coding-standards.md](./docs/08-workflow-coding-standards.md)
- **AI 활용**: [docs/09-ai-strategy-prompts.md](./docs/09-ai-strategy-prompts.md)
- **테스트/QA**: [docs/10-test-qa-strategy.md](./docs/10-test-qa-strategy.md)
- **배포/운영**: [docs/11-deployment-cicd-operations.md](./docs/11-deployment-cicd-operations.md)
- **회고/개선**: [docs/12-retrospective-improvement.md](./docs/12-retrospective-improvement.md)
- **GitHub Wiki**: [docs/wiki/Home.md](./docs/wiki/Home.md)

