# 런치 체크리스트 (Launch Checklist)

본 문서는 `추억열차 (GATTACA)` 서비스 배포 및 프로덕션 활성화를 위한 종합 품질 및 런치 점검 항목입니다.

---

## 1. ⚙️ R1 아키텍처 & 테스트 품질 게이트 (완료)
- [x] **DIP 격리 구조 설계 및 검증**: `MemoryTrainRepository` 및 모킹 스위칭 아키텍처 검증 완료.
- [x] **단위 테스트(Unit)**: `localStorage` 무결성 검증 통과 (6개 케이스).
- [x] **통합/회귀 테스트(Integration/Regression)**: 회원 등급별 권한 차단 필터 및 상태 비오염성 보장 통과 (4개 케이스).
- [x] **스모크 테스트(Smoke)**: 앱 초기 마운트 및 닉네임 바인딩 정상 렌더링 검증 통과 (3개 케이스).
- [x] **E2E 테스트(E2E)**: 종합 사용자 라이프사이클 통합 검증 통과 (1개 종합 시나리오 케이스).
- [x] **정적 분석 및 컴파일**: `npm run lint` 오류 0건, `npm run build` tsc 컴파일 및 Vite 번들 성공.

---

## 2. 🌐 Pages 기본형 공개 및 배포 자동화
- [x] **Git 형상 갱신**: `main` 브랜치에 R1 품질 코드가 정상적으로 푸시(Push) 및 머지 완료.
- [ ] **GitHub Actions 배포 자동화**: `.github/workflows/deploy.yml` 성공적 마운트 및 구동 확인.
- [ ] **GitHub Pages URL 검증**: 환경변수 주입 없이도 기본적으로 `데모 모드` 구조가 에러 없이 구동되는지 검증.

---

## 3. 🛡️ 실사용 BaaS 및 소셜 보안 연결 (차기 과제)
- [ ] **Supabase DB 스키마 적용**: `docs/sql/schema.sql` 쿼리를 사용해 SQL Editor에서 테이블 3종 생성 및 RLS 정책 바인딩 완료.
- [ ] **Storage 버킷 구축**: `memory-images` Public 버킷 생성 및 5MB 제한 RLS 업로드 정책 세팅 완료.
- [ ] **카카오 Developers 연동**: 카카오 플랫폼에 Web Redirect URI 및 JavaScript/REST 키 발급 매핑 완료.
- [ ] **Cloudflare Workers API 배포**: 백엔드 Proxy API Worker 서버 배포 완료 (`npx wrangler deploy`).
- [ ] **Secrets 키 변수 주입**:
  - [ ] GitHub Repository Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` 주입.
  - [ ] Cloudflare Workers Secrets: `SUPABASE_SERVICE_ROLE_KEY`, `KAKAO_CLIENT_SECRET` 주입.

---

## 4. 🧪 최종 프로덕션 실사용 시나리오 검증
- [ ] **Pending 가입 검증**: 최초 카카오 로그인 시 사용자가 `PENDING` 등급으로 안전하게 데이터베이스에 가입 신청/가드되는지 확인.
- [ ] **승인 회원 가동성**: 운영자가 등급을 `APPROVED`로 변경한 후, 모임 일정 추가 및 사진, 코멘트 등록이 RLS 보안 필터를 뚫고 실서버에 적재되는지 검증.
- [ ] **운영자 전면 통제**: `ADMIN` 계정을 통해 불적절한 일정/댓글이 DB에서 즉각 삭제되는지 확인.

---

상세한 환경변수 설정 및 시크릿 키 획득 경로는 [Infrastructure-Specification](Infrastructure-Specification) 가이드를 참고하십시오.
