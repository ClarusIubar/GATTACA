# Task ID Ledger

| Task ID | Issue | PR | Merge commit | Document path | Why | Problem | How | Remaining gap | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TSK-001-01 | https://github.com/ClarusIubar/GATTACA/issues/3 | https://github.com/ClarusIubar/GATTACA/pull/10 | not applicable | docs/TASK_ID_LEDGER.md | 아키텍처 개선 및 테스트 고도화 | 데이터 레이어 결합도가 높고 자동 검증 부재 | DIP 리포지토리 패턴 및 5단계 Vitest 테스트 고도화 | Supabase 실제 DB 연동 및 카카오 연동은 차기 과제로 이월 | completed |
| TSK-001-02 | https://github.com/ClarusIubar/GATTACA/issues/4 | not applicable | not applicable | docs/sql/supabase-schema.sql | Supabase 실서버 연동 | 수동 모킹 수준을 넘어 실제 데이터베이스 적재 및 보안 규칙 가드 필요 | PostgreSQL 스키마 및 RLS 다단계 보안 SQL 명세 설계 완료 | Storage 사진 업로드 실서버 바인딩은 차기 과제로 분리 | completed |
| TSK-001-03 | https://github.com/ClarusIubar/GATTACA/issues/5 | not applicable | not applicable | src/lib/app-context.tsx | 카카오 OAuth 연동 및 보안 가드 수립 | 실서버 카카오 ID 소셜 프로필 적재 시 런타임 보안 락다운 부재 | signInWithKakao 구현 및 ensureProfile 보안 락다운 가드와 14개 통합 Vitest 테스트로 철저히 검증 | Supabase Storage 사진 업로드 실서버 연동은 차기 과제로 분리 | completed |
