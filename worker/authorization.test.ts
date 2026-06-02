import { beforeEach, describe, expect, it, vi } from 'vitest'
import { routeRequest } from './router'
import { createAuthHeaders, createSessionRecord, createWorkerEnv, type FakeStore } from './test-support'

describe('worker authorization enforcement', () => {
  let store: FakeStore

  beforeEach(() => {
    store = {
      profiles: [
        {
          id: 'profile-admin',
          auth_user_id: 'kakao:admin',
          kakao_nickname: '운영자',
          avatar_url: 'https://example.com/admin.png',
          approval_status: 'approved',
          role: 'admin',
        },
        {
          id: 'profile-owner',
          auth_user_id: 'kakao:owner',
          kakao_nickname: '작성자',
          avatar_url: 'https://example.com/owner.png',
          approval_status: 'approved',
          role: 'member',
        },
        {
          id: 'profile-other',
          auth_user_id: 'kakao:other',
          kakao_nickname: '다른회원',
          avatar_url: 'https://example.com/other.png',
          approval_status: 'approved',
          role: 'member',
        },
        {
          id: 'profile-pending',
          auth_user_id: 'kakao:pending',
          kakao_nickname: '대기회원',
          avatar_url: 'https://example.com/pending.png',
          approval_status: 'pending',
          role: 'member',
        },
      ],
      events: [
        {
          id: 'event-1',
          title: '원본 이벤트',
          event_at: '2026-06-20T19:00',
          location: '서울',
          what: '모임',
          how: '합의',
          decision_summary: '원안',
          created_by: 'profile-owner',
        },
      ],
      memories: [
        {
          id: 'memory-1',
          event_id: 'event-1',
          author_id: 'profile-owner',
          photo_url: 'https://example.com/photo.png',
          caption: '첫 기록',
          recorded_at: '2026-06-20T22:00',
        },
      ],
      comments: [
        {
          id: 'comment-1',
          memory_id: 'memory-1',
          author_id: 'profile-owner',
          content: '첫 코멘트',
          created_at: '2026-06-20T22:10:00.000Z',
        },
      ],
    }

    vi.restoreAllMocks()
  })

  it('rejects unauthenticated create requests', async () => {
    const { env } = createWorkerEnv(store)
    const response = await routeRequest(
      new Request('https://worker.example.com/api/events', {
        method: 'POST',
        headers: {
          Origin: 'https://train.example.com',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: '새 이벤트',
          eventAt: '2026-06-21T19:00',
          location: '부산',
          what: '모임',
          how: '투표',
          decisionSummary: '새안',
        }),
      }),
      env,
    )

    expect(response.status).toBe(401)
    expect((await response.json()) as { error: { code: string } }).toEqual(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'authentication_required' }),
      }),
    )
  })

  it('rejects pending users from create and update routes', async () => {
    const { env } = createWorkerEnv(store, {
      session: createSessionRecord(store.profiles[3]),
    })

    const createResponse = await routeRequest(
      new Request('https://worker.example.com/api/comments', {
        method: 'POST',
        headers: {
          ...createAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memoryId: 'memory-1',
          content: '대기 코멘트',
        }),
      }),
      env,
    )
    expect(createResponse.status).toBe(403)
    expect((await createResponse.json()) as { error: { code: string } }).toEqual(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'approval_required' }),
      }),
    )

    const updateResponse = await routeRequest(
      new Request('https://worker.example.com/api/events/event-1', {
        method: 'PUT',
        headers: {
          ...createAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: '변경 시도',
          eventAt: '2026-06-20T19:00',
          location: '서울',
          what: '모임',
          how: '합의',
          decisionSummary: '변경안',
        }),
      }),
      env,
    )
    expect(updateResponse.status).toBe(403)
  })

  it('allows approved owners but rejects approved non-owners on update', async () => {
    const ownerEnv = createWorkerEnv(store, {
      session: createSessionRecord(store.profiles[1]),
    }).env

    const ownerUpdate = await routeRequest(
      new Request('https://worker.example.com/api/events/event-1', {
        method: 'PUT',
        headers: {
          ...createAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: '작성자 수정',
          eventAt: '2026-06-20T19:00',
          location: '서울',
          what: '모임',
          how: '합의',
          decisionSummary: '수정안',
        }),
      }),
      ownerEnv,
    )
    expect(ownerUpdate.status).toBe(200)
    expect(store.events[0].title).toBe('작성자 수정')

    const otherEnv = createWorkerEnv(store, {
      session: createSessionRecord(store.profiles[2]),
    }).env

    const otherUpdate = await routeRequest(
      new Request('https://worker.example.com/api/comments/comment-1', {
        method: 'PUT',
        headers: {
          ...createAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memoryId: 'memory-1',
          content: '타인 수정',
        }),
      }),
      otherEnv,
    )
    expect(otherUpdate.status).toBe(403)
    expect((await otherUpdate.json()) as { error: { code: string } }).toEqual(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'resource_owner_required' }),
      }),
    )
  })

  it('rejects non-admin delete and approval changes but allows admin', async () => {
    const memberEnv = createWorkerEnv(store, {
      session: createSessionRecord(store.profiles[1]),
    }).env

    const memberDelete = await routeRequest(
      new Request('https://worker.example.com/api/events/event-1', {
        method: 'DELETE',
        headers: createAuthHeaders(),
      }),
      memberEnv,
    )
    expect(memberDelete.status).toBe(403)

    const memberApproval = await routeRequest(
      new Request('https://worker.example.com/api/profiles/profile-pending/approval', {
        method: 'PUT',
        headers: {
          ...createAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approvalStatus: 'approved' }),
      }),
      memberEnv,
    )
    expect(memberApproval.status).toBe(403)
    expect((await memberApproval.json()) as { error: { code: string } }).toEqual(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'admin_required' }),
      }),
    )

    const adminEnv = createWorkerEnv(store, {
      session: createSessionRecord(store.profiles[0]),
    }).env

    const adminDelete = await routeRequest(
      new Request('https://worker.example.com/api/events/event-1', {
        method: 'DELETE',
        headers: createAuthHeaders(),
      }),
      adminEnv,
    )
    expect(adminDelete.status).toBe(200)

    const adminApproval = await routeRequest(
      new Request('https://worker.example.com/api/profiles/profile-pending/approval', {
        method: 'PUT',
        headers: {
          ...createAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approvalStatus: 'approved' }),
      }),
      adminEnv,
    )
    expect(adminApproval.status).toBe(200)
    expect(store.profiles[3].approval_status).toBe('approved')
  })
})
