/**
 * File: src/lib/notification.ts
 * Purpose: 모임 일정 확정 시 카카오 알림톡/메시지를 백엔드(Worker) 중계를 통해 자동 발송하는 클라이언트 서비스 모듈입니다.
 * Primary Responsibility: 카카오 메시지 전송 파라미터 유효성 검증 및 REST API 송신 처리를 담당합니다.
 * Design Intent: 
 *   - 카카오 메시지 템플릿(텍스트 및 링크 버튼 구조)의 파라미터를 전송 전 가드 검증합니다.
 *   - 목킹 모드를 지원하여 라이브 통신 장애나 API 토큰 결여 시 유연한 단위 테스트 Seam을 제공하며, 토큰 결여 시 즉시 전송을 비활성화(fail-closed)시킵니다.
 */

export interface KakaoTemplateParams {
  text: string
  buttonTitle: string
  buttonUrl: string
}

export function validateKakaoTemplate(params: KakaoTemplateParams): string | null {
  if (!params.text.trim()) {
    return '메시지 텍스트는 필수입니다.'
  }
  if (!params.buttonTitle.trim()) {
    return '버튼 타이틀은 필수입니다.'
  }
  if (!params.buttonUrl.startsWith('http://') && !params.buttonUrl.startsWith('https://')) {
    return '올바른 버튼 웹 URL 형식이 아닙니다.'
  }
  return null
}

export async function sendKakaoMessage(
  params: KakaoTemplateParams,
  apiToken: string | null,
  isMockMode = true
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const validationError = validateKakaoTemplate(params)
  if (validationError) {
    return { success: false, error: validationError }
  }

  // 필수 토큰 결여 시 기능을 즉시 비활성화(fail-closed)
  if (!apiToken && !isMockMode) {
    return { success: false, error: '카카오 API Access Token이 없습니다.' }
  }

  if (isMockMode) {
    // 목킹 환경 시뮬레이션 성공 결과 반환
    return { success: true, messageId: `mock-msg-${Date.now()}` }
  }

  try {
    const response = await fetch('https://api.kakaotalk.com/v2/api/talk/memo/default/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${apiToken}`,
      },
      body: new URLSearchParams({
        template_object: JSON.stringify({
          object_type: 'text',
          text: params.text,
          link: {
            web_url: params.buttonUrl,
            mobile_web_url: params.buttonUrl,
          },
          button_title: params.buttonTitle,
        }),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { success: false, error: `카카오 API 에러: ${errorText}` }
    }

    return { success: true, messageId: `kakao-${Date.now()}` }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 전송 실패',
    }
  }
}
