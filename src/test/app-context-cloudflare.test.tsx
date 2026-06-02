import { act, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const sendKakaoMessageMock = vi.fn()

vi.mock('../lib/env', () => ({
  appEnv: {
    adminUserId: 'profile-admin',
    cloudflareApiUrl: 'https://api.example.com',
    enableDemoMode: '',
  },
  isCloudflareConfigured: true,
  isDemoModeEnabled: false,
}))

vi.mock('../lib/notification', () => ({
  sendKakaoMessage: (...args: unknown[]) => sendKakaoMessageMock(...args),
}))

import { AppProvider, useAppContext } from '../lib/app-context'

function CloudflareConsumer({
  onLoad,
}: {
  onLoad?: (value: ReturnType<typeof useAppContext>) => void
}) {
  const context = useAppContext()
  onLoad?.(context)

  return (
    <div>
      <span data-testid="nickname">{context.currentUser?.kakaoNickname ?? '비로그인'}</span>
      <span data-testid="approved">{String(context.isApproved)}</span>
    </div>
  )
}

describe('AppProvider Cloudflare session bootstrap', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    sendKakaoMessageMock.mockReset()
  })

  it('restores currentUser from /api/session instead of auto-selecting a profile', async () => {
    let contextValue: ReturnType<typeof useAppContext> | null = null
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url

      if (url === 'https://api.example.com/api/session') {
        return new Response(
          JSON.stringify({
            authenticated: true,
            session: {
              profile: {
                profileId: 'profile-member',
                authUserId: 'kakao:123',
                role: 'member',
                approvalStatus: 'approved',
                kakaoNickname: '세션회원',
                avatarUrl: 'https://example.com/member.png',
              },
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }

      if (url === 'https://api.example.com/api/runtime-status') {
        return new Response(
          JSON.stringify({
            ok: true,
            service: 'gattaca-backend',
            timestamp: '2026-06-02T00:00:00.000Z',
            bindings: { db: true, session: true, bucket: true },
            auth: {
              kakaoRestApiKeyConfigured: true,
              kakaoClientSecretConfigured: true,
              kakaoOAuthConfigured: true,
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }

      if (url === 'https://api.example.com/api/profiles') {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      if (
        url === 'https://api.example.com/api/events' ||
        url === 'https://api.example.com/api/memories' ||
        url === 'https://api.example.com/api/comments'
      ) {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      if (url === 'https://api.example.com/api/auth/logout') {
        expect(init?.credentials).toBe('include')
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      throw new Error(`unexpected fetch: ${url}`)
    })

    render(
      <AppProvider>
        <CloudflareConsumer onLoad={(ctx) => (contextValue = ctx)} />
      </AppProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('nickname').textContent).toBe('세션회원')
    })
    expect(screen.getByTestId('approved').textContent).toBe('true')
    expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/api/session', { credentials: 'include' })

    await act(async () => {
      await contextValue?.signOut()
    })

    expect(screen.getByTestId('nickname').textContent).toBe('비로그인')
  })

  it('creates events without automatically sending Kakao relay in cloudflare runtime', async () => {
    let contextValue: ReturnType<typeof useAppContext> | null = null
    sendKakaoMessageMock.mockRejectedValue(new Error('relay must not be called from createEvent'))
    const eventPostSpy = vi.fn()

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url
      const method = init?.method ?? 'GET'

      if (url === 'https://api.example.com/api/session') {
        return new Response(
          JSON.stringify({
            authenticated: true,
            session: {
              profile: {
                profileId: 'profile-member',
                authUserId: 'kakao:123',
                role: 'member',
                approvalStatus: 'approved',
                kakaoNickname: '세션회원',
                avatarUrl: 'https://example.com/member.png',
              },
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }

      if (url === 'https://api.example.com/api/runtime-status') {
        return new Response(
          JSON.stringify({
            ok: true,
            service: 'gattaca-backend',
            timestamp: '2026-06-02T00:00:00.000Z',
            bindings: { db: true, session: true, bucket: true },
            auth: {
              kakaoRestApiKeyConfigured: true,
              kakaoClientSecretConfigured: true,
              kakaoOAuthConfigured: true,
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }

      if (url === 'https://api.example.com/api/profiles') {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      if (url === 'https://api.example.com/api/events' && method === 'GET') {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      if (url === 'https://api.example.com/api/events' && method === 'POST') {
        eventPostSpy()
        return new Response(
          JSON.stringify({
            ok: true,
            event: {
              id: 'event-123',
              title: '새 일정',
              eventAt: '2026-06-20T19:00',
              location: '서울',
              what: '모임',
              how: '합의',
              decisionSummary: '결정 완료',
              createdBy: 'profile-member',
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }

      if (url === 'https://api.example.com/api/memories' || url === 'https://api.example.com/api/comments') {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      throw new Error(`unexpected fetch: ${url}`)
    })

    render(
      <AppProvider>
        <CloudflareConsumer onLoad={(ctx) => (contextValue = ctx)} />
      </AppProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('nickname').textContent).toBe('세션회원')
    })

    await act(async () => {
      await contextValue?.createEvent({
        title: '새 일정',
        eventAt: '2026-06-20T19:00',
        location: '서울',
        what: '모임',
        how: '합의',
        decisionSummary: '결정 완료',
      })
    })

    expect(eventPostSpy).toHaveBeenCalledTimes(1)
    expect(sendKakaoMessageMock).not.toHaveBeenCalled()
  })
})
