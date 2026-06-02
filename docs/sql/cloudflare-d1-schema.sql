-- File: docs/sql/cloudflare-d1-schema.sql
-- Purpose: Cloudflare D1 환경에서 추억열차 CRUD를 위한 기본 스키마를 적용한다.
-- Primary Responsibility: Worker CRUD route가 사용하는 profiles/events/memories/comments 테이블 구조를 정의한다.
-- Design Intent:
--   - 프론트 camelCase 계약과 Worker D1 mapper가 기대하는 snake_case 스키마를 명시적으로 고정한다.
--   - 후속 OAuth, 업로드, 권한 강화 이슈가 같은 기초 스키마 위에서 진행되도록 한다.
-- Non-Goals:
--   - Kakao OAuth 세션 저장 구조는 포함하지 않는다.
--   - R2 업로드 메타데이터 확장 컬럼은 아직 포함하지 않는다.
-- Dependencies: Cloudflare D1 (SQLite compatible SQL)

CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY NOT NULL,
    auth_user_id TEXT UNIQUE NOT NULL,
    kakao_nickname TEXT NOT NULL,
    avatar_url TEXT NOT NULL,
    approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')) NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin')) NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    event_at TEXT NOT NULL,
    location TEXT NOT NULL,
    what TEXT NOT NULL,
    how TEXT NOT NULL,
    decision_summary TEXT NOT NULL,
    created_by TEXT NOT NULL REFERENCES profiles(id),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY NOT NULL,
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    author_id TEXT NOT NULL REFERENCES profiles(id),
    photo_url TEXT NOT NULL,
    caption TEXT NOT NULL,
    recorded_at TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY NOT NULL,
    memory_id TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    author_id TEXT NOT NULL REFERENCES profiles(id),
    content TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);
