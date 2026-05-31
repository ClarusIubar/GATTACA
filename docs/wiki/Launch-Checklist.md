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
- [ ] **Cloudflare Pages URL 검증**: 환경변수 주입 없이도 기본적으로 `데모 모드` 구조가 에러 없이 구동되는지 검증.

---

## 3. 🛡️ 실사용 Cloudflare Native & 소셜 보안 연결
- [ ] **Cloudflare D1 SQL 스키마 적용**: D1 SQL 대시보드 또는 Wrangler CLI 마이그레이션을 통해 멤버, 이벤트, 메모리, 코멘트 테이블 빌드 및 제약 조건 검증 완료.
- [ ] **R2 Storage 버킷 구축**: `memory-photos` Public 버킷 생성 및 CORS/MIME 업로드 제약 사항 세팅 완료.
- [ ] **KV Namespace 바인딩**: 글로벌 엣지 분산 세션 스토리지를 위한 `SESSION` 네임스페이스 바인딩 구성 완료.
- [ ] **카카오 Developers 연동**: 카카오 플랫폼에 Web Redirect URI 및 REST API 키 발급 매핑 완료.
- [ ] **Cloudflare Workers API 배포**: 백엔드 Proxy API Worker 서버 배포 완료 (`npx wrangler deploy`).
- [ ] **Secrets & Variables 키 변수 주입**:
  - [ ] GitHub Actions Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` 등록 (배포 권한 2개).
  - [ ] GitHub Actions Variables (vars): `CLOUDFLARE_API_URL`, `ADMIN_USER_ID` 등록.
  - [ ] Cloudflare Workers Secrets: `KAKAO_REST_API_KEY`, `KAKAO_CLIENT_SECRET` 등록.

---

## 4. 🧪 최종 프로덕션 실사용 시나리오 검증
- [ ] **Pending 가입 검증**: 최초 카카오 로그인 시 사용자가 `PENDING` 등급으로 안전하게 데이터베이스에 가입 신청/가드되는지 확인.
- [ ] **승인 회원 가동성**: 운영자가 등급을 `APPROVED`로 변경한 후, 모임 일정 추가 및 사진, 코멘트 등록이 보안 필터를 뚫고 실서버에 적재되는지 검증.
- [ ] **운영자 전면 통제**: `ADMIN` 계정을 통해 불적절한 일정/댓글이 D1 DB에서 즉각 삭제되는지 확인.

---

## 🚨 5. 배포 장애 극복 및 비상 롤백 프로토콜 (Emergency Rollback Plan)

프로덕션 릴리즈 및 스키마 반영 과정에서 심각한 오류가 발생했을 때 즉각적이고 무중단 수준으로 서비스를 원상 복구하기 위한 롤백 절차입니다.

### [A] 프론트엔드 배포 실패 시 1클릭 롤백 (Cloudflare Pages)
1. Cloudflare Dashboard ➡️ **[Workers & Pages]** ➡️ **[Pages]** ➡️ `GATTACA` 프로젝트를 선택합니다.
2. **[Deployments]** (배포 이력) 탭으로 이동합니다.
3. 리스트에 나열된 배포 버전 중, 이번 배포 직전의 **가장 최근 성공한 배포 버전**을 찾아 우측의 **[...]** 버튼을 클릭합니다.
4. **[Rollback to this deployment]** (이 배포 버전으로 롤백) 메뉴를 클릭하고 확인을 선택합니다.
5. **결과**: 단 5초 이내에 글로벌 Edge CDN 캐시가 이전 버전으로 지시 및 강제 매핑되어, 서버 중단이나 유저 리포트 폭증 없이 안전하게 원복 완료됩니다.

### [B] DB 스키마 마이그레이션 실패 시 스키마 롤백 (Cloudflare D1 SQL)
1. Cloudflare Dashboard ➡️ **[D1 Databases]** ➡️ `gattaca-d1` 데이터베이스 진입 ➡️ **[Console]** 혹은 wrangler CLI로 스키마 복구.
2. wrangler를 사용하는 경우 아래 롤백 SQL 스크립트를 사용하여 D1 SQLite 테이블들의 제약 조건을 이전 상태로 복구 및 테이블 드롭 처리를 진행합니다.
```sql
-- D1 SQLite 테이블 롤백 및 초기화 스크립트
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS memories;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS members;
```

---

상세한 환경변수 설정 및 시크릿 키 획득 경로는 [Infrastructure-Specification](Infrastructure-Specification) 가이드를 참고하십시오.

