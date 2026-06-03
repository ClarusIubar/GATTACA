# 16. SDD 추적성

이 문서는 Spec-Driven Development 관점에서 요구사항, 구현 파일, 테스트 증거, GitHub Wiki 원본을 연결한다. 완료 주장은 PR merge, production deploy, live readback, smoke evidence가 맞을 때만 가능하다.

## 요구사항-구현 매핑

| 요구사항 | 문서 근거 | 구현 근거 | 테스트/검증 근거 | 상태 |
| --- | --- | --- | --- | --- |
| 정적 React 웹앱으로 추억열차 제공 | README, docs/04 | `src/App.tsx`, `src/pages/HomePage.tsx` | `npm run build` | 진행 |
| 데스크톱/모바일 반응형 랜딩페이지 | docs/05 | `src/index.css`, `src/pages/*.tsx` | `npm run test:unit`, `npm run build`, Figma evidence | 진행 |
| 정거장형 일정 기록 | docs/04, docs/05 | `src/pages/SubmitPage.tsx`, `src/pages/EventsPage.tsx` | `npm run test:e2e` | 진행 |
| 날짜/시간 분리 입력 | docs/04, docs/05 | `src/pages/SubmitPage.tsx` | `npm run test:e2e` | 완료 |
| native time input 제거와 시/분 선택 입력 | docs/04, docs/05 | `src/pages/SubmitPage.tsx` | `npm run test:e2e`, production `/submit` readback | 완료 |
| 상세에서 사진/메모리/코멘트 기록 | docs/04, docs/05 | `src/pages/EventDetailPage.tsx`, repository/worker CRUD | `npm run test:e2e`, `npm run test:integration` | 진행 |
| 승인 사용자 CRU, 운영자 delete | docs/04, docs/06 | `src/lib/app-context.tsx`, Worker authorization | `npm run test:integration` | 진행 |
| production demo fallback 차단 | docs/10, docs/11 | `src/lib/env.ts`, `src/App.setup.test.tsx` | `npm run test:regression` | 진행 |
| Kakao OAuth/relay 경계 | docs/14, docs/15 | Worker auth routes, notification relay | `npm run test:unit`, `npm run test:integration` | 진행 |
| 이벤트 저장과 Kakao 알림 분리 | docs/14, docs/wiki/PRD | `src/lib/app-context.tsx` | `npm run test:unit`, production `/submit` asset readback | 완료 |
| Cloudflare Pages SPA direct routes | docs/11, docs/13 | `public/_redirects`, removed `public/404.html` | `npm run build`, `npm run test`, `npm run test:smoke`, production readback | 완료 |
| GitHub Wiki 반영 | docs/wiki | `docs/wiki/*.md`, wiki commit | Wiki sync commit 확인 | 진행 |

## TSK-002-11 증거

- Issue: https://github.com/ClarusIubar/GATTACA/issues/25
- PR: https://github.com/ClarusIubar/GATTACA/pull/26
- Merge commit: `b2c45b1180fd11c83500e09ad0de233c0204d2ce`
- Responsibility map: SubmitPage는 날짜/시간 입력과 `eventAt` 합성을 담당하고, AppContext/repository/Worker는 기존 payload contract를 유지한다.
- Dependency direction: SubmitPage -> AppContext only. Worker, D1, R2, Kakao 경계는 변경하지 않는다.
- Test seam: Testing Library E2E가 날짜와 시간을 별도 control로 입력한다.
- Scope map: `src/pages/SubmitPage.tsx`, `src/test/e2e-flow.test.tsx`, docs/wiki traceability.
- Architecture risk: date/time split이 `eventAt` 형식을 깨뜨릴 수 있으므로 E2E에서 등록 후 목록/상세 흐름까지 검증한다.

## TSK-002-12 증거

- Issue: https://github.com/ClarusIubar/GATTACA/issues/27
- 검증 증거: `npm run build`, `npm run test`, `git diff --check`, `npm run test:smoke`, production direct route readback 통과.
- validation evidence: `npm run build`, `npm run test`, `git diff --check`, `npm run test:smoke`, production direct route readback passed.
- PR: https://github.com/ClarusIubar/GATTACA/pull/29
- Merge commit: `77849ad7521489d48130455f0f48a1e35ef469c2`
- Deploy run: `26824441879` success
- CodeQL run: `26824440413` success
- Wiki sync commit: `a5f7eaf`
- Responsibility map: `_redirects` and the absence of a top-level `404.html` own Cloudflare Pages SPA fallback; Worker owns `/api/*`; React owns client routing.
- Dependency direction: Browser -> Pages static fallback -> React app; Browser -> Worker only for `/api/*`.
- Boundary validation: direct React routes return the app shell and `/api/runtime-status` still returns Worker JSON.
- boundary validation: direct React routes return the app shell and `/api/runtime-status` still returns Worker JSON.
- Test seam: production HTTP status readback for `/events`, `/submit`, `/about`, `/api/runtime-status`.
- Validation seam: production HTTP status and response body markers for Pages app shell versus Worker JSON.
- validation seam: production HTTP status and response body markers for Pages app shell versus Worker JSON.
- Scope map: `public/_redirects`, removed `public/404.html`, `docs/wiki/*`.
- Architecture risk: a custom `404.html` can force nested React routes to remain 404 on Cloudflare Pages; live readback proves the API route still returns Worker JSON.
- architecture risk: a custom `404.html` can force nested React routes to remain 404 on Cloudflare Pages; live readback proves the API route still returns Worker JSON.
- Architecture risk validation: `/events`, `/submit`, `/about` returned 200 with React root present; `/api/runtime-status` returned 200 JSON with Worker runtime present.
- Validation: `npm run build`, `npm run test`, `git diff --check`, `npm run test:smoke`.
- Production readback: `/events`, `/submit`, `/about` returned 200 with React root present; `/api/runtime-status` returned 200 JSON with Worker runtime present.

## TSK-002-13 증거

- Issue: https://github.com/ClarusIubar/GATTACA/issues/35
- PR: https://github.com/ClarusIubar/GATTACA/pull/36
- Merge commit: `6b2e95953d4578ed7161c6dff5f1d20af94c5285`
- Deploy run: `26829349665` success
- CodeQL run: `26829344606` success
- Responsibility map: SubmitPage는 날짜, 시, 분 입력과 `eventAt` 합성을 담당하고, AppContext/repository/Worker는 기존 payload contract를 유지한다.
- Dependency direction: SubmitPage -> AppContext only. Worker, D1, R2, Kakao 경계는 변경하지 않는다.
- Test seam: Testing Library E2E가 native `시간` control이 없음을 확인하고 `시`와 `분` select를 선택한다.
- Scope map: `src/pages/SubmitPage.tsx`, `src/test/e2e-flow.test.tsx`, docs/wiki traceability.
- Architecture risk: hour/minute split이 `eventAt` 형식을 깨뜨릴 수 있으므로 E2E에서 등록 후 목록/상세 흐름까지 검증한다.
- Validation: `npm run test:e2e`, `npm run test`, `npm run build`, `npm run lint`, `git diff --check`, `npm run test:smoke`.
- Production readback: `/submit` returned 200 with React root; latest asset contained `eventHour` and `eventMinute`; native `type:"time"` marker was absent.

## TSK-002-14 증거

- Issue: https://github.com/ClarusIubar/GATTACA/issues/38
- PR: https://github.com/ClarusIubar/GATTACA/pull/40
- Merge commit: `26f3af73966183f317e99275c3e776a0a130a912`
- Deploy run: `26830277211` success
- CodeQL run: `26830274557` success
- Follow-up channel issue: https://github.com/ClarusIubar/GATTACA/issues/39
- Responsibility map: repository/Worker는 이벤트 저장을 담당하고, Kakao relay는 별도 알림 채널/명시 전송 기능에서만 호출한다.
- Dependency direction: SubmitPage -> AppContext -> repository for persistence; createEvent no longer depends on notification helper.
- Test seam: Cloudflare AppContext test verifies event POST succeeds and `sendKakaoMessage` is not called.
- Scope map: `src/lib/app-context.tsx`, `src/test/app-context-cloudflare.test.tsx`, docs/wiki traceability.
- Architecture risk: 자동 relay 제거로 알림 기대가 사라질 수 있으므로 TSK-002-15에서 채널 등록/명시 전송을 별도 설계한다.
- Validation: `npm run test:unit`, `npm run test`, `npm run build`, `npm run lint`, `git diff --check`, `npm run test:smoke`.
- Production readback: `/submit` returned 200; latest asset had no old partial-success message and no `/api/notifications/kakao-event` marker.

## 검증 명령

- `npm run lint`
- `npm run test:unit`
- `npm run test:integration`
- `npm run test:regression`
- `npm run test:e2e`
- `npm run build`
- `npm run test`
- 배포 후 `npm run test:smoke`

## 완료 판단

SDD 완료는 문서가 존재하는 것만으로 판단하지 않는다. PR merge, production deploy, live readback, smoke evidence가 함께 있어야 한다.
## TSK-002-16 Evidence

- Issue: https://github.com/ClarusIubar/GATTACA/issues/42
- Branch: `tsk-002-16-ux-operability-cleanup`
- PR: https://github.com/ClarusIubar/GATTACA/pull/43
- Merge commit: `1ca6bcde77291a014c6193aca3fb9dfb392a9dba`
- Responsibility map: `App.tsx` owns navigation and route availability; `SubmitPage` owns new event input; `EventsPage` owns list readability; `EventDetailPage` owns event/memory date-time input controls; `AdminPage` owns operator actions; AppContext/repository/Worker keep persistence and authorization responsibility.
- Dependency direction: pages -> AppContext -> repository/Worker. This change does not introduce backend schema or API contract changes.
- Test seam: source search rejects user-facing `datetime-local`, native time input, `/about` route/nav, and submit checklist markers; E2E covers event creation, detail entry, memory creation, and comment creation; App tests cover admin approval/rejection/delete/detail controls.
- Scope map: `src/App.tsx`, `src/pages/SubmitPage.tsx`, `src/pages/EventsPage.tsx`, `src/pages/EventDetailPage.tsx`, `src/pages/AdminPage.tsx`, `src/index.css`, `src/App.test.tsx`, `src/test/e2e-flow.test.tsx`, docs/wiki traceability.
- Architecture risk: preserving partial date/time state is required before composing `YYYY-MM-DDTHH:mm`; otherwise empty memory forms lose the date when hour/minute are selected later. The shared detail date-time selector now preserves partial input until all controls are selected.
- Local validation: `npm run test:e2e`, `npm run test`, `npm run build`, `npm run lint`, source marker search.
- Deploy run: `26858067408` success
- CodeQL run: `26858067104` success
- Production readback: `/events`, `/submit`, `/admin` returned 200 with latest asset `/assets/index-CmTD3GaB.js`; app-specific `type:"datetime-local"`/`type:"time"` markers were absent; `/about` and `Checklist` markers were absent; `event-facts`, `datetime-select-grid`, and `admin-stats` markers were present.

## TSK-002-17 Evidence

- Issue: https://github.com/ClarusIubar/GATTACA/issues/44
- Branch: `tsk-002-17-memory-comment-flow`
- PR: https://github.com/ClarusIubar/GATTACA/pull/45
- Merge commit: `c6f90b3bd74a0c8394b8e0227eaa4dfcd8697a7a`
- Responsibility map: Worker memory handlers own API input validation and persistence defaults; EventDetailPage owns the user flow for creating a memory and then commenting below it; repository/AppContext keep upload resolution but do not require an uploaded image.
- Dependency direction: EventDetailPage -> AppContext -> repository -> Worker -> D1. The UI may submit a caption-only memory; Worker normalizes missing `photoUrl` to an empty string before storage.
- Test seam: `worker/router-crud.test.ts` verifies caption-only memory creation and comment creation under that memory; `src/test/e2e-flow.test.tsx` exercises the browser flow without typing a photo URL.
- Scope map: `worker/handlers.ts`, `worker/router-crud.test.ts`, `src/test/e2e-flow.test.tsx`, docs/wiki traceability.
- Architecture risk: keeping `MemoryRecord.photoUrl` as a string avoids a schema migration, but empty string becomes the no-photo sentinel. The UI already renders a fallback image when `photoUrl` is empty, so this remains inside the existing contract.
- Local validation: `npm.cmd run test:e2e`, `npm.cmd run test -- worker/router-crud.test.ts`, `npm.cmd run test`, `npm.cmd run build`, `npm.cmd run lint`, `git diff --check` passed.
- Deploy run: `26859163244` success
- CodeQL run: `26859162813` success
- Production readback: `/events` returned 200, `/api/runtime-status` returned 200 with `db/session/bucket=true` and Kakao OAuth configured. Worker deploy log shows version `337c03ee-76ca-44d0-8ec7-393876bd3064` deployed at 100%.
