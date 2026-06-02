# 16. SDD 추적성

이 문서는 Spec-Driven Development 관점에서 요구사항, 구현 파일, 테스트 증거, GitHub Wiki 원본을 연결한다. 완료 주장은 PR merge, production deploy, live readback, smoke evidence가 맞을 때만 가능하다.

## 요구사항-구현 매핑

| 요구사항 | 문서 근거 | 구현 근거 | 테스트/검증 근거 | 상태 |
| --- | --- | --- | --- | --- |
| 정적 React 웹앱으로 추억열차 제공 | README, docs/04 | `src/App.tsx`, `src/pages/HomePage.tsx` | `npm run build` | 진행 |
| 데스크톱/모바일 반응형 랜딩페이지 | docs/05 | `src/index.css`, `src/pages/*.tsx` | `npm run test:unit`, `npm run build`, Figma evidence | 진행 |
| 정거장형 일정 기록 | docs/04, docs/05 | `src/pages/SubmitPage.tsx`, `src/pages/EventsPage.tsx` | `npm run test:e2e` | 진행 |
| 날짜/시간 분리 입력 | docs/04, docs/05 | `src/pages/SubmitPage.tsx` | `npm run test:e2e` | 완료 |
| 상세에서 사진/메모리/코멘트 기록 | docs/04, docs/05 | `src/pages/EventDetailPage.tsx`, repository/worker CRUD | `npm run test:e2e`, `npm run test:integration` | 진행 |
| 승인 사용자 CRU, 운영자 delete | docs/04, docs/06 | `src/lib/app-context.tsx`, Worker authorization | `npm run test:integration` | 진행 |
| production demo fallback 차단 | docs/10, docs/11 | `src/lib/env.ts`, `src/App.setup.test.tsx` | `npm run test:regression` | 진행 |
| Kakao OAuth/relay 경계 | docs/14, docs/15 | Worker auth routes, notification relay | `npm run test:unit`, `npm run test:integration` | 진행 |
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
- PR: https://github.com/ClarusIubar/GATTACA/pull/29
- Merge commit: `77849ad7521489d48130455f0f48a1e35ef469c2`
- Deploy run: `26824441879` success
- CodeQL run: `26824440413` success
- Wiki sync commit: `a5f7eaf`
- Responsibility map: `_redirects` and the absence of a top-level `404.html` own Cloudflare Pages SPA fallback; Worker owns `/api/*`; React owns client routing.
- Dependency direction: Browser -> Pages static fallback -> React app; Browser -> Worker only for `/api/*`.
- Test seam: production HTTP status readback for `/events`, `/submit`, `/about`, `/api/runtime-status`.
- Scope map: `public/_redirects`, removed `public/404.html`, `docs/wiki/*`.
- Architecture risk: a custom `404.html` can force nested React routes to remain 404 on Cloudflare Pages; live readback proves the API route still returns Worker JSON.
- Validation: `npm run build`, `npm run test`, `git diff --check`, `npm run test:smoke`.
- Production readback: `/events`, `/submit`, `/about` returned 200 with React root present; `/api/runtime-status` returned 200 JSON with Worker runtime present.

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
