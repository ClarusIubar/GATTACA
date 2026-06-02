export interface KakaoTemplateParams {
  text: string
  buttonTitle: string
  buttonUrl: string
}

export type KakaoDeliveryTarget =
  | { mode: 'mock' }
  | { mode: 'worker-relay'; apiUrl: string }

export function validateKakaoTemplate(params: KakaoTemplateParams): string | null {
  if (!params.text.trim()) {
    return '메시지 본문은 필수입니다.'
  }
  if (!params.buttonTitle.trim()) {
    return '버튼 제목은 필수입니다.'
  }
  if (!params.buttonUrl.startsWith('http://') && !params.buttonUrl.startsWith('https://')) {
    return '버튼 URL 형식이 올바르지 않습니다.'
  }
  return null
}

export async function sendKakaoMessage(
  params: KakaoTemplateParams,
  target: KakaoDeliveryTarget,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const validationError = validateKakaoTemplate(params)
  if (validationError) {
    return { success: false, error: validationError }
  }

  if (target.mode === 'mock') {
    return { success: true, messageId: `mock-msg-${Date.now()}` }
  }

  try {
    const response = await fetch(`${target.apiUrl}/api/notifications/kakao-event`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { success: false, error: `카카오 알림 relay 오류: ${errorText}` }
    }

    return { success: true, messageId: `relay-msg-${Date.now()}` }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 알림 전송 실패',
    }
  }
}
