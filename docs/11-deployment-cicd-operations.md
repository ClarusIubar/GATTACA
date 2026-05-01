# 11. 배포, CI/CD, 운영

## 배포 파이프라인
- `main` 브랜치 푸시
- 의존성 설치
- 테스트 실행
- Vite 빌드
- GitHub Pages 아티팩트 업로드
- Pages 배포

## 환경별 전략
- 개발:
  - 데모 모드 또는 개발용 Supabase 프로젝트
- 운영:
  - GitHub Pages
  - Supabase 운영 프로젝트
- 롤백:
  - 이전 커밋 재배포
  - Supabase 스키마 변경은 SQL 이력 기준 수동 롤백

## Kakao 로그인 설정
1. Kakao Developers에서 앱 생성
2. Redirect URI에 Supabase Auth Callback 등록
3. Supabase Authentication Provider에서 Kakao 설정
4. 운영자 계정 로그인 후 `auth.users.id`를 `VITE_ADMIN_USER_ID`로 설정

## Supabase 운영 설정
1. [docs/sql/supabase-schema.sql](/D:/Code305/GATTACA/docs/sql/supabase-schema.sql) 실행
2. `memory-photos` public bucket 생성
3. RLS 정책 활성화 확인
4. `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ADMIN_USER_ID`를 GitHub Secrets에 저장

## 운영 관측성
- 초기 v1은 브라우저 오류 배너와 Supabase 로그를 주요 관측 수단으로 사용
- 추후 확장:
  - 에러 추적 도구
  - 사용자 행동 분석

## 비상 대응
- 로그인 오류: Kakao/Supabase Redirect URI 점검
- 업로드 오류: Storage bucket 정책 점검
- 권한 오류: profiles row와 approval_status, role 값 점검
