# 07. 기술 스택과 개발 환경

## 계층별 기술 선택

| 계층 | 기술 / 버전 | 선택 이유 |
| --- | --- | --- |
| 프론트엔드 | React 19, TypeScript, Vite 8 | 빠른 개발 경험과 정적 배포 적합성 |
| 라우팅 | React Router 7 | SPA 라우트 구성 |
| 데이터 계층 | Supabase JS 2 | Auth, DB, Storage 통합 |
| 인증 | Supabase Auth + Kakao | 카카오 계정 기반 식별 |
| 배포 | GitHub Pages, GitHub Actions | 정적 배포 자동화 |
| 테스트 | Vitest, Testing Library | 빠른 UI 검증 |

## 버전 정책
- Node: 프로젝트 설치 버전에 맞춰 LTS 사용
- 패키지 매니저: npm
- 주요 의존성은 lockfile 기준 고정
- 업데이트 주기: 기능 단위 안정화 후 분기 점검

## 환경 분리
- 로컬 개발: 데모 모드 또는 Supabase 개발 프로젝트
- 테스트: Vitest 기반 프론트엔드 테스트
- 프로덕션: GitHub Pages + Supabase 운영 프로젝트
