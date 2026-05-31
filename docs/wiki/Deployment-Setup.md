# 배포 / 환경설정 (Deployment & Environment Configuration)

본 문서는 `추억열차 (GATTACA)` 서비스의 로컬 개발 환경 구성, 클라우드 서버리스 인프라 배포 및 환경 변수 주입 방법을 단계별로 명시합니다.

---

## 1. 💻 로컬 개발 환경 세팅 (Local Setup)

로컬 머신에서 프로젝트를 클론하고 개발 서버를 즉시 구동하는 방법입니다.

1. **저장소 클론 및 패키지 설치**:
   ```bash
   git clone https://github.com/ClarusIubar/GATTACA.git
   cd GATTACA
   npm install
   ```
2. **로컬 개발 서버 실행**:
   ```bash
   npm run dev
   ```
   - 브라우저에서 `http://localhost:5173` 으로 접속합니다.
   - 로컬에 `.env.local` 파일이 없더라도 앱은 **자동으로 데모 모드(Demo Mode)**로 전환되어 전체 구조와 라우팅을 100% 정상 열람할 수 있습니다.
3. **로컬 테스트 스위트 실행**:
   ```bash
   # 전체 5단계 TDD 테스트 스위트 일회성 구동
   npx vitest run

   # 실시간 코드 변경 감지 테스트 (Watch Mode)
   npm run test
   ```

---

## 2. 🌐 Cloudflare Pages를 통한 프론트엔드 배포

최종 사용자에게 배포하는 고성능 정적 Pages 배포 사양입니다.

1. Cloudflare 대시보드 ➡️ **[Workers & Pages]** ➡️ **[Pages]** ➡️ **[Connect to Git]** 클릭.
2. `GATTACA` GitHub 저장소를 선택하고 아래 빌드 사양을 대입합니다:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
3. **[Build Environment Variables]**에 다음 환경 변수들을 바인딩합니다:
   - `VITE_SUPABASE_URL` : Supabase 프로젝트 URL 주소
   - `VITE_SUPABASE_ANON_KEY` : Supabase Anon 퍼블릭 키
   - `VITE_ADMIN_USER_ID` : 운영자 1인의 고유 ID 문자열
   - `VITE_API_BASE_URL` : 백엔드 Worker 도메인 주소 (`https://gattaca-backend.your-subdomain.workers.dev`)

> [!NOTE]
> SPA 라우팅의 새로고침 404 오류 방지를 위해 `public/_redirects` 파일이 정상 배포본에 바인딩되어 있으며 자동으로 Cloudflare Edge 서버가 200 리디렉션을 제어합니다.

---

## 3. ⚡ Cloudflare Workers를 통한 백엔드 API Gateway 배포

카카오 API 비밀 키 은닉 및 Supabase 어드민 권한 처리를 프록시하는 Worker 백엔드 배포 가이드입니다.

1. **Wrangler CLI 설정**:
   - `wrangler.toml` 환경 구성 파일을 루트에 배치하고, Node.js 서버리스 배포 코드를 확인합니다.
2. **API 배포 실행**:
   ```bash
   # wrangler CLI를 사용해 엣지 서버리스 배포 단일 집행
   npx wrangler deploy
   ```
3. **보안 시크릿 키 주입 (Secrets)**:
   API 마스터 비밀번호 등급의 키들은 다음 wrangler 명령어로 Workers 보안 비밀 컨테이너에 주입하여 환경변수로 활용합니다:
   ```bash
   npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   npx wrangler secret put KAKAO_CLIENT_SECRET
   ```

---

## 🔒 4. 보안 시크릿 키(Secret Keys) 초정밀 가이드링크

본 프로젝트는 보안 무결성 확보를 위해 배포 자격 토큰 및 데이터베이스/서드파티 비밀 키 관리를 엄격히 통제합니다.

- Cloudflare API Token 발급 방법
- GitHub Actions Secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) 바인딩 방법
- Supabase `service_role` 및 Kakao `Client Secret` 발급 후 Worker에 Secrets 주입하는 방법

위 핵심 보안 세팅의 모든 메뉴별 클릭 경로와 초정밀 가이드는 **[Infrastructure-Specification (인프라 사양 및 연동 가이드)](Infrastructure-Specification)** 위키 문서에 그림을 보듯 상세히 기재되어 있으므로 반드시 참고하여 설정을 마무리하십시오.
