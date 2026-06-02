import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sendKakaoMessage, validateKakaoTemplate } from '../lib/notification'

describe('notification helpers', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('validates Kakao template parameters', () => {
    const validParams = {
      text: '새 일정이 등록되었습니다.',
      buttonTitle: '보러가기',
      buttonUrl: 'https://example.com/timeline',
    }

    expect(validateKakaoTemplate(validParams)).toBeNull()
    expect(validateKakaoTemplate({ ...validParams, text: ' ' })).toBe('메시지 본문은 필수입니다.')
    expect(validateKakaoTemplate({ ...validParams, buttonTitle: '' })).toBe('버튼 제목은 필수입니다.')
    expect(validateKakaoTemplate({ ...validParams, buttonUrl: 'invalid-url' })).toBe(
      '버튼 URL 형식이 올바르지 않습니다.',
    )
  })

  it('returns mock success without a network request', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    const result = await sendKakaoMessage(
      {
        text: '모임 안내',
        buttonTitle: '이동',
        buttonUrl: 'https://test.com',
      },
      { mode: 'mock' },
    )

    expect(result.success).toBe(true)
    expect(result.messageId).toContain('mock-msg-')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('calls the worker relay in live mode', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', mockFetch)

    const result = await sendKakaoMessage(
      {
        text: '라이브 모임 안내',
        buttonTitle: '보러가기',
        buttonUrl: 'https://live-test.com',
      },
      { mode: 'worker-relay', apiUrl: 'https://api.example.com' },
    )

    expect(result.success).toBe(true)
    expect(result.messageId).toContain('relay-msg-')
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/api/notifications/kakao-event',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      }),
    )
  })
})
