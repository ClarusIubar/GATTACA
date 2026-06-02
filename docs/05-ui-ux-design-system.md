# 05. UI/UX 디자인 시스템

## 디자인 원칙

- 추억열차는 PPT 목업이 아니라 실제 production 웹페이지다.
- 데스크톱과 핸드폰 뷰를 모두 1차 지원 대상으로 둔다.
- 카카오톡 단체방은 결정 장소, 추억열차는 기록 장소라는 역할 분리를 화면에서 명확히 보여준다.
- 캘린더형 월간 UI는 만들지 않고, 정거장형 타임라인과 승차권 카드로 확정 기록을 보여준다.
- 권한 상태는 숨기지 않는다. 배너, disabled 버튼, 운영 안내 문구로 현재 상태를 설명한다.

## 시각 시스템

- 주 색상: `#a24d25`
- 보조 색상: `#c69037`
- 배경: `#f8efe1`, `#fffaf2`
- 오류/삭제: `#9d3c32`
- 본문 폰트: `Segoe UI`, `Apple SD Gothic Neo`, `Malgun Gothic`, sans-serif
- 강조 폰트: `Georgia`, `Times New Roman`, serif
- 레이아웃 폭: `--shell: min(1180px, calc(100vw - 32px))`

## 화면 기준

- Home: hero, 운행 상태 보드, 기록 노선도, 최근 정거장, 운영 원칙.
- Events: 정거장형 타임라인 카드. 월간 캘린더는 사용하지 않는다.
- Event Detail: 이벤트 요약, 무엇을/어떻게, 메모리 갤러리, 코멘트 흐름, 권한별 수정/삭제.
- Submit: 확정된 일정을 새 정거장으로 등록하는 집중 폼.
- About: 콘셉트, 운영 원칙, v1 경계.
- Admin: 승인 대기 사용자와 운영 대상 이벤트 관리.

## 반응형 규칙

- 1040px 이하: hero, detail, submit, operations 영역은 단일 열로 접는다.
- 760px 이하: header/nav/tools를 세로 흐름으로 재배치하고 nav는 가로 스크롤을 허용한다.
- 모바일에서는 모든 CTA 버튼을 full width로 만들어 오작동을 줄인다.
- route steps, stats, ticket grid, memory grid, form two-column은 모바일에서 1열이다.
- sticky sidebar는 데스크톱에서만 사용하고 모바일에서는 일반 흐름으로 둔다.
- 모든 긴 한국어/URL 텍스트는 `overflow-wrap: anywhere`로 카드 밖으로 넘치지 않게 한다.

## 컴포넌트 규칙

- 정거장 카드: 날짜, 장소, 등록자, 확정 요약, 상세 CTA를 포함한다.
- 출발 보드: 접근 가능 여부, backend 연결, Kakao 상태, 기록 수를 보여준다.
- 메모리 카드: 사진, 작성자, 기록 시각, 캡션, 코멘트 목록을 포함한다.
- 모든 입력 필드는 명시적인 `label`을 가진다.
- 위험 버튼은 삭제 동작에만 사용한다.
- 상태 배너는 데모 모드, 승인 대기, Kakao 미설정, 로딩, 오류를 구분한다.

## 구현 증거

- Figma 기준 파일: https://www.figma.com/design/Y0KrDckzTd6Fjh4Jbi2ld6
- Figma frame evidence: `Desktop Web / Home + Archive + Detail Preview`, `Mobile Phone / Home + Flow`
- 구현 파일: `src/App.tsx`, `src/pages/*.tsx`, `src/index.css`
- 검증: `npm run lint`, `npm run test:unit`, `npm run test:integration`, `npm run test:regression`, `npm run test:e2e`, `npm run build`, `npm run test`
