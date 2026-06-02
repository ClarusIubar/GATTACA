# 인프라 사양 및 연동 가이드 (Infrastructure Specification)

이 문서는 `추억열차 (GATTACA)` 프로젝트가 현재 사용 중인 Cloudflare Workers / Pages / D1 / R2 / KV 구조와, Kakao OAuth 및 메시지 relay가 어떤 경계에서 동작하는지 설명합니다. 목적은 지금 무엇이 구현되었고 무엇이 마지막 외부 단계인지 운영자와 후속 작업자가 바로 판단할 수 있게 하는 것입니다.

---

## 1. 현재 시스템 구성

### 1.1 프론트엔드

- 기술: React + Vite
- 배포: Cloudflare Pages
- 역할:
  - 공개 페이지 렌더링
  - 이벤트 / 메모리 / 코멘트 UI
  - Worker API 호출
  - production에서 Kakao 미구성 상태를 사용자에게 명시

### 1.2 백엔드

- 기술: Cloudflare Workers
- 역할:
  - REST API 제공
  - Kakao OAuth callback 처리
  - KV session 생성/복원
  - D1 CRUD
  - R2 업로드
  - Kakao relay endpoint 제공
  - 승인/운영자 권한 강제

### 1.3 저장소

- D1:
  - `profiles`
  - `events`
  - `memories`
  - `comments`
- KV:
  - session store
- R2:
  - memory image storage

---

## 2. Kakao OAuth 및 relay 경계

현재 구현된 Kakao 관련 경로:

- `GET /api/auth/kakao`
- `GET /api/auth/callback`
- `GET /api/session`
- `POST /api/auth/logout`
- `POST /api/notifications/kakao-event`

동작 흐름:

1. 프론트가 `GET /api/auth/kakao`로 이동
2. Worker가 Kakao authorize URL로 redirect
3. Kakao가 `GET /api/auth/callback?code=...`로 복귀
4. Worker가 token 교환 및 user profile 조회
5. D1 profile upsert
6. KV session 생성 및 cookie 발급
7. 이후 프론트는 `GET /api/session`으로 현재 사용자 복원

relay 경계:

- 프론트는 Kakao API를 직접 호출하지 않음
- Worker가 session에 저장된 Kakao access token으로 relay 수행
- 승인 사용자 또는 운영자 세션만 relay 요청 가능

현재 마지막 외부 블로커:

- `KAKAO_REST_API_KEY`
- `KAKAO_CLIENT_SECRET`

두 값이 live Worker에 아직 주입되지 않았습니다.

---

## 3. D1 / R2 / KV 경계

### 3.1 D1

D1 스키마 원본:

- [docs/sql/cloudflare-d1-schema.sql](https://github.com/ClarusIubar/GATTACA/blob/main/docs/sql/cloudflare-d1-schema.sql)

데이터 책임:

- `profiles`: auth user와 앱 프로필 매핑, approval/role 상태
- `events`: 일정 본문
- `memories`: 이벤트에 연결된 사진/메모
- `comments`: 메모리에 연결된 코멘트

### 3.2 R2

업로드 경로:

- `POST /api/upload`
- `GET /uploads/<objectKey>`

객체 키 규칙:

- `memories/<session-profile-id>/<uuid>.<ext>`

제한:

- MIME: JPEG / PNG / WEBP
- max size: 5MB

### 3.3 KV

KV는 session store로 사용합니다.

- callback 이후 session 생성
- cookie 기반 사용자 복원
- logout 시 session 제거

---

## 4. 권한 모델

현재 서버 권한 강제 기준:

- 비로그인 사용자: 공개 읽기만 가능
- 승인 대기 사용자: 읽기 가능, 쓰기 차단
- 승인 사용자: 이벤트 / 메모리 / 코멘트 create/update 가능
- 운영자: approval 및 delete 가능

중요한 장치:

- request body의 `createdBy`, `authorId`, `userId`는 권한 근거로 사용하지 않음
- Worker가 세션 사용자와 D1 owner lookup을 기준으로 강제

---

## 5. 배포 구조

### 5.1 GitHub Actions 역할

필수 GitHub Secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

현재 deploy source-of-truth:

1. Worker 배포
2. 배포 결과에서 `workers.dev` URL 추출
3. `VITE_CLOUDFLARE_API_URL`로 주입하여 프론트 build
4. Cloudflare Pages 배포

### 5.2 Worker bindings

- `DB`
- `SESSION`
- `BUCKET`
- `APP_BASE_URL`
- `SESSION_TTL_SECONDS`
- `ADMIN_AUTH_USER_ID` (선택)

Worker secrets:

- `KAKAO_REST_API_KEY`
- `KAKAO_CLIENT_SECRET`

---

## 6. Live readback 상태

검증된 endpoint:

- Pages:
  - [https://61610380.gattaca-di0.pages.dev/](https://61610380.gattaca-di0.pages.dev/)
- Worker health:
  - [https://gattaca-backend.yhh4433.workers.dev/api/health](https://gattaca-backend.yhh4433.workers.dev/api/health)
- Worker runtime status:
  - [https://gattaca-backend.yhh4433.workers.dev/api/runtime-status](https://gattaca-backend.yhh4433.workers.dev/api/runtime-status)

확인된 상태:

- D1 attached
- KV attached
- R2 attached
- production UI does not fall back to demo
- Kakao 미구성 시 로그인 버튼 비활성화 및 안내 배너 노출
- `auth.kakaoRestApiKeyConfigured=false`
- `auth.kakaoClientSecretConfigured=false`
- `auth.kakaoOAuthConfigured=false`

---

## 7. 완료 경계

현재 상태는 다음과 같이 정의합니다.

- "카카오 API만 붙이면 되는 수준"까지는 도달
- 실제 live Kakao account 기준 end-to-end 검증은 아직 미완료

live 완료에 필요한 마지막 증거:

1. Worker secrets 주입
2. `/api/runtime-status`에서 `auth.kakaoOAuthConfigured=true`
3. Kakao login redirect/callback/session restore
4. 승인 사용자 event create -> memory upload -> comment -> Kakao relay 수신 확인
