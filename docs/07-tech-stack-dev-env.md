# 07. 기술 스택과 개발 환경

## 계층별 기술 선택

| 계층 | 기술 / 버전 | 선택 이유 |
| --- | --- | --- |
| 프론트엔드 | React 19, TypeScript, Vite 8 | 빠른 개발 경험과 정적 배포 적합성 |
| 라우팅 | React Router 7 | SPA 라우트 구성 |
| 백엔드 | Cloudflare Workers | 인증, CRUD, 업로드, Kakao relay 처리 |
| 데이터 저장 | D1 / R2 / KV | 관계형 데이터, 파일 저장, 세션 분리 |
| 배포 | Cloudflare Pages, GitHub Actions | 프론트와 Worker 배포 자동화 |
| 테스트 | Vitest, Testing Library | 빠른 UI/route/state 검증 |

## 버전 정책

- Node: 프로젝트 lockfile과 현재 툴체인에 맞춘 LTS 사용
- 패키지 매니저: npm
- 주요 의존성은 lockfile 기준 고정
- 업데이트는 기능 단위 안정화 후 진행

## 환경 분리

- 로컬 개발:
  - demo mode 또는 수동 `VITE_CLOUDFLARE_API_URL` 지정
- 테스트:
  - Vitest 기반 프론트/Worker seam 테스트
- 프로덕션:
  - Cloudflare Pages + Cloudflare Workers + D1/R2/KV
