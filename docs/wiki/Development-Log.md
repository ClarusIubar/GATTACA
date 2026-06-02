# 개발기록

이 문서는 구현 흐름을 GitHub Wiki에 반영하기 위한 요약 원본이다. 상세 source-of-truth는 `docs/` 문서와 GitHub Issue를 따른다.

## 2026-06-02

### TSK-002-09 데스크톱/모바일 웹 UI 재구현

- Issue: https://github.com/ClarusIubar/GATTACA/issues/22
- Branch: `tsk-002-09-responsive-figma-implementation`
- Figma: https://www.figma.com/design/Y0KrDckzTd6Fjh4Jbi2ld6
- 목적: PPT식 목업이 아니라 실제 서비스 가능한 웹페이지와 핸드폰 뷰를 구현한다.
- 변경: App shell, Home, Events, Event Detail, Submit, About, Admin 문구와 레이아웃을 정상 한국어와 반응형 구조로 정리했다.
- 변경: 데모 데이터와 테스트 문자열의 깨진 인코딩을 정리했다.
- 변경: `src/index.css`를 데스크톱/모바일 기준으로 전면 정리했다.
- 검증: `npm run lint`, `npm run test:unit`, `npm run test:integration`, `npm run test:regression`, `npm run test:e2e`, `npm run build`, `npm run test`.

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

## 다음 검증 순서

1. PR에서 lint/unit/integration/regression/e2e/build 통과.
2. main merge.
3. production deploy.
4. live smoke readback.
5. 실제 Kakao OAuth redirect/callback/session restore 확인.
