# 개발기록

## 2026-05-31
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

## 2026-05-01
- 추억열차 v1 초기 구현 시작
- GitHub Pages 정적 구조와 Supabase 권한 모델 채택
- 데모 모드와 운영 모드를 함께 제공하는 프론트엔드 구성
- Dodecagon 프레임워크 기준 문서 세트 작성
