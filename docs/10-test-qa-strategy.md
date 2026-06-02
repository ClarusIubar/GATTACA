# 10. 테스트와 QA 전략

## 테스트 계층

| 계층 | 명령 | 검증 범위 |
| --- | --- | --- |
| Unit | `npm run test:unit` | 화면 핵심 문구, notification helper, repository helper, Worker auth/relay 단위 |
| Integration | `npm run test:integration` | App context, Cloudflare session bootstrap, Worker CRUD/router/D1/R2/authorization |
| Regression | `npm run test:regression` | setup 모드 안전 동작과 핵심 e2e 흐름 회귀 |
| E2E | `npm run test:e2e` | 데모 권한 전환 -> 일정 등록 -> 상세 진입 -> 메모리 작성 -> 코멘트 작성 |
| Smoke | `npm run test:smoke` | production build와 live domain Kakao/runtime readback |

## 우선 검증 시나리오

1. 비로그인, 승인대기, 승인회원, 운영자 권한 흐름.
2. 이벤트 등록 -> 상세 진입 -> 메모리 추가 -> 코멘트 추가.
3. 본인 작성물 수정과 타인 수정 제한.
4. 일반 사용자 delete 차단과 운영자 delete 허용.
5. Kakao secret 미설정 시 로그인 차단과 안내 문구 표시.
6. production에서 demo fallback 차단.

## 현재 자동화 범위

- `src/App.test.tsx`: 데모 배너, 홈 hero, persona switcher.
- `src/App.setup.test.tsx`: 환경변수 미설정 setup 모드.
- `src/test/e2e-flow.test.tsx`: 사용자 전체 플로우.
- `src/test/app-context*.test.tsx`: app context와 Cloudflare session bootstrap.
- `worker/*.test.ts`: auth, authorization, CRUD, upload, Kakao relay.
- `scripts/live-check.mjs`: live health/runtime/Kakao readiness smoke.

## 릴리스 기준

- `npm run lint` 오류 0건.
- `npm run test:unit` 통과.
- `npm run test:integration` 통과.
- `npm run test:regression` 통과.
- `npm run test:e2e` 통과.
- `npm run build` 통과.
- `npm run test:smoke`는 production 배포 후 live domain 기준으로 통과.

## 수동 QA 체크

- 홈/목록/상세/등록/소개 화면이 모바일 폭에서 단일 컬럼으로 읽히는지 확인한다.
- 정거장 카드와 상세 CTA가 기본 템플릿처럼 보이지 않고 추억열차 콘셉트를 유지하는지 확인한다.
- Kakao OAuth redirect URL은 `https://gattaca.jamissue.com/api/auth/callback`로 설정되어 있는지 확인한다.
- GitHub Actions 배포가 `main` 머지 기준 production으로만 진행되는지 확인한다.

## 알려진 한계

- Kakao 단체방 멤버 자동 판별은 v1 범위 밖이다.
- 실제 Kakao OAuth 브라우저 왕복은 Kakao Developers 설정과 live secrets가 필요하므로 자동화보다 live smoke/readback과 수동 확인을 병행한다.
- 이미지 업로드 실패 UX는 Worker/R2 오류 메시지를 표시하지만, 브라우저 네트워크 장애별 상세 복구 안내는 추가 개선 대상이다.
