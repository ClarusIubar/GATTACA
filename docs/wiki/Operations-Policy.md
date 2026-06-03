# 운영 정책

## 1. 사용자 승인 정책

1. 사용자는 Kakao OAuth로 로그인한다.
2. 첫 로그인 사용자는 D1 `profiles`에 `pending` 상태로 생성된다.
3. 운영자는 Kakao 프로필 정보와 단체방 참여 여부를 대조해 승인 여부를 결정한다.
4. 승인된 사용자는 이벤트, 메모리, 코멘트를 만들고 수정할 수 있다.
5. 반려 사용자는 작성할 수 없다.

## 2. 삭제 정책

- 영구 삭제는 운영자만 수행한다.
- 승인 사용자는 작성과 수정은 가능하지만 삭제는 불가능하다.
- 권한 판정은 UI가 아니라 Worker가 세션과 D1 owner lookup을 기준으로 강제한다.
- request body의 `createdBy`, `authorId`, `userId`는 권한 근거로 신뢰하지 않는다.

## 3. 모임 기록 정책

- 단체방에서 확정된 일정만 등록한다.
- 조율 중인 후보 일정은 추억열차에 등록하지 않는다.
- 추억열차는 일정 조율 도구가 아니라 확정 결과와 회고를 남기는 메모리얼 페이지다.
- 부적절한 텍스트나 사진은 운영자가 삭제할 수 있다.

## 4. 환경변수와 secret 정책

Frontend build env:

- `VITE_CLOUDFLARE_API_URL`
- `VITE_ADMIN_USER_ID` optional
- `VITE_ENABLE_DEMO_MODE` local/test only

Worker vars:

- `APP_BASE_URL`
- `SESSION_TTL_SECONDS`
- `ADMIN_AUTH_USER_ID` optional

Worker/GitHub secrets:

- `KAKAO_REST_API_KEY`
- `KAKAO_CLIENT_SECRET`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Kakao secret은 프론트엔드 코드, public env, 문서 예시값에 노출하지 않는다.

## 5. production 배포 정책

- production은 `main`에 머지된 코드만 배포한다.
- GitHub Actions는 main push 또는 수동 dispatch에서 실행한다.
- preview에서 확인한 변경도 production 확정 전에는 main PR 리뷰와 검증을 거친다.
- 배포 후 `https://gattaca.jamissue.com/api/runtime-status`와 smoke check로 readback한다.
## TSK-002-16 운영보드 기준

- 운영실은 읽기 전용 현황판이 아니다. v1 운영실은 최소한 승인 대기자 승인/반려, 운영 대상 정거장 상세 진입, 이벤트 삭제, 운영 요약을 제공한다.
- 운영 요약은 승인 대기자 수, 승인 회원 수, 정거장 수, 메모리+코멘트 기록량을 보여준다.
- 이벤트 삭제는 운영자 전용이며, 삭제 전 확인 대화상자를 거친다.
- 이벤트 생성은 Kakao 알림과 분리되어 있다. 알림 채널 등록/전송은 별도 이슈에서 처리한다.
- 사용자-facing 시간 입력은 날짜+시+분 선택으로 통일한다. `datetime-local`과 native time input은 운영 기준상 금지한다.
## TSK-002-17 운영 정책

- 메모리는 사진 없이 캡션만으로도 남길 수 있다.
- 댓글은 메모리 하위에만 작성되므로, 사진이 없는 경우에도 텍스트 메모리를 먼저 생성한 뒤 댓글을 이어서 작성한다.
- `photoUrl`이 비어 있는 메모리는 삭제 대상이 아니라 정상 기록으로 취급한다.
- 사진 업로드 실패와 사진 미첨부는 구분한다. 미첨부는 성공 가능한 입력이고, 업로드 실패만 오류로 안내한다.
