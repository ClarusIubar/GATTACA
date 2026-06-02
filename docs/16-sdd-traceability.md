# 16. SDD 추적성

이 문서는 Spec-Driven Development 관점에서 문서 요구사항, 구현 파일, 테스트 증거, Wiki 원본을 연결한다. 구현 완료 주장은 아래 증거가 현재 상태와 일치할 때만 가능하다.

## 요구사항-구현 매핑

| 요구사항 | 문서 근거 | 구현 근거 | 테스트/검증 근거 | 상태 |
| --- | --- | --- | --- | --- |
| 정적 React 웹앱으로 추억열차 제공 | README, docs/04 | `src/App.tsx`, `src/pages/HomePage.tsx` | `npm run build` | 진행 |
| 데스크톱/모바일 반응형 웹페이지 | docs/05 | `src/index.css`, `src/pages/*.tsx` | `npm run test:unit`, `npm run build`, Figma frame evidence | 진행 |
| 정거장형 일정 기록 | docs/04, docs/05 | `src/pages/SubmitPage.tsx`, `src/pages/EventsPage.tsx` | `npm run test:e2e` | 진행 |
| 날짜/시간 분리 입력 | docs/04, docs/05 | `src/pages/SubmitPage.tsx` | `npm run test:e2e` | 진행 |
| 상세에서 사진/메모리/코멘트 기록 | docs/04, docs/05 | `src/pages/EventDetailPage.tsx`, repository/worker CRUD | `npm run test:e2e`, `npm run test:integration` | 진행 |
| 승인 사용자 CRU, 운영자 delete | docs/04, docs/06 | `src/lib/app-context.tsx`, Worker authorization | `npm run test:integration` | 진행 |
| production demo fallback 차단 | docs/10, docs/11 | `src/lib/env.ts`, `src/App.setup.test.tsx` | `npm run test:regression` | 진행 |
| Kakao OAuth/relay 경계 | docs/14, docs/15 | Worker auth routes, notification relay | `npm run test:unit`, `npm run test:integration` | 진행 |
| GitHub Wiki 반영 | docs/wiki | `docs/wiki/*.md` | Wiki sync diff/commit 확인 | 진행 |

## TSK-002-11 증거

- Issue: https://github.com/ClarusIubar/GATTACA/issues/25
- Branch: `tsk-002-11-submit-date-time-input`
- Responsibility map: SubmitPage는 날짜/시간 입력과 `eventAt` 합성을 담당하고, AppContext/repository/Worker는 기존 payload contract를 유지한다.
- Dependency direction: SubmitPage -> AppContext only. Worker, D1, R2, Kakao 경계는 변경하지 않는다.
- Test seam: Testing Library E2E가 `날짜`와 `시간`을 별도 control로 입력한다.
- Scope map: `src/pages/SubmitPage.tsx`, `src/test/e2e-flow.test.tsx`, docs/wiki traceability.
- Architecture risk: date/time split이 `eventAt` 형식을 깨뜨릴 수 있으므로 E2E에서 등록 후 목록/상세 흐름까지 검증한다.

## TSK-002-12 증거

- Issue: https://github.com/ClarusIubar/GATTACA/issues/27
- Branch: `tsk-002-12-pages-spa-direct-routes`
- Responsibility map: `_redirects`는 Pages static SPA fallback을 담당하고, Worker는 `/api/*`를 계속 담당한다.
- Dependency direction: Browser -> Pages static fallback -> React app; Browser -> Worker only for `/api/*`.
- Test seam: production HTTP status readback에서 `/events`, `/submit`, `/about`, `/api/runtime-status`를 확인한다.
- Scope map: `public/_redirects`, docs/wiki traceability.
- Architecture risk: fallback이 `/api/*`를 잡으면 안 되므로 API status readback을 함께 확인한다.

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
