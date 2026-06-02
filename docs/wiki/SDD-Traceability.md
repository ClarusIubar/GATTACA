# SDD Traceability

이 페이지는 `docs/16-sdd-traceability.md`의 Wiki 요약본이다.

## 요구사항 매핑

| 요구사항 | 구현 | 검증 |
| --- | --- | --- |
| 데스크톱/모바일 반응형 웹페이지 | `src/index.css`, Home/Events/Detail/Submit/About/Admin | `npm run test:unit`, `npm run build` |
| 정거장형 일정 기록 | `src/pages/SubmitPage.tsx`, `src/pages/EventsPage.tsx` | `npm run test:e2e` |
| 날짜/시간 분리 입력 | `src/pages/SubmitPage.tsx` | `npm run test:e2e` |
| native time input 제거와 시/분 선택 입력 | `src/pages/SubmitPage.tsx` | `npm run test:e2e` |
| 사진/메모리/코멘트 기록 | `src/pages/EventDetailPage.tsx`, Worker CRUD | `npm run test:e2e`, `npm run test:integration` |
| 승인 사용자 CRU, 운영자 delete | `src/lib/app-context.tsx`, Worker authorization | `npm run test:integration` |
| production demo fallback 차단 | `src/lib/env.ts`, setup tests | `npm run test:regression` |
| 배포 readback | GitHub Actions, `scripts/live-check.mjs` | `npm run test:smoke` |

## TSK-002-11 Evidence

- Issue: https://github.com/ClarusIubar/GATTACA/issues/25
- Scope: `/submit` 날짜/시간 입력을 분리하고 기존 `eventAt` payload contract를 유지한다.
- Test seam: E2E가 `날짜`와 `시간` 입력을 별도로 채운다.
- Required live readback: production `/submit` asset에서 `시간` 입력 marker 확인.

## TSK-002-12 Evidence

- Issue: https://github.com/ClarusIubar/GATTACA/issues/27
- Scope update: keep `_redirects` and remove the top-level custom `404.html` so Cloudflare Pages serves the React app shell on direct nested routes.
- Scope: Cloudflare Pages SPA direct route fallback.
- Required live readback: `/events`, `/submit`, `/about` direct status 200 and `/api/runtime-status` status 200.

## TSK-002-13 Evidence

- Issue: https://github.com/ClarusIubar/GATTACA/issues/35
- Scope: `/submit` 시간 입력에서 native `input[type="time"]`을 제거하고 `시`/`분` select로 교체한다.
- Test seam: E2E가 `시간` input 부재와 `시`/`분` 선택을 검증한다.
- Required live readback: production `/submit` asset에서 `eventHour`/`eventMinute` marker 확인.

## TSK-002-10 Follow-up

- Issue: https://github.com/ClarusIubar/GATTACA/issues/24
- Scope: `/events` visual refinement.
- Status: not implemented yet.

## 완료 판단

SDD 완료는 문서 존재만으로 판단하지 않는다. PR merge, production deploy, live smoke readback까지 evidence로 남긴다.
