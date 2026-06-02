# Task ID Ledger

이 문서는 이슈, PR, 구현 범위, 검증 증거를 한 줄로 연결하는 추적성 원장이다.

## Evidence Label Glossary

- Issue: GitHub child issue.
- 문서 경로 / Document path: 구현과 증거가 연결되는 파일 또는 문서 경로.
- 왜 해결 / Why: 이 작업을 수행한 이유.
- 무슨 문제 / Problem: 해결 전 실패 상태.
- 어떻게 해결 / How: 적용한 해결 방식.
- 남은 gap / Remaining gap: 완료 후 남은 범위 또는 없음.

| Task ID | Issue | PR | Merge commit | Document path | Why | Problem | How | Remaining gap | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TSK-001-01 | https://github.com/ClarusIubar/GATTACA/issues/3 | https://github.com/ClarusIubar/GATTACA/pull/10 | not applicable | `docs/TASK_ID_LEDGER.md` | 초기 위키/테스트 구조를 정리하기 위해 | 저장소 구조와 검증 기준이 약했다 | DIP 구조와 Vitest 기반 테스트 골격을 추가했다 | TSK-002 계열에서 실사용 구조로 확장 | completed |
| TSK-001-02 | https://github.com/ClarusIubar/GATTACA/issues/4 | not applicable | not applicable | `docs/sql/supabase-schema.sql` | 초기 데이터 모델과 보안 규칙을 남기기 위해 | Supabase 초안과 현재 Cloudflare 구조가 분리되어 있었다 | PostgreSQL schema/RLS 초안을 문서화했다 | 현재 요구는 Cloudflare D1/R2/KV로 이동 | completed |
| TSK-001-03 | https://github.com/ClarusIubar/GATTACA/issues/5 | not applicable | not applicable | `src/lib/app-context.tsx` | 로그인과 프로필 생성 흐름을 잡기 위해 | 로그인 후 사용자 생명주기 로직이 부족했다 | signIn/ensureProfile 흐름 초안을 정리했다 | Worker OAuth/session 구조로 대체 | completed |
| TSK-001-04 | https://github.com/ClarusIubar/GATTACA/issues/6 | not applicable | not applicable | `src/lib/file-validation.ts` | 사진 업로드 제약을 고정하기 위해 | 이미지 형식/크기 검증이 없었다 | MIME, 용량 제한, fallback을 추가했다 | live R2 기준 검증 필요 | completed |
| TSK-001-05 | https://github.com/ClarusIubar/GATTACA/issues/7 | not applicable | not applicable | `src/pages/AdminPage.tsx` | 운영자 승인/삭제 UI 초안을 마련하기 위해 | 관리자 UX가 정리되지 않았다 | AdminPage 접근 흐름과 승인 UI를 추가했다 | 서버 권한 강제는 TSK-002에서 보강 | completed |
| TSK-001-06 | https://github.com/ClarusIubar/GATTACA/issues/8 | not applicable | not applicable | `src/lib/notification.ts` | 일정 확정 후 알림 개념을 연결하기 위해 | 이벤트 저장과 공유/알림 흐름이 없었다 | notification helper를 추가했다 | Worker Kakao relay로 확장 | completed |
| TSK-001-07 | https://github.com/ClarusIubar/GATTACA/issues/9 | not applicable | not applicable | `.github/workflows/deploy.yml` | 자동 배포 기반을 만들기 위해 | 빌드와 배포가 수동 상태였다 | GitHub Actions와 Cloudflare Pages 배포 흐름을 추가했다 | Worker/Pages production 배포로 발전 | completed |
| TSK-002-01 | https://github.com/ClarusIubar/GATTACA/issues/12 | not opened yet | not applicable | `worker/*`, `wrangler.toml`, `public/_redirects` | Worker foundation을 세우기 위해 | `/api/*` 경계가 없었다 | health/session foundation과 router를 추가했다 | live readback 필요 | active |
| TSK-002-02 | https://github.com/ClarusIubar/GATTACA/issues/13 | not opened yet | not applicable | `worker/d1-repository.ts`, `docs/sql/cloudflare-d1-schema.sql` | CRUD를 실제 D1 경계로 연결하기 위해 | API가 저장소 없이 가짜 흐름에 가까웠다 | D1 repository와 CRUD route를 추가했다 | live D1 readback 필요 | active |
| TSK-002-03 | https://github.com/ClarusIubar/GATTACA/issues/14 | not opened yet | not applicable | `worker/auth.ts`, `worker/session-store.ts` | Kakao OAuth/session을 실제 경계로 붙이기 위해 | callback, KV session, current user 복원이 없었다 | authorize/callback/profile upsert/session create를 구현했다 | live OAuth readback 필요 | active |
| TSK-002-04 | https://github.com/ClarusIubar/GATTACA/issues/15 | not opened yet | not applicable | `worker/upload.ts`, `src/lib/app-context.tsx` | 메모리 사진을 R2에 저장하기 위해 | local/blob URL만으로는 live 저장이 불가능했다 | upload route와 R2 object serving을 구현했다 | live upload readback 필요 | active |
| TSK-002-05 | https://github.com/ClarusIubar/GATTACA/issues/16 | not opened yet | not applicable | `worker/authz.ts`, `worker/authorization.test.ts` | 서버 권한 강제를 확정하기 위해 | body의 author field를 믿으면 권한 위조가 가능했다 | session과 owner lookup 기준으로 CRUD/delete/approval을 강제했다 | live 권한 readback 필요 | active |
| TSK-002-06 | https://github.com/ClarusIubar/GATTACA/issues/17 | not opened yet | not applicable | `src/lib/env.ts`, `src/App.setup.test.tsx` | production demo fallback을 차단하기 위해 | 미설정 배포가 demo/mock 성공처럼 보일 수 있었다 | runtime mode를 cloudflare/demo/setup으로 분리했다 | live deployment readback 필요 | active |
| TSK-002-07 | https://github.com/ClarusIubar/GATTACA/issues/18 | not opened yet | not applicable | `worker/kakao-notification.ts`, `src/lib/notification.ts` | Kakao relay를 Worker 경계로 옮기기 위해 | 브라우저가 직접 Kakao API를 치면 보안/토큰 문제가 생긴다 | access token 기반 Worker relay endpoint를 추가했다 | Kakao secret live readback 필요 | active |
| TSK-002-08 | https://github.com/ClarusIubar/GATTACA/issues/20 | https://github.com/ClarusIubar/GATTACA/pull/21 | not applicable | `src/pages/*`, `src/index.css`, `docs/wiki/*` | UI/UX, TDD, SDD evidence를 보강하기 위해 | 제품처럼 보이지 않고 검증 evidence가 약했다 | 주요 화면, 테스트, 문서를 보강했다 | production visual readback 필요 | active |
| TSK-002-09 | https://github.com/ClarusIubar/GATTACA/issues/22 | https://github.com/ClarusIubar/GATTACA/pull/23 | `04100ed650ac55537db218956e367ad5471a1a7b` | `src/App.tsx`, `src/pages/*`, `src/index.css`, `docs/wiki/*` | production에서 볼 수 있는 desktop/mobile 기준을 만들기 위해 | 기존 UI와 문서 일부가 깨진 인코딩과 불명확한 반응형 기준으로 재사용 판단이 어려웠다 | 주요 페이지, CSS, 데모 데이터, 테스트, README/docs/wiki를 정리했다 | `/events` visual refinement는 TSK-002-10으로 분리 | completed |
| TSK-002-10 | https://github.com/ClarusIubar/GATTACA/issues/24 | not opened yet | not applicable | `src/pages/EventsPage.tsx`, `src/index.css`, `docs/wiki/*` | `/events` 화면의 시각 밀도와 Figma 대비 격차를 줄이기 위해 | production 목록 화면이 정거장 보드/티켓 컨셉을 충분히 살리지 못했다 | 별도 child issue로 분리했다 | 아직 구현 전 | active |
| TSK-002-11 | https://github.com/ClarusIubar/GATTACA/issues/25 | https://github.com/ClarusIubar/GATTACA/pull/26 | `b2c45b1180fd11c83500e09ad0de233c0204d2ce` | `src/pages/SubmitPage.tsx`, `src/test/e2e-flow.test.tsx`, `docs/wiki/*` | 일정 등록에서 시간 입력을 명확히 보장하기 위해 | `datetime-local` 단일 입력이 환경에 따라 달력 중심으로 보여 시간 입력이 불명확했다 | 날짜와 시간을 별도 input으로 분리하고 제출 시 기존 `eventAt` 문자열로 합성했다 | direct route 404는 TSK-002-12에서 해결 | completed |
| TSK-002-12 | https://github.com/ClarusIubar/GATTACA/issues/27 | https://github.com/ClarusIubar/GATTACA/pull/29 | `77849ad7521489d48130455f0f48a1e35ef469c2` | `public/_redirects`, `public/404.html`, `docs/wiki/*` | 공유 링크와 새로고침에서 React route가 직접 열리게 하기 위해 | production `/events`, `/submit`, `/about` 직접 요청이 404를 반환했고, PR #28 후에도 custom `404.html` 때문에 404가 유지됐다 | `_redirects`를 SPA rewrite로 유지하고 Cloudflare Pages custom top-level `404.html`을 제거했다 | 없음. production readback 통과 | completed |
| TSK-002-13 | https://github.com/ClarusIubar/GATTACA/issues/35 | https://github.com/ClarusIubar/GATTACA/pull/36 | `6b2e95953d4578ed7161c6dff5f1d20af94c5285` | `src/pages/SubmitPage.tsx`, `src/test/e2e-flow.test.tsx`, `docs/wiki/*` | 일정 등록에서 시간 입력을 실제로 선택 가능하게 만들기 위해 | native `input[type="time"]`이 production 브라우저에서 컨트롤만 보이고 입력이 불명확하거나 불가능했다 | native time input을 제거하고 `시`/`분` select로 조합해 기존 `eventAt` contract를 유지했다 | 없음. production `/submit` readback 통과 | completed |
| TSK-002-14 | https://github.com/ClarusIubar/GATTACA/issues/38 | https://github.com/ClarusIubar/GATTACA/pull/40 | `26f3af73966183f317e99275c3e776a0a130a912` | `src/lib/app-context.tsx`, `src/test/app-context-cloudflare.test.tsx`, `docs/wiki/*` | 웹 이벤트 저장과 Kakao 알림 전송 책임을 분리하기 위해 | 알림 대상 채널 등록이 없는데도 이벤트 생성 직후 Kakao relay를 자동 호출해 저장 성공 후 카카오 실패가 사용자 오류처럼 보였다 | `createEvent`에서 자동 Kakao relay 호출을 제거하고 알림 채널 등록/명시 전송은 TSK-002-15로 분리했다 | 없음. production `/submit` asset readback 통과 | completed |
| TSK-002-15 | https://github.com/ClarusIubar/GATTACA/issues/39 | not opened yet | not applicable | docs/wiki/* | Kakao 알림을 보낼 대상 채널과 명시 전송 정책을 정의하기 위해 | 현재 어디로 알림을 보낼지 등록하는 모델/UI/운영 정책이 없다 | 별도 child issue에서 채널 등록, 권한, 전송 액션, 실패 정책을 설계한다 | 아직 구현 전 | active |

## TSK-002-12 Ledger Evidence

- Task ID: TSK-002-12
- Issue: https://github.com/ClarusIubar/GATTACA/issues/27
- PR: https://github.com/ClarusIubar/GATTACA/pull/29
- Merge commit: `77849ad7521489d48130455f0f48a1e35ef469c2`
- 문서 경로: `public/_redirects`, removed `public/404.html`, `docs/16-sdd-traceability.md`, `docs/TASK_ID_LEDGER.md`, `docs/ISSUE_TREE.md`, `docs/wiki/*`
- Document path: `public/_redirects`, removed `public/404.html`, `docs/16-sdd-traceability.md`, `docs/TASK_ID_LEDGER.md`, `docs/ISSUE_TREE.md`, `docs/wiki/*`
- 왜 해결: 공유 링크와 새로고침에서 React route가 직접 열리게 하기 위해.
- Why: direct React routes must open correctly from shared links and browser refresh.
- 무슨 문제: production `/events`, `/submit`, `/about` 직접 요청이 404를 반환했고 PR #28 후에도 custom `404.html` 때문에 404가 유지됐다.
- Problem: production nested routes returned 404 because the custom top-level `404.html` was still served.
- 어떻게 해결: `_redirects`를 SPA rewrite로 유지하고 Cloudflare Pages custom top-level `404.html`을 제거했다.
- How: kept `_redirects` as SPA rewrite and removed the Cloudflare Pages custom top-level `404.html`.
- 남은 gap: 없음. production readback 통과.
- Remaining gap: none; production readback passed.
- Status: completed
