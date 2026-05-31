# 개발기록

## 2026-05-31
- **Cloudflare Native 데이터스토어 생태계(D1, R2, KV) 수평 마이그레이션 및 DIP 격리 실증 완료 (TSK-001-08)**:
  - 외부 BaaS 의존성인 Supabase 대신 Cloudflare Pages Functions(Workers) 에지 백엔드 Native 스택으로 전격 이전.
  - `MemoryTrainRepository` 인터페이스 규격을 100% 준수하는 `CloudflareRepository` 구체 클래스를 `repository.ts` 하위에 완벽히 구현하여 DIP(의존성 역전 원칙)의 결합 격리 설계 가치를 엄밀히 입증.
  - `app-context.tsx` 컨텍스트 주입 로직 고도화: `isCloudflareConfigured` 런타임 라우팅 조건에 따라 에지 백엔드로의 자동 주입 스위칭 연동 완비.
  - REST 기반의 스토리지 업로드(FormData Stream) 및 카카오 OAuth 소셜 로그인 에지 이관 완료.
  - `docs/wiki/Architecture.md` 및 `docs/wiki/Infrastructure-Specification.md` 위키에 Cloudflare D1(SQLite DDL), R2(MIME/CORS), KV(글로벌 세션) 아키텍처 사상과 보안/배포 경계 명세를 공식 최신화 반영.
  - 21개 Vitest 단위/통합/E2E 테스트 케이스 100% 통과 및 TypeScript 빌드 컴파일 무결성 검증 마감 성공.
- **추억열차 아키텍처 고도화 및 5단계 TDD 체계 구축 성공 (TSK-001-01)**:
  - `MemoryTrainRepository` 인터페이스 도입으로 UI 비즈니스 로직과 데이터 보존 레이어 간 결합도 완벽 격리.
  - Vitest를 기반으로 고밀도 단위, 통합, 회귀, 스모크, E2E 시나리오 테스트(총 14개 케이스) 100% 통과 보장.
  - 트레이서빌리티 5대 규격 문서(`GOVERNANCE_INDEX`, `TASK_ID_LEDGER`, `ISSUE_TREE` 등) 구축 및 R1 완료 보고 완료.
- **Supabase BaaS 실서버 스키마 및 마이그레이션 SQL 설계 완료 (TSK-001-02)**:
  - profiles, memories, comments, events 테이블 설계 및 PostgreSQL RLS 다단계 가드 정책 완벽 구현.
  - `docs/sql/supabase-schema.sql` 명세서 및 뼈대 마감 성공.
- **카카오 OAuth 소셜 로그인 및 사용자 권한 가드 연동 완료 (TSK-001-03)**:
  - `signInWithKakao` OAuth 흐름 및 신규 가입 사용자를 `PENDING` 등급으로 자동 락다운하는 `ensureProfile` 런타임 보안 가드 수립.
  - Vitest 통합 테스트 및 빌드 컴파일 100% 검증 완료 및 거버넌스 CLOSED 공식 마감 완료.
- **Supabase Storage 기반 사진 메모리 업로드 유효성 가드 및 Fallback 연동 완료 (TSK-001-04)**:
  - `file-validation.ts` 유틸리티 및 단위 테스트 세트 신규 도입.
  - 사진 업로드 시 5MB 용량 제한 및 JPG/PNG/WEBP 포맷 유효성 검사 선제 가드 구현.
  - 로딩 에러 시 화면 깨짐 방지를 위한 인라인 SVG 디폴트 플레이스홀더 이미지 Fallback 처리 완료.
  - 17개 단위/통합/E2E 테스트 케이스 및 TypeScript 컴파일 빌드 패스 확인 완료 및 거버넌스 CLOSED 공식 마감 완료.
- **운영자 전용 승인 및 영구 삭제 UI 구현 완료 (TSK-001-05)**:
  - AdminPage 일반 유저 접근 시 리다이렉트 Navigate 라우터 가드 적용 완료.
  - EventDetailPage 내 글/댓글 영구 삭제 시 실수 방지를 위한 window.confirm 2단계 보안 가드 도입 완료.
  - 17개 회귀 테스트 통과 및 거버넌스 CLOSED 공식 마감 완료.
- **모임 일정 확정 시 카카오 알림톡/메시지 비동기 자동 발송 구현 완료 (TSK-001-06)**:
  - notification.ts 모듈 신규 설계 및 createEvent 완료 콜백 논블로킹 트리거 바인딩 성공.
  - 21개 통합/단위 Vitest 테스트 통과 및 거버넌스 CLOSED 공식 마감 완료.
- **GitHub Actions 및 Pages/Cloudflare Pages 양방향 무인 CI/CD 파이프라인 수립 완료 (TSK-001-07)**:
  - deploy.yml 작성 완료. 빌드 전 21개 Vitest 테스트 통과 강제화 제약 완비.
  - VITE_ 환경변수(GitHub Secrets)와 Cloudflare API Token 배포 보안 격리 수립 완료 및 거버넌스 CLOSED 공식 마감 완료.
- **Parent Core Issue `#2` (TSK-001-00) 대단원으로 CLOSED 공식 마감 완료**.

## 2026-05-01
- 추억열차 v1 초기 구현 시작
- GitHub Pages 정적 구조와 Supabase 권한 모델 채택
- 데모 모드와 운영 모드를 함께 제공하는 프론트엔드 구성
- Dodecagon 프레임워크 기준 문서 세트 작성
