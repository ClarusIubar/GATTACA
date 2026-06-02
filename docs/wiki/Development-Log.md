# 개발기록

이 문서는 구현 흐름을 GitHub Wiki에 반영하기 위한 요약 원본이다. 상세 source-of-truth는 `docs/` 문서와 GitHub Issue를 따른다.

## 2026-06-02

### TSK-002-12 Cloudflare Pages SPA direct route 404 수정

- Issue: https://github.com/ClarusIubar/GATTACA/issues/27
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
