# 16. SDD 추적성

이 문서는 Spec-Driven Development 관점에서 문서 요구사항, 구현 파일, 테스트 증거, Wiki 원본을 연결한다. 구현 완료 주장은 이 표의 증거가 모두 현재 상태와 일치할 때만 가능하다.

## 요구사항-구현 매핑

| 요구사항 | 문서 근거 | 구현 근거 | 테스트/검증 근거 | 상태 |
| --- | --- | --- | --- | --- |
| 정적 React 앱으로 추억열차 제공 | README, docs/04 | `src/App.tsx`, `src/pages/HomePage.tsx` | `npm run build` | 진행 |
| 정거장형 일정 기록 | docs/04, docs/05 | `src/pages/SubmitPage.tsx`, `src/pages/EventsPage.tsx` | `npm run test:e2e` | 진행 |
| 상세에서 사진/메모리/코멘트 기록 | docs/04, docs/05 | `src/pages/EventDetailPage.tsx`, repository/worker CRUD | `npm run test:e2e`, `npm run test:integration` | 진행 |
| 승인 사용자 CRU, 운영자 delete | docs/04, docs/06 | `src/lib/app-context.tsx`, `worker/authorization.test.ts`, Worker routes | `npm run test:integration` | 진행 |
| production demo fallback 차단 | docs/10, docs/11 | `src/lib/env.ts`, `src/App.setup.test.tsx` | `npm run test:regression` | 진행 |
| Kakao OAuth/relay 경계 | docs/14, docs/15 | Worker auth routes, notification relay | `npm run test:unit`, `npm run test:integration`, `npm run test:smoke` | 진행 |
| UI/UX 고도화 | docs/05 | Home/Events/EventDetail/Submit/About pages, `src/index.css` | `src/App.test.tsx`, `src/test/e2e-flow.test.tsx`, 수동 UI 확인 | 진행 |
| GitHub Wiki 반영 | docs/wiki | `docs/wiki/*.md` | git diff와 Wiki sync 확인 | 진행 |

## 테스트 계층 증거

- Unit: `npm run test:unit`
- Integration: `npm run test:integration`
- Regression: `npm run test:regression`
- E2E: `npm run test:e2e`
- Build: `npm run build`
- Smoke: `npm run test:smoke`

## 책임 지도

- Frontend UI: `src/pages/*`, `src/App.tsx`, `src/index.css`
- Client state and authorization seam: `src/lib/app-context.tsx`
- Data access boundary: `src/lib/repository.ts`
- Server authority: `worker/*`
- Deployment and live readback: `.github/workflows/deploy.yml`, `scripts/live-check.mjs`
- Source documents: `docs/*.md`, `docs/wiki/*.md`

## 의존성 방향

UI는 `useAppContext`를 통해 application boundary만 호출한다. UI가 Worker, D1, R2, KV, Kakao API를 직접 호출하지 않는다. Kakao notification은 `src/lib/notification.ts`에서 Worker relay로 위임한다.

## 테스트 seam

- DemoRepository: 브라우저 e2e와 localStorage 기반 사용자 플로우 검증.
- CloudflareRepository: Worker API contract 검증.
- Fake D1/R2/KV: Worker integration 테스트.
- Live check script: production smoke와 runtime readback.

## 남은 완료 증거

- 변경 브랜치가 PR로 올라가야 한다.
- PR이 main에 머지되어 production 배포가 완료되어야 한다.
- `https://gattaca.jamissue.com/`에서 새 UI와 runtime smoke를 다시 확인해야 한다.
