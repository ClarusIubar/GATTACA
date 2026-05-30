# 배포 / 환경설정

## 1. GitHub Pages에서 기본형 바로 보기
- 가능합니다.
- 현재 프로젝트는 환경변수가 없어도 빌드되며, 이 경우 `데모 모드`로 렌더링됩니다.
- 즉, 저장소에 푸시하고 GitHub Pages를 활성화하면 먼저 정적 기본형부터 확인할 수 있습니다.

## 2. GitHub Pages 배포 조건
- 저장소의 GitHub Actions가 실행되어야 합니다.
- 저장소 Settings > Pages에서 GitHub Actions 기반 배포를 사용해야 합니다.
- `main` 브랜치에 푸시하면 워크플로우가 빌드와 배포를 수행합니다.

## 3. 실사용에 필요한 공개 환경변수
- 프론트엔드 환경변수:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_ADMIN_USER_ID`

## 4. 각 값의 의미
- `VITE_SUPABASE_URL`
  - Supabase 프로젝트 URL
- `VITE_SUPABASE_ANON_KEY`
  - Supabase 프론트엔드용 anon key
- `VITE_ADMIN_USER_ID`
  - 운영자 1인의 Supabase Auth User ID
  - 이 값과 로그인 사용자의 `auth.users.id`가 일치하면 운영자 권한을 가집니다.

## 5. 어디에 넣어야 하는가

### 로컬 개발
- `.env.local` 파일에 아래처럼 넣습니다.

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_ADMIN_USER_ID=...
```

### GitHub Actions / GitHub Pages
- 저장소 Settings > Secrets and variables > Actions 에 아래 3개를 등록합니다.
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_ADMIN_USER_ID`

## 6. 추가로 필요한 외부 설정

### Supabase
- SQL 스키마 실행
  - [docs/sql/supabase-schema.sql](https://github.com/ClarusIubar/GATTACA/blob/main/docs/sql/supabase-schema.sql)
- `memory-photos` 버킷 생성
- Authentication에서 Kakao provider 설정
- RLS 정책 활성화 확인

### Kakao Developers
- 앱 생성
- Supabase Auth callback URL을 Redirect URI로 등록

## 7. 키 없이 가능한 것 / 불가능한 것

### 가능한 것
- 홈, 소개, 이벤트 목록, 상세 화면 기본형 확인
- 데모 데이터 기반 UI 점검
- 데모 권한 전환으로 게스트/승인대기/승인회원/운영자 흐름 확인

### 불가능한 것
- 실제 Kakao 로그인
- 실제 이벤트/메모리/코멘트 저장
- 운영자 승인/삭제의 서버 반영

## 8. 권장 순서
1. 먼저 GitHub Pages에 배포해 기본형을 본다.
2. 그다음 Supabase와 Kakao를 연결한다.
3. 마지막으로 운영자 ID를 넣어 승인/삭제까지 실사용 검증한다.
