import { describe, expect, it, vi } from 'vitest'
import { routeRequest } from './router'
import { createAuthHeaders, createSessionRecord, createWorkerEnv, type FakeStore } from './test-support'

function createStore(approvalStatus: 'approved' | 'pending' = 'approved'): FakeStore {
  return {
    profiles: [
      {
        id: 'profile-member',
        auth_user_id: 'kakao:321',
        kakao_nickname: 'approved-member',
        avatar_url: 'https://example.com/avatar.png',
        approval_status: approvalStatus,
        role: 'member',
      },
    ],
    events: [],
    memories: [],
    comments: [],
  }
}

describe('worker Kakao notification relay', () => {
  it('relays Kakao memo API for approved users with a stored session token', async () => {
    const store = createStore('approved')
    const session = createSessionRecord(store.profiles[0], {
      id: 'session-relay',
      kakaoAccessToken: 'kakao-access-token',
    })
    const { env } = createWorkerEnv(store, { session })
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ result_code: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const response = await routeRequest(
      new Request('https://api.example.com/api/notifications/kakao-event', {
        method: 'POST',
        headers: {
          ...createAuthHeaders('session-relay'),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: '[memory-train] new event posted',
          buttonTitle: 'Open event',
          buttonUrl: 'https://train.example.com/events/event-1',
        }),
      }),
      env,
    )

    expect(response.status).toBe(202)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://kapi.kakao.com/v2/api/talk/memo/default/send',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer kakao-access-token',
        }),
      }),
    )
  })

  it('rejects relay calls from pending users', async () => {
    const store = createStore('pending')
    const session = createSessionRecord(store.profiles[0], {
      id: 'session-pending',
      kakaoAccessToken: 'kakao-access-token',
    })
    const { env } = createWorkerEnv(store, { session })

    const response = await routeRequest(
      new Request('https://api.example.com/api/notifications/kakao-event', {
        method: 'POST',
        headers: {
          ...createAuthHeaders('session-pending'),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: '[memory-train] new event posted',
          buttonTitle: 'Open event',
          buttonUrl: 'https://train.example.com/events/event-1',
        }),
      }),
      env,
    )
    const body = (await response.json()) as { error: { code: string } }

    expect(response.status).toBe(403)
    expect(body.error.code).toBe('approval_required')
  })
})
