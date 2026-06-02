# 16. SDD 추적성

이 문서는 Spec-Driven Development 관점에서 문서 요구사항, 구현 파일, 테스트 증거, Wiki 원본을 연결한다. 구현 완료 주장은 아래 증거가 현재 상태와 일치할 때만 가능하다.

## 요구사항-구현 매핑

| 요구사항 | 문서 근거 | 구현 근거 | 테스트/검증 근거 | 상태 |
| --- | --- | --- | --- | --- |
| 정적 React 웹앱으로 추억열차 제공 | README, docs/04 | `src/App.tsx`, `src/pages/HomePage.tsx` | `npm run build` | 진행 |
| 데스크톱/모바일 반응형 웹페이지 | docs/05 | `src/index.css`, `src/pages/*.tsx` | `npm run test:unit`, `npm run build`, Figma frame evidence | 진행 |
| 정거장형 일정 기록 | docs/04, docs/05 | `src/pages/SubmitPage.tsx`, `src/pages/EventsPage.tsx` | `npm run test:e2e` | 진행 |
| 상세에서 사진/메모리/코멘트 기록 | docs/04, docs/05 | `src/pages/EventDetailPage.tsx`, repository/worker CRUD | `npm run test:e2e`, `npm run test:integration` | 진행 |
| 승인 사용자 CRU, 운영자 delete | docs/04, docs/06 | `src/lib/app-context.tsx`, Worker authorization | `npm run test:integration` | 진행 |
| production demo fallback 차단 | docs/10, docs/11 | `src/lib/env.ts`, `src/App.setup.test.tsx` | `npm run test:regression` | 진행 |
| Kakao OAuth/relay 경계 | docs/14, docs/15 | Worker auth routes, notification relay | `npm run test:unit`, `npm run test:integration` | 진행 |
| GitHub Wiki 반영 | docs/wiki | `docs/wiki/*.md` | Wiki sync diff/commit 확인 | 진행 |

## 이번 변경 증거: TSK-002-09

- Issue: https://github.com/ClarusIubar/GATTACA/issues/22
- Branch: `tsk-002-09-responsive-figma-implementation`
- Figma file: https://www.figma.com/design/Y0KrDckzTd6Fjh4Jbi2ld6
- Figma nodes: `5:3`, `5:65`
- Responsibility map: UI는 표시/입력 흐름, app-context는 권한 seam, repository/worker는 데이터와 서버 권한.
- Dependency direction: page -> app-context -> repository -> Worker. UI에서 D1/R2/KV/Kakao를 직접 호출하지 않는다.
- Test seam: demo persona, DemoRepository, CloudflareRepository, Worker fake bindings.
- Scope map: App shell, Home, Events, Detail, Submit, About, Admin 문구/반응형/테스트. Worker/DB/OAuth 스키마 변경 없음.
- Architecture risk: CSS 전면 교체는 visual regression 위험이 있으므로 unit/e2e/build와 live readback이 필요하다.

## 검증 명령

- `npm run lint`
- `npm run test:unit`
- `npm run test:integration`
- `npm run test:regression`
- `npm run test:e2e`
- `npm run build`
- `npm run test`
- 배포 후 `npm run test:smoke`

## 책임 지점

- Frontend UI: `src/pages/*`, `src/App.tsx`, `src/index.css`
- Client state and authorization seam: `src/lib/app-context.tsx`
- Data access boundary: `src/lib/repository.ts`
- Server authority: `worker/*`
- Deployment and live readback: `.github/workflows/deploy.yml`, `scripts/live-check.mjs`
- Source documents: `docs/*.md`, `docs/wiki/*.md`

## 완료 판단

SDD 완료는 문서가 존재하는 것만으로 판단하지 않는다. PR merge, production deploy, live readback, smoke evidence가 함께 있어야 한다.
