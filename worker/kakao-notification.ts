import { HttpError } from './http'

export interface KakaoNotificationTemplate {
  text: string
  buttonTitle: string
  buttonUrl: string
}

function isHttpUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://')
}

export function assertValidKakaoTemplate(template: KakaoNotificationTemplate): void {
  if (!template.text.trim()) {
    throw new HttpError(400, 'kakao_text_required', '카카오 알림 본문이 비어 있습니다.')
  }
  if (!template.buttonTitle.trim()) {
    throw new HttpError(400, 'kakao_button_title_required', '카카오 알림 버튼 제목이 비어 있습니다.')
  }
  if (!isHttpUrl(template.buttonUrl.trim())) {
    throw new HttpError(400, 'kakao_button_url_invalid', '카카오 알림 버튼 URL 형식이 올바르지 않습니다.')
  }
}

export async function sendKakaoMemoMessage(
  accessToken: string,
  template: KakaoNotificationTemplate,
  fetchImpl: typeof fetch,
): Promise<void> {
  if (!accessToken.trim()) {
    throw new HttpError(412, 'kakao_access_token_missing', '카카오 access token이 없어 알림을 보낼 수 없습니다.')
  }

  const response = await fetchImpl('https://kapi.kakao.com/v2/api/talk/memo/default/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      Authorization: `Bearer ${accessToken}`,
    },
    body: new URLSearchParams({
      template_object: JSON.stringify({
        object_type: 'text',
        text: template.text,
        link: {
          web_url: template.buttonUrl,
          mobile_web_url: template.buttonUrl,
        },
        button_title: template.buttonTitle,
      }),
    }).toString(),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new HttpError(
      502,
      'kakao_message_send_failed',
      `카카오 알림 전송이 실패했습니다. ${errorText}`.trim(),
    )
  }
}
