# SDD Traceability

이 Wiki 페이지는 `docs/16-sdd-traceability.md`의 요약본이다.

## 요구사항 매핑

| 요구사항 | 구현 | 검증 |
| --- | --- | --- |
| 정거장형 일정 기록 | `src/pages/SubmitPage.tsx`, `src/pages/EventsPage.tsx` | `npm run test:e2e` |
| 사진/메모리/코멘트 기록 | `src/pages/EventDetailPage.tsx`, Worker CRUD | `npm run test:e2e`, `npm run test:integration` |
| 승인 사용자 CRU, 운영자 delete | `src/lib/app-context.tsx`, Worker authorization | `npm run test:integration` |
| production demo fallback 차단 | `src/lib/env.ts`, setup tests | `npm run test:regression` |
| UI/UX 고도화 | Home/Events/Detail/Submit/About, CSS | `npm run test:unit`, 수동 UI 확인 |
| 배포 readback | GitHub Actions, `scripts/live-check.mjs` | `npm run test:smoke` |

## 검증 명령

- `npm run lint`
- `npm run test:unit`
- `npm run test:integration`
- `npm run test:regression`
- `npm run test:e2e`
- `npm run build`
- `npm run test:smoke`

## 완료 판단

SDD 완료는 문서가 존재하는 것만으로 판단하지 않는다. 각 요구사항이 코드, 테스트, live readback 또는 PR evidence로 증명되어야 한다.
