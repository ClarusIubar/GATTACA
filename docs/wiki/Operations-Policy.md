# 운영정책

## 승인 정책
- 카카오 로그인 후 운영자가 단체방 참여 여부를 확인해 승인한다.
- 실사용 승인 흐름은 Supabase + Kakao 연결 후 동작한다.

## 삭제 정책
- 삭제는 운영자 1인만 수행한다.
- 운영자 판별 기준은 `VITE_ADMIN_USER_ID`와 로그인 사용자의 Auth User ID 일치 여부다.

## 기록 정책
- 단체방에서 이미 확정된 이벤트만 등록한다.
- 메모리와 코멘트는 승인된 사용자만 작성한다.

## 환경변수 정책
- 기본형 확인만 할 때는 환경변수가 없어도 된다.
- 실사용 운영에는 아래 값이 필요하다.
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_ADMIN_USER_ID`
- 자세한 설정 위치는 [Deployment-Setup](Deployment-Setup)에서 관리한다.
