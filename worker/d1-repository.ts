/**
 * File: worker/d1-repository.ts
 * Purpose: 추억열차 CRUD를 위한 Cloudflare D1 SQL 접근과 row mapping을 구현합니다.
 * Primary Responsibility: D1의 snake_case 스키마와 프론트의 camelCase 타입 계약을 번역하며 CRUD 쿼리를 수행하는 것입니다.
 * Design Intent:
 *   - HTTP route 계층이 SQL 세부사항을 알지 않도록 저장소 메커니즘을 이 모듈로 격리합니다.
 *   - 프론트 계약과 저장소 스키마 사이의 번역 seam을 한곳에 모아 후속 권한/OAuth 이슈가 route 정책에만 집중하게 합니다.
 * Non-Goals:
 *   - 세션 인증, 운영자 권한 판정, Kakao OAuth 처리는 이 파일에서 다루지 않습니다.
 *   - R2 업로드나 바이너리 파일 저장은 다루지 않습니다.
 * Dependencies: ../src/lib/types, ./http, ./types
 */

import type {
  ApprovalStatus,
  CommentInput,
  CommentRecord,
  EventInput,
  EventRecord,
  MemoryInput,
  MemoryRecord,
  UserProfile,
} from '../src/lib/types'
import { HttpError } from './http'
import type { D1Database, SessionProfileSnapshot } from './types'

interface ProfileRow {
  id: string
  auth_user_id: string
  kakao_nickname: string
  avatar_url: string
  approval_status: ApprovalStatus
  role: 'admin' | 'member'
}

interface EventRow {
  id: string
  title: string
  event_at: string
  location: string
  what: string
  how: string
  decision_summary: string
  created_by: string
}

interface MemoryRow {
  id: string
  event_id: string
  author_id: string
  photo_url: string
  caption: string
  recorded_at: string
}

interface CommentRow {
  id: string
  memory_id: string
  author_id: string
  content: string
  created_at: string
}

function mapProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    kakaoNickname: row.kakao_nickname,
    avatarUrl: row.avatar_url,
    approvalStatus: row.approval_status,
    role: row.role,
  }
}

function mapEvent(row: EventRow): EventRecord {
  return {
    id: row.id,
    title: row.title,
    eventAt: row.event_at,
    location: row.location,
    what: row.what,
    how: row.how,
    decisionSummary: row.decision_summary,
    createdBy: row.created_by,
  }
}

function mapMemory(row: MemoryRow): MemoryRecord {
  return {
    id: row.id,
    eventId: row.event_id,
    authorId: row.author_id,
    photoUrl: row.photo_url,
    caption: row.caption,
    recordedAt: row.recorded_at,
  }
}

function mapComment(row: CommentRow): CommentRecord {
  return {
    id: row.id,
    memoryId: row.memory_id,
    authorId: row.author_id,
    content: row.content,
    createdAt: row.created_at,
  }
}

function randomId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

async function hasExistingAdmin(db: D1Database): Promise<boolean> {
  const row = await db
    .prepare(
      `
        SELECT id
        FROM profiles
        WHERE role = 'admin'
        LIMIT 1
      `,
    )
    .first<{ id: string }>()
  return Boolean(row?.id)
}

async function runStatement(db: D1Database, query: string, ...values: unknown[]): Promise<void> {
  await db.prepare(query).bind(...values).run()
}

async function requireExisting(db: D1Database, table: string, id: string): Promise<void> {
  const row = await db.prepare(`SELECT id FROM ${table} WHERE id = ?1`).bind(id).first<{ id: string }>()
  if (!row) {
    throw new HttpError(404, 'not_found', `${table} 항목을 찾을 수 없습니다: ${id}`)
  }
}

/**
 * 공개 API: D1에 저장된 사용자 프로필 목록을 조회합니다.
 * 왜 존재하는가: 프론트의 승인/운영자 판단은 profiles 계약에 의존하기 때문입니다.
 * 매개변수:
 * - `db`: Cloudflare D1 binding
 * 반환값: 프론트 타입과 일치하는 `UserProfile[]`
 * 에러 동작: D1 오류는 상위 route에서 JSON 에러로 변환됩니다.
 * 제약: 이 이슈에서는 조회/승인 상태 갱신만 지원합니다.
 */
export async function listProfiles(db: D1Database): Promise<UserProfile[]> {
  const result = await db
    .prepare(
      `
        SELECT id, auth_user_id, kakao_nickname, avatar_url, approval_status, role
        FROM profiles
        ORDER BY created_at ASC
      `,
    )
    .all<ProfileRow>()
  return (result.results ?? []).map(mapProfile)
}

export async function findProfileById(db: D1Database, profileId: string): Promise<UserProfile | null> {
  const row = await db
    .prepare(
      `
        SELECT id, auth_user_id, kakao_nickname, avatar_url, approval_status, role
        FROM profiles
        WHERE id = ?1
      `,
    )
    .bind(profileId)
    .first<ProfileRow>()
  return row ? mapProfile(row) : null
}

/**
 * 공개 API: 프로필 승인 상태를 갱신합니다.
 * 왜 존재하는가: 현재 프론트 admin 페이지가 approval 상태 변경을 호출하기 때문입니다.
 * 매개변수:
 * - `db`: Cloudflare D1 binding
 * - `profileId`: 대상 프로필 ID
 * - `status`: 새 승인 상태
 * 반환값: 없음
 * 에러 동작: 대상 프로필이 없으면 404 `HttpError`를 throw 합니다.
 * 제약: role 변경은 이 이슈 범위 밖입니다.
 */
export async function updateProfileApproval(
  db: D1Database,
  profileId: string,
  status: ApprovalStatus,
): Promise<void> {
  await requireExisting(db, 'profiles', profileId)
  await runStatement(
    db,
    `
      UPDATE profiles
      SET approval_status = ?2
      WHERE id = ?1
    `,
    profileId,
    status,
  )
}

/**
 * 공개 API: Kakao 식별 정보로 profile을 조회하거나 upsert합니다.
 * 왜 존재하는가: OAuth callback에서 current-user 세션을 만들기 전에 내부 profile ID가 필요하기 때문입니다.
 * 매개변수:
 * - `db`: Cloudflare D1 binding
 * - `identity`: Kakao에서 얻은 식별 정보
 * 반환값: 세션에 넣을 `SessionProfileSnapshot`
 * 에러 동작: D1 오류는 상위 route에서 JSON 에러로 변환됩니다.
 * 제약: 최초 생성 시 기본 role은 `member`, approvalStatus는 `pending`입니다.
 */
export async function upsertProfileFromKakaoIdentity(
  db: D1Database,
  identity: {
    authUserId: string
    kakaoNickname: string
    avatarUrl: string
  },
  options?: {
    adminAuthUserId?: string
  },
): Promise<SessionProfileSnapshot> {
  const shouldBootstrapAdmin = !options?.adminAuthUserId && !(await hasExistingAdmin(db))
  const isAdminIdentity =
    (Boolean(options?.adminAuthUserId) && identity.authUserId === options?.adminAuthUserId) ||
    shouldBootstrapAdmin
  const existing = await db
    .prepare(
      `
        SELECT id, auth_user_id, kakao_nickname, avatar_url, approval_status, role
        FROM profiles
        WHERE auth_user_id = ?1
      `,
    )
    .bind(identity.authUserId)
    .first<ProfileRow>()

  if (existing) {
    await runStatement(
      db,
      `
        UPDATE profiles
        SET kakao_nickname = ?2,
            avatar_url = ?3,
            approval_status = ?4,
            role = ?5
        WHERE auth_user_id = ?1
      `,
      identity.authUserId,
      identity.kakaoNickname,
      identity.avatarUrl,
      isAdminIdentity ? 'approved' : existing.approval_status,
      isAdminIdentity ? 'admin' : existing.role,
    )
    return {
      profileId: existing.id,
      authUserId: identity.authUserId,
      role: isAdminIdentity ? 'admin' : existing.role,
      approvalStatus: isAdminIdentity ? 'approved' : existing.approval_status,
      kakaoNickname: identity.kakaoNickname,
      avatarUrl: identity.avatarUrl,
    }
  }

  const profileId = randomId('profile')
  await runStatement(
    db,
    `
      INSERT INTO profiles (id, auth_user_id, kakao_nickname, avatar_url, approval_status, role)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6)
    `,
    profileId,
    identity.authUserId,
    identity.kakaoNickname,
    identity.avatarUrl,
    isAdminIdentity ? 'approved' : 'pending',
    isAdminIdentity ? 'admin' : 'member',
  )

  return {
    profileId,
    authUserId: identity.authUserId,
    role: isAdminIdentity ? 'admin' : 'member',
    approvalStatus: isAdminIdentity ? 'approved' : 'pending',
    kakaoNickname: identity.kakaoNickname,
    avatarUrl: identity.avatarUrl,
  }
}

/**
 * 공개 API: 이벤트 목록을 조회합니다.
 * 왜 존재하는가: 이벤트 타임라인과 상세 진입의 기본 데이터 원본이기 때문입니다.
 * 매개변수:
 * - `db`: Cloudflare D1 binding
 * 반환값: `EventRecord[]`
 * 에러 동작: D1 오류는 상위 route에서 JSON 에러로 변환됩니다.
 * 제약: 정렬 기준은 최신 eventAt 우선입니다.
 */
export async function listEvents(db: D1Database): Promise<EventRecord[]> {
  const result = await db
    .prepare(
      `
        SELECT id, title, event_at, location, what, how, decision_summary, created_by
        FROM events
        ORDER BY event_at DESC
      `,
    )
    .all<EventRow>()
  return (result.results ?? []).map(mapEvent)
}

export async function getEventById(db: D1Database, eventId: string): Promise<EventRecord> {
  const row = await db
    .prepare(
      `
        SELECT id, title, event_at, location, what, how, decision_summary, created_by
        FROM events
        WHERE id = ?1
      `,
    )
    .bind(eventId)
    .first<EventRow>()
  if (!row) {
    throw new HttpError(404, 'not_found', `events 항목을 찾을 수 없습니다: ${eventId}`)
  }
  return mapEvent(row)
}

export async function createEvent(db: D1Database, input: EventInput, creatorId: string): Promise<EventRecord> {
  const id = randomId('event')
  await runStatement(
    db,
    `
      INSERT INTO events (id, title, event_at, location, what, how, decision_summary, created_by)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
    `,
    id,
    input.title,
    input.eventAt,
    input.location,
    input.what,
    input.how,
    input.decisionSummary,
    creatorId,
  )
  return {
    id,
    createdBy: creatorId,
    ...input,
  }
}

export async function updateEvent(db: D1Database, eventId: string, input: EventInput): Promise<void> {
  await requireExisting(db, 'events', eventId)
  await runStatement(
    db,
    `
      UPDATE events
      SET title = ?2,
          event_at = ?3,
          location = ?4,
          what = ?5,
          how = ?6,
          decision_summary = ?7
      WHERE id = ?1
    `,
    eventId,
    input.title,
    input.eventAt,
    input.location,
    input.what,
    input.how,
    input.decisionSummary,
  )
}

export async function deleteEvent(db: D1Database, eventId: string): Promise<void> {
  await requireExisting(db, 'events', eventId)
  await runStatement(db, `DELETE FROM events WHERE id = ?1`, eventId)
}

export async function listMemories(db: D1Database): Promise<MemoryRecord[]> {
  const result = await db
    .prepare(
      `
        SELECT id, event_id, author_id, photo_url, caption, recorded_at
        FROM memories
        ORDER BY recorded_at DESC
      `,
    )
    .all<MemoryRow>()
  return (result.results ?? []).map(mapMemory)
}

export async function getMemoryById(db: D1Database, memoryId: string): Promise<MemoryRecord> {
  const row = await db
    .prepare(
      `
        SELECT id, event_id, author_id, photo_url, caption, recorded_at
        FROM memories
        WHERE id = ?1
      `,
    )
    .bind(memoryId)
    .first<MemoryRow>()
  if (!row) {
    throw new HttpError(404, 'not_found', `memories 항목을 찾을 수 없습니다: ${memoryId}`)
  }
  return mapMemory(row)
}

export async function createMemory(
  db: D1Database,
  input: MemoryInput,
  photoUrl: string,
  authorId: string,
): Promise<MemoryRecord> {
  const id = randomId('memory')
  await runStatement(
    db,
    `
      INSERT INTO memories (id, event_id, author_id, photo_url, caption, recorded_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6)
    `,
    id,
    input.eventId,
    authorId,
    photoUrl,
    input.caption,
    input.recordedAt,
  )
  return {
    id,
    eventId: input.eventId,
    authorId,
    photoUrl,
    caption: input.caption,
    recordedAt: input.recordedAt,
  }
}

export async function updateMemory(
  db: D1Database,
  memoryId: string,
  input: MemoryInput,
  photoUrl: string,
): Promise<void> {
  await requireExisting(db, 'memories', memoryId)
  await runStatement(
    db,
    `
      UPDATE memories
      SET event_id = ?2,
          photo_url = ?3,
          caption = ?4,
          recorded_at = ?5
      WHERE id = ?1
    `,
    memoryId,
    input.eventId,
    photoUrl,
    input.caption,
    input.recordedAt,
  )
}

export async function deleteMemory(db: D1Database, memoryId: string): Promise<void> {
  await requireExisting(db, 'memories', memoryId)
  await runStatement(db, `DELETE FROM memories WHERE id = ?1`, memoryId)
}

export async function listComments(db: D1Database): Promise<CommentRecord[]> {
  const result = await db
    .prepare(
      `
        SELECT id, memory_id, author_id, content, created_at
        FROM comments
        ORDER BY created_at ASC
      `,
    )
    .all<CommentRow>()
  return (result.results ?? []).map(mapComment)
}

export async function getCommentById(db: D1Database, commentId: string): Promise<CommentRecord> {
  const row = await db
    .prepare(
      `
        SELECT id, memory_id, author_id, content, created_at
        FROM comments
        WHERE id = ?1
      `,
    )
    .bind(commentId)
    .first<CommentRow>()
  if (!row) {
    throw new HttpError(404, 'not_found', `comments 항목을 찾을 수 없습니다: ${commentId}`)
  }
  return mapComment(row)
}

export async function createComment(
  db: D1Database,
  input: CommentInput,
  authorId: string,
): Promise<CommentRecord> {
  const id = randomId('comment')
  const createdAt = new Date().toISOString()
  await runStatement(
    db,
    `
      INSERT INTO comments (id, memory_id, author_id, content, created_at)
      VALUES (?1, ?2, ?3, ?4, ?5)
    `,
    id,
    input.memoryId,
    authorId,
    input.content,
    createdAt,
  )
  return {
    id,
    memoryId: input.memoryId,
    authorId,
    content: input.content,
    createdAt,
  }
}

export async function updateComment(db: D1Database, commentId: string, input: CommentInput): Promise<void> {
  await requireExisting(db, 'comments', commentId)
  await runStatement(
    db,
    `
      UPDATE comments
      SET content = ?2
      WHERE id = ?1
    `,
    commentId,
    input.content,
  )
}

export async function deleteComment(db: D1Database, commentId: string): Promise<void> {
  await requireExisting(db, 'comments', commentId)
  await runStatement(db, `DELETE FROM comments WHERE id = ?1`, commentId)
}
