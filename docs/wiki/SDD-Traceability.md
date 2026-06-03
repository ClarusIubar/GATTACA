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
| 이벤트 저장과 Kakao 알림 분리 | `src/lib/app-context.tsx` | `npm run test:unit` |
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
- PR: https://github.com/ClarusIubar/GATTACA/pull/36
- Scope: `/submit` 시간 입력에서 native `input[type="time"]`을 제거하고 `시`/`분` select로 교체한다.
- Test seam: E2E가 `시간` input 부재와 `시`/`분` 선택을 검증한다.
- Live readback: production `/submit` asset에서 `eventHour`/`eventMinute` marker 확인, native `type:"time"` marker 부재 확인.

## TSK-002-14 Evidence

- Issue: https://github.com/ClarusIubar/GATTACA/issues/38
- PR: https://github.com/ClarusIubar/GATTACA/pull/40
- Follow-up channel issue: https://github.com/ClarusIubar/GATTACA/issues/39
- Scope: 이벤트 저장에서 Kakao relay 자동 호출을 제거한다.
- Test seam: Cloudflare AppContext test가 event POST 성공과 `sendKakaoMessage` 미호출을 검증한다.
- Policy: Kakao 알림은 별도 채널 등록과 명시 전송 기능에서만 다룬다.
- Live readback: production `/submit` asset에 기존 부분 성공 메시지와 `/api/notifications/kakao-event` marker가 없다.

## TSK-002-10 Follow-up

- Issue: https://github.com/ClarusIubar/GATTACA/issues/24
- Scope: `/events` visual refinement.
- Status: not implemented yet.

## 완료 판단

SDD 완료는 문서 존재만으로 판단하지 않는다. PR merge, production deploy, live smoke readback까지 evidence로 남긴다.
## TSK-002-16 Traceability

- Issue: https://github.com/ClarusIubar/GATTACA/issues/42
- PR: https://github.com/ClarusIubar/GATTACA/pull/43
- Merge commit: `1ca6bcde77291a014c6193aca3fb9dfb392a9dba`
- Scope: 핵심 UX와 운영성 수습.
- Implementation: `src/App.tsx`, `src/pages/SubmitPage.tsx`, `src/pages/EventsPage.tsx`, `src/pages/EventDetailPage.tsx`, `src/pages/AdminPage.tsx`, `src/index.css`.
- Contract: `eventAt`와 `recordedAt`는 계속 `YYYY-MM-DDTHH:mm` 문자열이다.
- UI rule: `datetime-local`, native time input, `/about` navigation, submit checklist panel은 사용자-facing source에 남기지 않는다.
- Validation: `npm run test:e2e`, `npm run test`, `npm run build`, `npm run lint`, source marker search.
- Deploy evidence: Deploy run `26858067408` success, CodeQL run `26858067104` success.
- Production evidence: `/events`, `/submit`, `/admin` returned 200 with latest asset `/assets/index-CmTD3GaB.js`; app-specific native datetime/time type markers were absent; `/about` and Checklist markers were absent.
## TSK-002-17 Traceability

- Issue: https://github.com/ClarusIubar/GATTACA/issues/44
- Branch: `tsk-002-17-memory-comment-flow`
- PR: https://github.com/ClarusIubar/GATTACA/pull/45
- Merge commit: `c6f90b3bd74a0c8394b8e0227eaa4dfcd8697a7a`
- Scope: 사진 없는 메모리 생성과 그 메모리 하위 댓글 작성 흐름 복구.
- Implementation: `worker/handlers.ts`, `worker/router-crud.test.ts`, `src/test/e2e-flow.test.tsx`.
- Contract: `photoUrl`은 선택 입력이다. Worker는 누락된 값을 빈 문자열로 정규화하고, UI는 빈 문자열일 때 fallback 이미지를 보여준다.
- Test seam: Worker route test가 caption-only memory create와 comment create를 검증한다. E2E는 사진 URL 입력 없이 메모리 생성과 댓글 작성을 수행한다.
- Validation: `npm.cmd run test:e2e`, `npm.cmd run test -- worker/router-crud.test.ts`, `npm.cmd run test`, `npm.cmd run build`, `npm.cmd run lint`, `git diff --check`, `npm.cmd run test:smoke` passed.
- Production evidence: Deploy run `26859163244` success, CodeQL run `26859162813` success, `/events` and `/api/runtime-status` production readback passed.
