import { describe, expect, it } from 'vitest'
import { routeRequest } from './router'
import { createSessionRecord, createWorkerEnv, type FakeStore } from './test-support'

function createStore(): FakeStore {
  return {
    profiles: [
      {
        id: 'profile-admin',
        auth_user_id: 'kakao-1',
        kakao_nickname: '운영자',
        avatar_url: 'https://example.com/avatar.png',
        approval_status: 'approved',
        role: 'admin',
      },
    ],
    events: [],
    memories: [],
    comments: [],
  }
}

describe('worker foundation routing', () => {
  it('returns health payload with binding status', async () => {
    const { env } = createWorkerEnv(createStore())
    const request = new Request('https://worker.example.com/api/health', {
      headers: { Origin: 'http://localhost:5173' },
    })

    const response = await routeRequest(request, env)
    const body = (await response.json()) as {
      ok: boolean
      bindings: { db: boolean; session: boolean; bucket: boolean }
    }

    expect(response.status).toBe(200)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173')
    expect(body.ok).toBe(true)
    expect(body.bindings).toEqual({ db: true, session: true, bucket: true })
  })

  it('returns anonymous session when cookie is missing', async () => {
    const { env } = createWorkerEnv(createStore())
    const request = new Request('https://worker.example.com/api/session', {
      headers: { Origin: 'http://localhost:5173' },
    })

    const response = await routeRequest(request, env)
    const body = (await response.json()) as { ok: boolean; authenticated: boolean; session: null }

    expect(response.status).toBe(200)
    expect(body).toEqual({
      ok: true,
      authenticated: false,
      session: null,
    })
  })

  it('returns public runtime status including Kakao auth readiness', async () => {
    const { env } = createWorkerEnv(createStore(), {
      kakaoRestApiKey: '',
      kakaoClientSecret: '',
    })
    const request = new Request('https://worker.example.com/api/runtime-status', {
      headers: { Origin: 'http://localhost:5173' },
    })

    const response = await routeRequest(request, env)
    const body = (await response.json()) as {
      ok: boolean
      auth: {
        kakaoRestApiKeyConfigured: boolean
        kakaoClientSecretConfigured: boolean
        kakaoOAuthConfigured: boolean
      }
      bindings: { db: boolean; session: boolean; bucket: boolean }
    }

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.bindings).toEqual({ db: true, session: true, bucket: true })
    expect(body.auth.kakaoRestApiKeyConfigured).toBe(false)
    expect(body.auth.kakaoClientSecretConfigured).toBe(false)
    expect(body.auth.kakaoOAuthConfigured).toBe(false)
  })

  it('returns session payload when KV record exists', async () => {
    const store = createStore()
    const { env } = createWorkerEnv(store, {
      session: createSessionRecord(store.profiles[0], {
        id: 'session-123',
      }),
    })
    const request = new Request('https://worker.example.com/api/session', {
      headers: {
        Origin: 'http://localhost:5173',
        Cookie: 'gattaca_session=session-123',
      },
    })

    const response = await routeRequest(request, env)
    const body = (await response.json()) as { authenticated: boolean; session: { id: string } }

    expect(response.status).toBe(200)
    expect(body.authenticated).toBe(true)
    expect(body.session.id).toBe('session-123')
  })

  it('handles CORS preflight for api routes', async () => {
    const { env } = createWorkerEnv(createStore())
    const request = new Request('https://worker.example.com/api/health', {
      method: 'OPTIONS',
      headers: { Origin: 'http://localhost:5173' },
    })

    const response = await routeRequest(request, env)

    expect(response.status).toBe(204)
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET')
  })

  it('returns JSON 404 for unknown api routes', async () => {
    const { env } = createWorkerEnv(createStore())
    const request = new Request('https://worker.example.com/api/unknown', {
      headers: { Origin: 'http://localhost:5173' },
    })

    const response = await routeRequest(request, env)
    const body = (await response.json()) as { ok: boolean; error: { code: string } }

    expect(response.status).toBe(404)
    expect(body.ok).toBe(false)
    expect(body.error.code).toBe('route_not_found')
  })
})
