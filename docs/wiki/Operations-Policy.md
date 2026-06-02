# 운영 정책 (Operations Policy)

이 문서는 `추억열차 (GATTACA)` 서비스의 운영 규칙과 권한 집행 기준을 설명합니다. 기준은 현재 저장소의 Cloudflare Worker 구현이며, 과거 Supabase 운영 가정은 더 이상 source-of-truth가 아닙니다.

---

## 1. 사용자 가입 및 승인 정책

모임 멤버 외의 임의 쓰기 접근을 막기 위해 승인 워크플로우를 유지합니다.

1. **최초 로그인**
   - Kakao OAuth로 로그인한 사용자는 D1 `profiles`에 최초 등록됩니다.
   - 초기 상태는 `pending`입니다.

2. **단톡방 참여 여부 확인**
   - 운영자는 카카오 닉네임과 단톡방 참여자 명단을 대조해 승인 여부를 판단합니다.

3. **승인 집행**
   - 운영자는 관리자 화면 또는 승인 API를 통해 `approval_status`를 `approved`로 변경합니다.
   - 승인된 시점부터 이벤트, 메모리, 코멘트 작성/수정이 가능합니다.

---

## 2. 데이터 수정 및 삭제 정책

기억의 정합성과 삭제 권한 오남용을 막기 위해 삭제 권한은 운영자에게만 둡니다.

1. **영구 삭제 통제권**
   - 이벤트, 메모리, 코멘트의 영구 삭제는 운영자만 가능합니다.
   - 승인 사용자는 작성 및 수정은 가능하지만 삭제는 불가합니다.

2. **권한 판정 기준**
   - 프론트는 세션과 상태에 따라 UI를 제어합니다.
   - 최종 권한 판정은 Worker가 수행합니다.
   - Worker는 request body의 `createdBy`, `authorId`, `userId`를 믿지 않습니다.
   - 세션 사용자와 D1 owner lookup 기준으로 권한을 강제합니다.

---

## 3. 모임 기록 운영 기준

- **확정 결과만 등록**: 단톡방에서 장소, 날짜, 방식이 최종 합의된 일정만 등록합니다.
- **조율 중 사안은 미등록**: 논의 중인 후보 일정은 추억열차에 올리지 않습니다.
- **회고 중심 사용**: 이 서비스는 일정 조율 도구가 아니라 확정된 일정의 기록과 회고를 남기는 메모리얼 페이지입니다.
- **부적절 콘텐츠 제거**: 승인 사용자 공간이라도 공격적 텍스트나 부적절한 사진은 운영자가 즉시 삭제할 수 있습니다.

---

## 4. 환경변수 및 secret 관리 정책

### 프론트 build 변수

- `VITE_CLOUDFLARE_API_URL`
- `VITE_ADMIN_USER_ID` (선택)
- `VITE_ENABLE_DEMO_MODE`

규칙:

- `VITE_ENABLE_DEMO_MODE=true`는 local/test seam에서만 사용합니다.
- production build에서는 demo fallback을 기본 경로로 사용하지 않습니다.

### Worker vars

- `APP_BASE_URL`
- `SESSION_TTL_SECONDS`
- `ADMIN_AUTH_USER_ID` (선택)

### Worker secrets

- `KAKAO_REST_API_KEY`
- `KAKAO_CLIENT_SECRET`

민감 정보는 프론트 코드나 공개 GitHub 설정에 포함하지 않습니다. Kakao secret은 Cloudflare Workers secret으로만 관리합니다.

---

## 5. live 운영 경계

현재 live 환경에서 확인된 사실:

- Worker는 배포되어 있음
- D1 / KV / R2 binding은 붙어 있음
- production UI는 demo fallback으로 속이지 않음
- Kakao secret이 없으면 로그인 버튼을 비활성화하고 경고를 노출함

현재 남은 외부 블로커:

- `KAKAO_REST_API_KEY`
- `KAKAO_CLIENT_SECRET`

이 두 값이 주입되면 실제 운영 검증은 아래 순서로 진행합니다.

1. `auth.kakaoOAuthConfigured=true` readback
2. Kakao login redirect/callback 확인
3. session restore 확인
4. 승인 사용자 event create
5. memory upload / comment create
6. Kakao relay 수신 확인
