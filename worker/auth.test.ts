import { beforeEach, describe, expect, it, vi } from 'vitest'
import { routeRequest } from './router'
import { createWorkerEnv, type FakeStore } from './test-support'

describe('worker auth/session routes', () => {
  let store: FakeStore

  beforeEach(() => {
    store = {
      profiles: [],
      events: [],
      memories: [],
      comments: [],
    }
    vi.restoreAllMocks()
    vi.spyOn(globalThis.crypto, 'randomUUID').mockImplementation(
      () => '00000000-0000-0000-0000-000000000000',
    )
  })

  it('redirects to Kakao authorize URL with callback state', async () => {
    const { env } = createWorkerEnv(store)
    const response = await routeRequest(
      new Request('https://api.example.com/api/auth/kakao?redirect_uri=https%3A%2F%2Ftrain.example.com'),
      env,
    )

    expect(response.status).toBe(302)
    const location = response.headers.get('Location')
    expect(location).toContain('https://kauth.kakao.com/oauth/authorize')
    expect(location).toContain('client_id=kakao-rest-key')
    expect(location).toContain(encodeURIComponent('https://api.example.com/api/auth/callback'))
  })

  it('creates session on callback, then restores and clears it', async () => {
    const { env, kv } = createWorkerEnv(store)
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'token-123' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 321,
            properties: {
              nickname: '카카오사용자',
              profile_image: 'https://example.com/avatar.png',
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )

    const authorizeResponse = await routeRequest(
      new Request(
        'https://api.example.com/api/auth/callback?code=auth-code&state=eyJyZWRpcmVjdFRvIjoiaHR0cHM6Ly90cmFpbi5leGFtcGxlLmNvbSJ9',
      ),
      env,
    )

    expect(authorizeResponse.status).toBe(302)
    expect(authorizeResponse.headers.get('Location')).toBe('https://train.example.com')
    const cookie = authorizeResponse.headers.get('Set-Cookie') ?? ''
    expect(cookie).toContain('gattaca_session=')
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(store.profiles[0]).toEqual(
      expect.objectContaining({
        auth_user_id: 'kakao:321',
        kakao_nickname: '카카오사용자',
      }),
    )
    expect(kv.store.size).toBe(1)
    const storedSession = JSON.parse([...kv.store.values()][0] as string) as { kakaoAccessToken: string }
    expect(storedSession.kakaoAccessToken).toBe('token-123')

    const sessionResponse = await routeRequest(
      new Request('https://api.example.com/api/session', {
        headers: {
          Origin: 'https://train.example.com',
          Cookie: cookie.split(';')[0],
        },
      }),
      env,
    )
    const sessionBody = (await sessionResponse.json()) as {
      authenticated: boolean
      session: { profile: { authUserId: string; kakaoNickname: string } }
    }
    expect(sessionResponse.status).toBe(200)
    expect(sessionBody.authenticated).toBe(true)
    expect(sessionBody.session.profile.authUserId).toBe('kakao:321')
    expect(sessionBody.session.profile.kakaoNickname).toBe('카카오사용자')

    const logoutResponse = await routeRequest(
      new Request('https://api.example.com/api/auth/logout', {
        method: 'POST',
        headers: {
          Origin: 'https://train.example.com',
          Cookie: cookie.split(';')[0],
        },
      }),
      env,
    )
    expect(logoutResponse.status).toBe(200)
    expect(logoutResponse.headers.get('Set-Cookie')).toContain('Max-Age=0')
    expect(kv.store.size).toBe(0)
  })
})
