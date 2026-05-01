# 13. 런치 체크리스트

## A. GitHub Pages 공개 기본형 체크리스트
- [ ] `main` 브랜치에 현재 코드가 커밋되어 있다.
- [ ] 원격 저장소 `origin`에 푸시되어 있다.
- [ ] GitHub Actions 권한이 활성화되어 있다.
- [ ] 저장소 Settings > Pages 에서 Source가 `GitHub Actions`로 설정되어 있다.
- [ ] Actions 탭에서 `Deploy to GitHub Pages` 워크플로우가 성공했다.
- [ ] Pages URL에서 홈, 이벤트 목록, 상세 페이지가 데모 모드로 열린다.
- [ ] 새로고침 시 404 없이 SPA 라우팅이 유지된다.

## B. Supabase 연결 체크리스트
- [ ] Supabase 프로젝트를 생성했다.
- [ ] [docs/sql/supabase-schema.sql](/D:/Code305/GATTACA/docs/sql/supabase-schema.sql)을 실행했다.
- [ ] `memory-photos` public bucket을 생성했다.
- [ ] RLS 정책이 활성화되어 있다.
- [ ] `VITE_SUPABASE_URL` 값을 확인했다.
- [ ] `VITE_SUPABASE_ANON_KEY` 값을 확인했다.

## C. Kakao 로그인 연결 체크리스트
- [ ] Kakao Developers에서 앱을 생성했다.
- [ ] Kakao 로그인 기능을 활성화했다.
- [ ] Supabase에서 제공한 Auth callback URL을 Kakao Redirect URI로 등록했다.
- [ ] Supabase Authentication > Providers > Kakao 설정을 완료했다.
- [ ] 첫 운영자 계정으로 로그인해 `auth.users.id`를 확인했다.
- [ ] 해당 값을 `VITE_ADMIN_USER_ID`로 정리했다.

## D. GitHub Secrets 체크리스트
- [ ] 저장소 Settings > Secrets and variables > Actions 에 아래 값을 등록했다.
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] `VITE_ADMIN_USER_ID`

## E. 운영 검증 체크리스트
- [ ] 비로그인 사용자는 열람만 가능한지 확인했다.
- [ ] 첫 로그인 사용자가 pending 상태로 생성되는지 확인했다.
- [ ] 운영자 승인 전에는 작성이 차단되는지 확인했다.
- [ ] 승인 후 이벤트 등록이 가능한지 확인했다.
- [ ] 메모리 등록과 코멘트 등록이 가능한지 확인했다.
- [ ] 운영자만 삭제 가능한지 확인했다.

## F. 릴리스 직전 최종 확인
- [ ] `npm run lint` 통과
- [ ] `npm run test` 통과
- [ ] `npm run build` 통과
- [ ] README와 Wiki 설정 설명이 최신 상태다.
