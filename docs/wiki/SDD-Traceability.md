# SDD Traceability

이 페이지는 `docs/16-sdd-traceability.md`의 Wiki 요약본이다.

## 요구사항 매핑

| 요구사항 | 구현 | 검증 |
| --- | --- | --- |
| 데스크톱/모바일 반응형 웹페이지 | `src/index.css`, Home/Events/Detail/Submit/About/Admin | `npm run test:unit`, `npm run build` |
| 정거장형 일정 기록 | `src/pages/SubmitPage.tsx`, `src/pages/EventsPage.tsx` | `npm run test:e2e` |
| 사진/메모리/코멘트 기록 | `src/pages/EventDetailPage.tsx`, Worker CRUD | `npm run test:e2e`, `npm run test:integration` |
| 승인 사용자 CRU, 운영자 delete | `src/lib/app-context.tsx`, Worker authorization | `npm run test:integration` |
| production demo fallback 차단 | `src/lib/env.ts`, setup tests | `npm run test:regression` |
| 배포 readback | GitHub Actions, `scripts/live-check.mjs` | `npm run test:smoke` |

## TSK-002-09 Evidence

- Issue: https://github.com/ClarusIubar/GATTACA/issues/22
- Figma file: https://www.figma.com/design/Y0KrDckzTd6Fjh4Jbi2ld6
- Frames: Desktop Web, Mobile Phone
- Scope: 실제 웹사이트 UI와 모바일 반응형 구현. PPT 산출물이 아님.
- Local validation: lint, unit, integration, regression, e2e, build, full vitest.

## 완료 판단

SDD 완료는 문서 존재만으로 판단하지 않는다. PR merge, production deploy, live smoke readback까지 evidence로 남긴다.
