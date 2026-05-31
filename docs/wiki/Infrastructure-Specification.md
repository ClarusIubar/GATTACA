# 인프라 사양 및 연동 가이드 (Infrastructure Specification)

본 문서는 `추억열차(GATTACA)` 프로젝트가 R1 아키텍처(DIP & TDD) 구축 이후 실서버 프로덕션을 위해 연동해야 할 **카카오 API, Supabase, Cloudflare Workers & Pages**에 대한 명세서입니다. 사전 지식이 없는 개발자/운영자도 순서대로 실행하면 환경을 완벽하게 재구성할 수 있도록 단계별 가이드를 상세히 기술합니다.

---

## 1. 카카오 API 연동 명세 (Kakao OAuth & Message API)

카카오 로그인 기능과 단톡방 연동(알림 메시지 발송)을 위한 설정 및 REST API 사용법입니다.

### 1.1 Kakao Developers 애플리케이션 생성
1. [Kakao Developers](https://developers.kakao.com/) 포털에 로그인합니다.
2. **[내 애플리케이션]** ➡️ **[애플리케이션 추가하기]**를 클릭합니다.
   - 앱 이름: `추억열차 (GATTACA)`
   - 사업자명: `개인 개발/모임`
3. 생성된 애플리케이션의 **[앱 키]** 메뉴에서 다음 키들을 안전한 곳에 기록해 둡니다:
   - `REST API 키` (Cloudflare Workers 백엔드에서 사용)
   - `JavaScript 키` (React 프론트엔드 SDK에서 사용)

### 1.2 카카오 로그인(OAuth 2.0) 활성화 및 설정
1. **[제품 설정]** ➡️ **[카카오 로그인]**으로 이동하여 **[활성화 설정]**을 `ON`으로 변경합니다.
2. **[Redirect URI]** 메뉴에서 **[등록]**을 클릭하고 다음 주소들을 입력합니다:
   - 로컬 테스트 환경: `http://localhost:5173/oauth/callback`
   - 프로덕션 환경 (Cloudflare Pages): `https://gattaca.pages.dev/oauth/callback`
3. **[동의항목]** 설정으로 이동하여 다음 사용자 정보 권한을 활성화합니다:
   - **프로필 정보(닉네임/프로필 사진)**: 필수 동의 (가입 시 닉네임 표기용)
   - **카카오계정(이메일)**: 선택 동의 (고유 식별자 또는 연락용)

### 1.3 로그인 및 토큰 교환 시퀀스 (REST API)
사용자가 `로그인` 버튼을 누르면 다음 흐름이 발생합니다:

1. **인가 코드(Authorization Code) 요청**:
   - 프론트엔드가 사용자를 아래 주소로 리다이렉트합니다.
   ```text
   GET https://kauth.kakao.com/oauth/authorize?client_id={REST_API_KEY}&redirect_uri={REDIRECT_URI}&response_type=code
   ```
2. **인가 코드 수신**:
   - 인증 완료 후 카카오가 `Redirect URI`로 사용자를 돌려보내며 URL 쿼리 스트링에 `?code={AUTHORIZATION_CODE}`를 전달합니다.
3. **액세스 토큰(Access Token) 발급 (Cloudflare Worker 위임)**:
   - 프론트엔드는 획득한 `code`를 백엔드(CF Worker)에 전달하고, Worker는 카카오 서버로 다음과 같이 토큰 교환 API를 호출합니다.
   ```text
   POST https://kauth.kakao.com/oauth/token
   Content-Type: application/x-www-form-urlencoded

   grant_type=authorization_code
   &client_id={REST_API_KEY}
   &redirect_uri={REDIRECT_URI}
   &code={AUTHORIZATION_CODE}
   ```
   - 반환받은 `access_token`을 사용해 카카오 사용자 정보 API를 호출하여 고유 ID 및 프로필을 획득합니다:
   ```text
   GET https://kapi.kakao.com/v2/user/me
   Header: Authorization: Bearer {ACCESS_TOKEN}
   ```

### 1.4 나에게 보내기 / 메시지 API (알림 메시지 발송)
일정 확정 시 사용자 카카오톡으로 자동 알림을 전송하는 사양입니다.
- **API 엔드포인트**: `POST https://kapi.kakao.com/v2/api/talk/memo/default/send`
- **헤더**: `Authorization: Bearer {USER_ACCESS_TOKEN}`
- **전송 바디(x-www-form-urlencoded)**:
  ```text
  template_object={
    "object_type": "text",
    "text": "[추억열차] 새로운 모임 일정 '5월 정기 모임'이 확정되었습니다! 지금 접속하여 추억을 등록해 보세요.",
    "link": {
      "web_url": "https://gattaca.pages.dev",
      "mobile_web_url": "https://gattaca.pages.dev"
    },
    "button_title": "열차 타러 가기"
  }
  ```

---

## 2. Supabase 사양 명세 (PostgreSQL DB, RLS, Storage)

Supabase BaaS 인프라를 활용하여 실시간 관계형 데이터 보존 및 보안 필터를 구현하기 위한 상세 설정 명세입니다.

### 2.1 데이터베이스 스키마 설계 및 DDL SQL
Supabase **[SQL Editor]**를 통해 다음 테이블들을 직접 생성합니다.

```sql
-- 1. 사용자 테이블 (member_grade: PENDING, APPROVED, ADMIN)
CREATE TABLE public.members (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    kakao_id VARCHAR(255) UNIQUE NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    grade VARCHAR(20) DEFAULT 'PENDING' CHECK (grade IN ('PENDING', 'APPROVED', 'ADMIN')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. 추억 일정(이벤트) 테이블
CREATE TABLE public.memories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    image_url TEXT,
    created_by UUID REFERENCES public.members(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. 코멘트 테이블
CREATE TABLE public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    memory_id UUID REFERENCES public.memories(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_by UUID REFERENCES public.members(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

### 2.2 행 단위 보안 정책 (Row Level Security - RLS)
회원 권한 등급에 따른 데이터 쓰기/삭제 분리 가드를 DB 레벨에서 강제하기 위한 핵심 정책입니다. RLS 활성화 및 세부 정책 정책 SQL입니다.

```sql
-- RLS 활성화
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- [A. Members 테이블 보안 정책]
-- 1. 본인 정보는 가입 신청(Insert) 및 조회(Select) 가능
CREATE POLICY "Allow members profile insert" ON public.members 
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow members profile select" ON public.members 
    FOR SELECT USING (true);

-- 2. 회원 등급 변경은 ADMIN(운영자)만 가능
CREATE POLICY "Allow only admin update members" ON public.members 
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.members 
            WHERE id = auth.uid() AND grade = 'ADMIN'
        )
    );

-- [B. Memories 테이블 보안 정책]
-- 1. 모든 접속자(비승인 포함)는 일정 조회가 가능함
CREATE POLICY "Allow all select memories" ON public.memories 
    FOR SELECT USING (true);

-- 2. APPROVED(승인 회원) 또는 ADMIN(운영자) 등급만 일정 등록(Insert)이 가능함
CREATE POLICY "Allow approved members insert memories" ON public.memories 
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.members 
            WHERE id = auth.uid() AND grade IN ('APPROVED', 'ADMIN')
        )
    );

-- 3. 삭제(Delete)는 ADMIN(운영자)만 가능함
CREATE POLICY "Allow only admin delete memories" ON public.memories 
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.members 
            WHERE id = auth.uid() AND grade = 'ADMIN'
        )
    );

-- [C. Comments 테이블 보안 정책]
-- 1. 모든 접속자는 코멘트 조회가 가능함
CREATE POLICY "Allow all select comments" ON public.comments 
    FOR SELECT USING (true);

-- 2. APPROVED(승인 회원) 또는 ADMIN(운영자) 등급만 코멘트 등록이 가능함
CREATE POLICY "Allow approved members insert comments" ON public.comments 
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.members 
            WHERE id = auth.uid() AND grade IN ('APPROVED', 'ADMIN')
        )
    );
```

### 2.3 Supabase Storage 업로드 명세
추억 사진 파일을 저장하고 공용 URL로 서빙하기 위한 파일 스토리지 명세입니다.
1. Supabase 대시보드에서 **[Storage]** 메뉴로 이동합니다.
2. **[New bucket]**을 클릭하여 `memory-images` 버킷을 생성합니다.
   - **Public bucket** 옵션을 `ON`으로 활성화하여 누구나 사진을 조회할 수 있도록 구성합니다.
3. 스토리지 RLS 정책 설정 (**[Policies]** ➡️ **[memory-images]**):
   - **Insert (업로드)**: `auth.role() = 'authenticated'` 인 사용자 중 회원 등급이 `APPROVED` 혹은 `ADMIN`인 사용자만 업로드 허용.
   - **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp` (용량 제한: 파일당 최대 5MB).

---

## 3. Cloudflare Workers & Pages 명세 (Deployment & Backend Proxy)

서버리스 인프라인 Cloudflare를 활용하여 고성능 프론트엔드 정적 웹 서빙과 안전한 백엔드 API Gateway 환경을 구축하는 가이드입니다.

### 3.1 Cloudflare Pages (프론트엔드 React SPA 배포)
Vite 기반 React 프론트엔드 소스 코드를 글로벌 Edge CDN에 배포하는 순서입니다.

1. Cloudflare 대시보드 로그인 ➡️ **[Workers & Pages]** ➡️ **[Pages]** ➡️ **[Create a project]** ➡️ **[Connect to Git]** 클릭.
2. GATTACA GitHub 레포지토리를 연결하고 빌드 세팅을 다음과 같이 적용합니다:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
3. **[Environment variables]** (빌드 환경 변수) 등록:
   - `VITE_SUPABASE_URL` = `https://your-supabase-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `your-anon-key-here`
   - `VITE_API_BASE_URL` = `https://gattaca-backend.your-subdomain.workers.dev` (이하 3.2 단계의 CF Workers 주소)

> [!IMPORTANT]
> **SPA 라우팅 Redirect 설정**: Cloudflare Pages에서 React-Router 리다이렉트 시 404 에러 방지를 위해, 프로젝트 루트(`public/`) 디렉토리에 `_redirects` 파일을 만들어 아래 내용을 기재해야 합니다:
> ```text
> /*    /index.html   200
> ```

### 3.2 Cloudflare Workers (백엔드 프록시 및 관리 API)
클라이언트 측에 민감한 API Key(예: Supabase Service Role Key, 카카오 Client Secret)를 노출하지 않기 위해 Workers를 프록시 백엔드로 배치합니다.

#### 1. Worker 생성 및 wrangler 설정 (`wrangler.toml` 예시)
프로젝트 루트 또는 독립된 `backend/` 폴더에 Cloudflare wrangler 설정을 배치합니다.

```toml
name = "gattaca-backend"
main = "src/index.ts"
compatibility_date = "2026-05-31"

[vars]
SUPABASE_URL = "https://your-supabase-project.supabase.co"
# (주의) 민감한 키값은 아래 CLI를 통해 Secret으로 등록해야 하며 wrangler.toml에 직접 커밋하지 않습니다.
```

#### 2. Worker Secret 암호 키 등록 (CLI 명령어)
터미널을 열고 다음 명령어로 프라이빗 관리 권한 키들을 등록합니다.
```bash
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put KAKAO_CLIENT_SECRET
```

#### 3. Workers API 엔드포인트 주요 소스코드 구조 (`src/index.ts`)
```typescript
import { createClient } from '@supabase/supabase-js';

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  KAKAO_CLIENT_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // CORS 헤더 설정
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 1. 카카오 토큰 및 가입 중계 엔드포인트
    if (url.pathname === '/api/auth/kakao' && request.method === 'POST') {
      const { code, redirect_uri } = await request.json() as any;
      
      // 카카오 토큰 요청
      const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: 'your-kakao-javascript-or-rest-key',
          client_secret: env.KAKAO_CLIENT_SECRET,
          redirect_uri,
          code,
        })
      });
      const tokens = await tokenResponse.json() as any;

      // 카카오 사용자 정보 조회
      const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });
      const userData = await userResponse.json() as any;

      // Supabase Service Role을 활용해 보안 가드로 강제 등급 부여 및 회원가입 처리
      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
      const { data, error } = await supabase
        .from('members')
        .upsert({
          id: userData.id, // Kakao ID를 고유식별자로 사용 가능
          kakao_id: String(userData.id),
          nickname: userData.properties.nickname,
          avatar_url: userData.properties.profile_image,
          grade: 'PENDING' // 신규 회원은 무조건 승인대기로 시작
        })
        .select();

      return new Response(JSON.stringify({ user: data, tokens }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }
};
```

#### 4. 백엔드 배포 명령어
```bash
# Wrangler를 통한 Cloudflare Workers 서버리스 배포
npx wrangler deploy
```

---

이 명세에 적시된 SQL DDL 및 API 흐름도를 바탕으로 인프라(카카오 로그인, Supabase, Cloudflare)를 순차적으로 구축하면, R1 단위 테스트가 보증하는 구조 위에서 완벽히 실시간 연동이 이루어지는 강력한 프로덕션 웹 서비스를 구동할 수 있습니다.
