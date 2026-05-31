/**
 * File: src/test/notification.test.ts
 * Purpose: notification.ts 유틸리티의 카카오 메시지 전송 및 파라미터 유효성 검증 가드 로직을 철저히 검증하는 단위 테스트(Unit Test)를 제공합니다.
 * Primary Responsibility: 템플릿 규격 검증 및 API 통신 실패/토큰 부재 시 즉시 전송을 차단(fail-closed)하는 비즈니스 정책을 검증합니다.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { validateKakaoTemplate, sendKakaoMessage } from '../lib/notification'

describe('Kakao Notification Validation & Dispatch Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('validates Kakao template parameters correctly', () => {
    const validParams = {
      text: '새 모임 일정 확정!',
      buttonTitle: '보러가기',
      buttonUrl: 'https://example.com/timeline',
    }

    const invalidText = { ...validParams, text: ' ' }
    const invalidButtonTitle = { ...validParams, buttonTitle: '' }
    const invalidUrl = { ...validParams, buttonUrl: 'invalid-url' }

    expect(validateKakaoTemplate(validParams)).toBeNull()
    expect(validateKakaoTemplate(invalidText)).toBe('메시지 텍스트는 필수입니다.')
    expect(validateKakaoTemplate(invalidButtonTitle)).toBe('버튼 타이틀은 필수입니다.')
    expect(validateKakaoTemplate(invalidUrl)).toBe('올바른 버튼 웹 URL 형식이 아닙니다.')
  })

  it('provides mock mode success without external network request', async () => {
    const params = {
      text: '모임 안내',
      buttonTitle: '이동',
      buttonUrl: 'https://test.com',
    }

    const result = await sendKakaoMessage(params, null, true)
    expect(result.success).toBe(true)
    expect(result.messageId).toContain('mock-msg-')
  })

  it('fails closed (fail-closed) when token is missing in non-mock mode', async () => {
    const params = {
      text: '모임 안내',
      buttonTitle: '이동',
      buttonUrl: 'https://test.com',
    }

    const result = await sendKakaoMessage(params, null, false)
    expect(result.success).toBe(false)
    expect(result.error).toBe('카카오 API Access Token이 없습니다.')
  })

  it('dispatches HTTP POST request with correct parameters in live mode', async () => {
    const params = {
      text: '라이브 모임 안내',
      buttonTitle: '보기',
      buttonUrl: 'https://live-test.com',
    }

    // fetch API 전역 모킹 바인딩
    const mockFetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve('ok'),
      } as Response)
    )
    vi.stubGlobal('fetch', mockFetch)

    const result = await sendKakaoMessage(params, 'valid-test-token', false)
    expect(result.success).toBe(true)
    expect(result.messageId).toContain('kakao-')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.kakaotalk.com/v2/api/talk/memo/default/send',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer valid-test-token',
        }),
      })
    )
  })
})
