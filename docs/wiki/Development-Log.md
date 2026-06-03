# 개발기록

이 문서는 구현 흐름을 GitHub Wiki에 반영하기 위한 요약 원본이다. 상세 source-of-truth는 `docs/` 문서와 GitHub Issue를 따른다.

## 2026-06-02

### TSK-002-14 이벤트 저장과 Kakao 알림 자동 전송 분리

- Issue: https://github.com/ClarusIubar/GATTACA/issues/38
- PR: https://github.com/ClarusIubar/GATTACA/pull/40
- Merge commit: `26f3af73966183f317e99275c3e776a0a130a912`
- Follow-up: https://github.com/ClarusIubar/GATTACA/issues/39
- 문제: 알림 대상 채널 등록이 없는데도 이벤트 생성 직후 Kakao relay를 자동 호출해, DB 저장 성공 후 카카오 실패가 사용자 오류처럼 보였다.
- 변경: `createEvent`에서 Kakao relay 자동 호출을 제거한다.
- 정책: Kakao 알림은 별도 등록된 채널과 명시 전송 액션이 생긴 뒤에만 보낸다.
- 배포 검증: `/submit` asset에서 기존 부분 성공 메시지와 `/api/notifications/kakao-event` marker가 사라졌음을 확인했다.

### TSK-002-13 일정 등록 시간 입력 선택 UI 교체

- Issue: https://github.com/ClarusIubar/GATTACA/issues/35
- Branch: `tsk-002-13-submit-time-select`
- PR: https://github.com/ClarusIubar/GATTACA/pull/36
- Merge commit: `6b2e95953d4578ed7161c6dff5f1d20af94c5285`
- 문제: `/submit`의 native `input[type="time"]`이 일부 production 브라우저에서 컨트롤만 보이고 실제 시간 입력이 불명확했다.
- 변경: native time input을 제거하고 `시`와 `분` select로 시간 입력을 고정한다.
- 테스트: E2E가 `시간` input 부재, `시`/`분` 선택, 일정 등록 후 상세 진입 흐름을 검증한다.
- 배포 검증: `/submit` asset에서 `eventHour`/`eventMinute` marker가 있고 native `type:"time"` marker가 없음을 확인했다.

### TSK-002-12 Cloudflare Pages SPA direct route 404 수정

- Issue: https://github.com/ClarusIubar/GATTACA/issues/27
- Follow-up branch: `tsk-002-12-remove-pages-404-fallback`
- Branch: `tsk-002-12-pages-spa-direct-routes`
- 문제: production `/events`, `/submit`, `/about` 직접 요청이 404를 반환했다.
- 변경: Cloudflare Pages `_redirects`를 표준 SPA rewrite 형식인 `/* /index.html 200`으로 정리한다.
- 검증 기준: main 배포 후 `/events`, `/submit`, `/about`은 200, `/api/runtime-status`도 200이어야 한다.

### TSK-002-11 일정 등록 날짜/시간 입력 분리

- Issue: https://github.com/ClarusIubar/GATTACA/issues/25
- Branch: `tsk-002-11-submit-date-time-input`
- 문제: `/submit`의 `datetime-local` 단일 입력이 일부 환경에서 달력 위주로 동작해 시간 입력이 명확하지 않았다.
- 변경: `날짜`와 `시간`을 별도 입력으로 분리하고, 제출 시 기존 `EventInput.eventAt` contract인 `YYYY-MM-DDTHH:mm`으로 합성한다.
- 테스트: E2E가 날짜와 시간을 각각 입력한 뒤 일정 등록, 상세 진입, 메모리/코멘트 작성 흐름을 검증하도록 갱신했다.

### TSK-002-10 `/events` visual refinement 대기

- Issue: https://github.com/ClarusIubar/GATTACA/issues/24
- 상태: production 배포 후 `/events` 화면 품질이 Figma 기대치보다 낮아 별도 후속 이슈로 분리했다.

### TSK-002-09 데스크톱/모바일 웹 UI 재구현

- Issue: https://github.com/ClarusIubar/GATTACA/issues/22
- PR: https://github.com/ClarusIubar/GATTACA/pull/23
- Merge commit: `04100ed650ac55537db218956e367ad5471a1a7b`
- Figma: https://www.figma.com/design/Y0KrDckzTd6Fjh4Jbi2ld6
- 목적: PPT식 목업이 아니라 실제 서비스 가능한 웹페이지와 핸드폰 뷰를 구현한다.
- 변경: App shell, Home, Events, Event Detail, Submit, About, Admin 문구와 레이아웃을 정상 한국어와 반응형 구조로 정리했다.
- 검증: `npm run lint`, `npm run test:unit`, `npm run test:integration`, `npm run test:regression`, `npm run test:e2e`, `npm run build`, `npm run test`, `npm run test:smoke`.

### 이전 구현 요약

- TSK-002-01 Worker foundation
- TSK-002-02 D1 CRUD
- TSK-002-03 Kakao OAuth / KV Session
- TSK-002-04 R2 Upload
- TSK-002-05 Server Authorization
- TSK-002-06 Demo fallback 격리
- TSK-002-07 Kakao Relay
- TSK-002-08 UI/UX, TDD, SDD 보강

## 현재 live 기준 확인 대상

- Production: https://gattaca.jamissue.com/
- Runtime status: https://gattaca.jamissue.com/api/runtime-status
- Auth callback: https://gattaca.jamissue.com/api/auth/callback
## 2026-06-03

### TSK-002-16 핵심 UX와 의미 있는 운영보드 수습

- Issue: https://github.com/ClarusIubar/GATTACA/issues/42
- Branch: `tsk-002-16-ux-operability-cleanup`
- PR: https://github.com/ClarusIubar/GATTACA/pull/43
- Merge commit: `1ca6bcde77291a014c6193aca3fb9dfb392a9dba`
- 문제: 이벤트 목록에서 `누가/언제/어디서/무엇/어떻게`가 묻혔고, 상세/메모리 입력에는 여전히 native datetime 입력이 남아 있었으며, submit 체크리스트와 운영 원칙 탭은 실사용 가치 없이 화면을 차지했다. 운영실도 읽기 중심이라 실제 운영을 수행하기 어려웠다.
- 변경: `/about` route/nav를 제거하고, `/submit` 체크리스트 패널을 제거했다. 이벤트 목록에는 라벨형 핵심 정보 블록을 추가했다. Event Detail의 이벤트 수정, 메모리 등록, 메모리 수정은 모두 날짜+시+분 선택으로 통일했다. 운영실에는 운영 요약, 승인/반려, 이벤트 삭제, 상세 진입을 추가했다.
- 설계 판단: 데이터 계약은 기존 `YYYY-MM-DDTHH:mm` 문자열을 유지한다. 페이지 컴포넌트가 입력과 표시를 담당하고 AppContext/Worker는 기존 persistence/authz 책임을 유지한다.
- 테스트: `npm run test:e2e`, `npm run test`, `npm run build`, `npm run lint`, `npm run test:smoke`, source marker search 통과.
- 배포: Deploy run `26858067408` success, CodeQL run `26858067104` success.
- Production readback: `/events`, `/submit`, `/admin`은 200, latest asset `/assets/index-CmTD3GaB.js`, app-specific native datetime/time type marker 없음, `/about`/Checklist marker 없음, `event-facts`/`datetime-select-grid`/`admin-stats` marker 있음.
- Wiki sync: GitHub Wiki repository history에서 최종 동기화 commit을 확인한다.
### TSK-002-17 사진 없는 메모리와 댓글 작성 흐름 복구

- Issue: https://github.com/ClarusIubar/GATTACA/issues/44
- Branch: `tsk-002-17-memory-comment-flow`
- 문제: 이벤트 상세에서 메모리를 남길 때 사진 파일 또는 URL을 넣지 않으면 Worker가 `photoUrl 값이 필요합니다.`로 400을 반환했고, 댓글을 달 메모리 자체가 생성되지 않았다.
- 변경: Worker memory create/update에서 누락된 `photoUrl`을 빈 문자열로 저장하도록 계약을 완화했다.
- 테스트: Worker CRUD 테스트는 사진 없는 메모리 생성 후 댓글 작성까지 검증하고, E2E 테스트는 사진 URL 없이 메모리와 댓글 흐름을 수행한다.
- 배포 검증: pending.
