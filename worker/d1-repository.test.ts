/**
 * File: worker/d1-repository.test.ts
 * Purpose: D1 CRUD 저장소와 mapper 경계를 fake D1으로 검증합니다.
 * Primary Responsibility: snake_case 저장 스키마와 camelCase 프론트 계약이 일치하는지 보증하는 것입니다.
 * Design Intent:
 *   - live D1 없이도 CRUD 저장/재조회 경계를 회귀 검증할 수 있도록 in-memory fake를 사용합니다.
 *   - route 테스트보다 더 낮은 레벨에서 mapper와 delete cascade 성격을 확인해 원인 분리를 쉽게 만듭니다.
 * Non-Goals:
 *   - SQL 엔진 동작을 완전 재현하지 않습니다.
 *   - 권한 정책이나 OAuth 세션 검증을 다루지 않습니다.
 * Dependencies: vitest, ./d1-repository, ./types
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ApprovalStatus } from '../src/lib/types'
import {
  createComment,
  createEvent,
  createMemory,
  deleteComment,
  deleteEvent,
  deleteMemory,
  listComments,
  listEvents,
  listMemories,
  listProfiles,
  upsertProfileFromKakaoIdentity,
  updateComment,
  updateEvent,
  updateMemory,
  updateProfileApproval,
} from './d1-repository'
import type { D1Database, D1PreparedStatement } from './types'

interface FakeStore {
  profiles: Array<Record<string, unknown>>
  events: Array<Record<string, unknown>>
  memories: Array<Record<string, unknown>>
  comments: Array<Record<string, unknown>>
}

class FakeStatement implements D1PreparedStatement {
  private bound: unknown[] = []
  private readonly query: string
  private readonly store: FakeStore

  constructor(query: string, store: FakeStore) {
    this.query = query
    this.store = store
  }

  bind(...values: unknown[]): D1PreparedStatement {
    this.bound = values
    return this
  }

  async first<T = Record<string, unknown>>(): Promise<T | null> {
    const id = this.bound[0]
    if (this.query.includes('FROM profiles') && this.query.includes('WHERE auth_user_id')) {
      return (this.store.profiles.find((row) => row.auth_user_id === id) as T) ?? null
    }
    if (this.query.includes("FROM profiles") && this.query.includes("WHERE role = 'admin'")) {
      return (this.store.profiles.find((row) => row.role === 'admin') as T) ?? null
    }
    if (this.query.includes('FROM profiles')) {
      return (this.store.profiles.find((row) => row.id === id) as T) ?? null
    }
    if (this.query.includes('FROM events')) {
      return (this.store.events.find((row) => row.id === id) as T) ?? null
    }
    if (this.query.includes('FROM memories')) {
      return (this.store.memories.find((row) => row.id === id) as T) ?? null
    }
    if (this.query.includes('FROM comments')) {
      return (this.store.comments.find((row) => row.id === id) as T) ?? null
    }
    return null
  }

  async all<T = Record<string, unknown>>(): Promise<{ results: T[] }> {
    if (this.query.includes('FROM profiles')) {
      return { results: this.store.profiles as T[] }
    }
    if (this.query.includes('FROM events')) {
      return { results: this.store.events as T[] }
    }
    if (this.query.includes('FROM memories')) {
      return { results: this.store.memories as T[] }
    }
    if (this.query.includes('FROM comments')) {
      return { results: this.store.comments as T[] }
    }
    return { results: [] }
  }

  async run(): Promise<unknown> {
    if (this.query.includes('INSERT INTO events')) {
      this.store.events.push({
        id: this.bound[0],
        title: this.bound[1],
        event_at: this.bound[2],
        location: this.bound[3],
        what: this.bound[4],
        how: this.bound[5],
        decision_summary: this.bound[6],
        created_by: this.bound[7],
      })
      return undefined
    }
    if (this.query.includes('UPDATE events')) {
      const target = this.store.events.find((row) => row.id === this.bound[0])
      if (target) {
        target.title = this.bound[1]
        target.event_at = this.bound[2]
        target.location = this.bound[3]
        target.what = this.bound[4]
        target.how = this.bound[5]
        target.decision_summary = this.bound[6]
      }
      return undefined
    }
    if (this.query.includes('DELETE FROM events')) {
      const eventId = this.bound[0]
      const deletedMemoryIds = this.store.memories.filter((row) => row.event_id === eventId).map((row) => row.id)
      this.store.events = this.store.events.filter((row) => row.id !== eventId)
      this.store.memories = this.store.memories.filter((row) => row.event_id !== eventId)
      this.store.comments = this.store.comments.filter((row) => !deletedMemoryIds.includes(row.memory_id))
      return undefined
    }
    if (this.query.includes('INSERT INTO memories')) {
      this.store.memories.push({
        id: this.bound[0],
        event_id: this.bound[1],
        author_id: this.bound[2],
        photo_url: this.bound[3],
        caption: this.bound[4],
        recorded_at: this.bound[5],
      })
      return undefined
    }
    if (this.query.includes('UPDATE memories')) {
      const target = this.store.memories.find((row) => row.id === this.bound[0])
      if (target) {
        target.event_id = this.bound[1]
        target.photo_url = this.bound[2]
        target.caption = this.bound[3]
        target.recorded_at = this.bound[4]
      }
      return undefined
    }
    if (this.query.includes('DELETE FROM memories')) {
      const memoryId = this.bound[0]
      this.store.memories = this.store.memories.filter((row) => row.id !== memoryId)
      this.store.comments = this.store.comments.filter((row) => row.memory_id !== memoryId)
      return undefined
    }
    if (this.query.includes('INSERT INTO comments')) {
      this.store.comments.push({
        id: this.bound[0],
        memory_id: this.bound[1],
        author_id: this.bound[2],
        content: this.bound[3],
        created_at: this.bound[4],
      })
      return undefined
    }
    if (this.query.includes('UPDATE comments')) {
      const target = this.store.comments.find((row) => row.id === this.bound[0])
      if (target) {
        target.content = this.bound[1]
      }
      return undefined
    }
    if (this.query.includes('DELETE FROM comments')) {
      const commentId = this.bound[0]
      this.store.comments = this.store.comments.filter((row) => row.id !== commentId)
      return undefined
    }
    if (this.query.includes('UPDATE profiles')) {
      if (this.query.includes('WHERE id = ?1')) {
        const target = this.store.profiles.find((row) => row.id === this.bound[0])
        if (target) {
          target.approval_status = this.bound[1]
        }
      }
      if (this.query.includes('WHERE auth_user_id = ?1')) {
        const target = this.store.profiles.find((row) => row.auth_user_id === this.bound[0])
        if (target) {
          target.kakao_nickname = this.bound[1]
          target.avatar_url = this.bound[2]
          target.approval_status = this.bound[3]
          target.role = this.bound[4]
        }
      }
      return undefined
    }
    if (this.query.includes('INSERT INTO profiles')) {
      this.store.profiles.push({
        id: this.bound[0],
        auth_user_id: this.bound[1],
        kakao_nickname: this.bound[2],
        avatar_url: this.bound[3],
        approval_status: this.bound[4],
        role: this.bound[5],
      })
      return undefined
    }
    return undefined
  }
}

class FakeDatabase implements D1Database {
  readonly store: FakeStore

  constructor(store: FakeStore) {
    this.store = store
  }

  prepare(query: string): D1PreparedStatement {
    return new FakeStatement(query, this.store)
  }
}

describe('d1 repository', () => {
  let db: FakeDatabase

  beforeEach(() => {
    db = new FakeDatabase({
      profiles: [
        {
          id: 'profile-admin',
          auth_user_id: 'kakao-admin',
          kakao_nickname: '운영자',
          avatar_url: 'https://example.com/admin.png',
          approval_status: 'approved' satisfies ApprovalStatus,
          role: 'admin',
        },
      ],
      events: [],
      memories: [],
      comments: [],
    })
    vi.spyOn(globalThis.crypto, 'randomUUID').mockImplementation(
      () => '00000000-0000-0000-0000-000000000000',
    )
  })

  it('maps profiles to camelCase contracts and updates approval state', async () => {
    const profiles = await listProfiles(db)
    expect(profiles[0].authUserId).toBe('kakao-admin')

    await updateProfileApproval(db, 'profile-admin', 'rejected')
    const updated = await listProfiles(db)
    expect(updated[0].approvalStatus).toBe('rejected')
  })

  it('promotes the configured admin identity on first login and on subsequent login', async () => {
    const inserted = await upsertProfileFromKakaoIdentity(
      db,
      {
        authUserId: 'kakao:admin-seed',
        kakaoNickname: '관리자',
        avatarUrl: 'https://example.com/seed.png',
      },
      {
        adminAuthUserId: 'kakao:admin-seed',
      },
    )

    expect(inserted.role).toBe('admin')
    expect(inserted.approvalStatus).toBe('approved')

    const updated = await upsertProfileFromKakaoIdentity(
      db,
      {
        authUserId: 'kakao-admin',
        kakaoNickname: '승격된 관리자',
        avatarUrl: 'https://example.com/promoted.png',
      },
      {
        adminAuthUserId: 'kakao-admin',
      },
    )

    expect(updated.role).toBe('admin')
    expect(updated.approvalStatus).toBe('approved')
    expect(db.store.profiles.find((profile) => profile.id === 'profile-admin')).toEqual(
      expect.objectContaining({
        role: 'admin',
        approval_status: 'approved',
        kakao_nickname: '승격된 관리자',
      }),
    )
  })

  it('bootstraps the first login as admin when no admin seed is configured', async () => {
    const blankDb = new FakeDatabase({
      profiles: [],
      events: [],
      memories: [],
      comments: [],
    })

    const profile = await upsertProfileFromKakaoIdentity(blankDb, {
      authUserId: 'kakao:first-user',
      kakaoNickname: '첫 사용자',
      avatarUrl: 'https://example.com/first.png',
    })

    expect(profile.role).toBe('admin')
    expect(profile.approvalStatus).toBe('approved')
    expect(blankDb.store.profiles[0]).toEqual(
      expect.objectContaining({
        auth_user_id: 'kakao:first-user',
        role: 'admin',
        approval_status: 'approved',
      }),
    )
  })

  it('creates and updates events through D1', async () => {
    const created = await createEvent(
      db,
      {
        title: '정기 모임',
        eventAt: '2026-06-20T19:00',
        location: '서울역',
        what: '식사',
        how: '단톡 투표 확정',
        decisionSummary: '금요일 저녁 모임',
      },
      'profile-admin',
    )
    expect(created.id).toBe('event-00000000-0000-0000-0000-000000000000')

    await updateEvent(db, created.id, {
      ...created,
      eventAt: '2026-06-21T19:00',
      decisionSummary: '일요일로 변경',
    })

    const events = await listEvents(db)
    expect(events).toEqual([
      expect.objectContaining({
        id: 'event-00000000-0000-0000-0000-000000000000',
        eventAt: '2026-06-21T19:00',
        decisionSummary: '일요일로 변경',
      }),
    ])
  })

  it('creates memory and comment records, then cleans descendants on delete', async () => {
    db.store.events.push({
      id: 'event-existing',
      title: '기존 이벤트',
      event_at: '2026-06-20T19:00',
      location: '부산',
      what: '모임',
      how: '합의',
      decision_summary: '기록용',
      created_by: 'profile-admin',
    })

    const memory = await createMemory(
      db,
      {
        eventId: 'event-existing',
        caption: '첫 사진',
        recordedAt: '2026-06-20T21:00',
      },
      'https://example.com/photo.jpg',
      'profile-admin',
    )
    const comment = await createComment(
      db,
      {
        memoryId: memory.id,
        content: '좋은 추억',
      },
      'profile-admin',
    )

    await updateMemory(
      db,
      memory.id,
      {
        eventId: 'event-existing',
        caption: '수정된 사진',
        recordedAt: '2026-06-20T22:00',
      },
      'https://example.com/photo-2.jpg',
    )
    await updateComment(db, comment.id, { memoryId: memory.id, content: '수정된 코멘트' })

    expect((await listMemories(db))[0]).toEqual(
      expect.objectContaining({
        photoUrl: 'https://example.com/photo-2.jpg',
        caption: '수정된 사진',
      }),
    )
    expect((await listComments(db))[0].content).toBe('수정된 코멘트')

    await deleteMemory(db, memory.id)
    expect(await listMemories(db)).toEqual([])
    expect(await listComments(db)).toEqual([])
  })

  it('deletes event descendants and supports direct comment deletion', async () => {
    db.store.events.push({
      id: 'event-existing',
      title: '기존 이벤트',
      event_at: '2026-06-20T19:00',
      location: '부산',
      what: '모임',
      how: '합의',
      decision_summary: '기록용',
      created_by: 'profile-admin',
    })
    db.store.memories.push({
      id: 'memory-existing',
      event_id: 'event-existing',
      author_id: 'profile-admin',
      photo_url: 'https://example.com/photo.jpg',
      caption: '사진',
      recorded_at: '2026-06-20T21:00',
    })
    db.store.comments.push({
      id: 'comment-existing',
      memory_id: 'memory-existing',
      author_id: 'profile-admin',
      content: '댓글',
      created_at: '2026-06-20T21:30:00.000Z',
    })

    await createComment(
      db,
      {
        memoryId: 'memory-existing',
        content: '지울 댓글',
      },
      'profile-admin',
    )
    await deleteComment(db, 'comment-00000000-0000-0000-0000-000000000000')
    expect(await listComments(db)).toEqual([
      expect.objectContaining({ id: 'comment-existing' }),
    ])

    await deleteEvent(db, 'event-existing')
    expect(await listEvents(db)).toEqual([])
    expect(await listMemories(db)).toEqual([])
    expect(await listComments(db)).toEqual([])
  })
})
