import { beforeEach, describe, expect, it, vi } from 'vitest'
import { routeRequest } from './router'
import { createAuthHeaders, createSessionRecord, createWorkerEnv, type FakeStore } from './test-support'

describe('worker CRUD routes', () => {
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
          id: 'profile-member',
          auth_user_id: 'kakao:member',
          kakao_nickname: '회원',
          avatar_url: 'https://example.com/member.png',
          approval_status: 'approved',
          role: 'member',
        },
      ],
      events: [],
      memories: [],
      comments: [],
    }
    vi.restoreAllMocks()
    vi.spyOn(globalThis.crypto, 'randomUUID').mockImplementation(
      () => '00000000-0000-0000-0000-000000000000',
    )
  })

  it('creates and reads events through HTTP routes using the session owner', async () => {
    const { env } = createWorkerEnv(store, {
      session: createSessionRecord(store.profiles[1]),
    })

    const createResponse = await routeRequest(
      new Request('https://worker.example.com/api/events', {
        method: 'POST',
        headers: {
          ...createAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: '정기 모임',
          eventAt: '2026-06-20T19:00',
          location: '서울',
          what: '행사',
          how: '투표',
          decisionSummary: '금요일로 확정',
          createdBy: 'forged-profile',
        }),
      }),
      env,
    )
    expect(createResponse.status).toBe(201)

    const listResponse = await routeRequest(
      new Request('https://worker.example.com/api/events', {
        headers: { Origin: 'https://train.example.com' },
      }),
      env,
    )
    const events = (await listResponse.json()) as Array<{ id: string; createdBy: string }>
    expect(events).toEqual([
      expect.objectContaining({
        id: 'event-00000000-0000-0000-0000-000000000000',
        createdBy: 'profile-member',
      }),
    ])
  })

  it('allows admin approval updates and owner comment updates through HTTP routes', async () => {
    const { env } = createWorkerEnv(store, {
      session: createSessionRecord(store.profiles[0]),
    })

    const approvalResponse = await routeRequest(
      new Request('https://worker.example.com/api/profiles/profile-member/approval', {
        method: 'PUT',
        headers: {
          ...createAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approvalStatus: 'rejected' }),
      }),
      env,
    )
    expect(approvalResponse.status).toBe(200)

    store.comments.push({
      id: 'comment-1',
      memory_id: 'memory-1',
      author_id: 'profile-admin',
      content: '초안',
      created_at: '2026-06-20T21:30:00.000Z',
    })

    const commentUpdateResponse = await routeRequest(
      new Request('https://worker.example.com/api/comments/comment-1', {
        method: 'PUT',
        headers: {
          ...createAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memoryId: 'memory-1',
          content: '수정본',
        }),
      }),
      env,
    )
    expect(commentUpdateResponse.status).toBe(200)

    const commentsResponse = await routeRequest(
      new Request('https://worker.example.com/api/comments', {
        headers: { Origin: 'https://train.example.com' },
      }),
      env,
    )
    const comments = (await commentsResponse.json()) as Array<{ content: string }>
    expect(store.profiles[1].approval_status).toBe('rejected')
    expect(comments[0].content).toBe('수정본')
  })
})
