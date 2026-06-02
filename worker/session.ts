/**
 * File: worker/session.ts
 * Purpose: Worker foundation 범위에서 읽기 전용 세션 조회 로직을 제공합니다.
 * Primary Responsibility: 쿠키에 담긴 세션 식별자를 읽고 KV 조회 결과를 정규화하는 것입니다.
 * Design Intent:
 *   - 세션 읽기 로직을 cookie/KV 저장 메커니즘과 함께 재사용 가능하게 유지합니다.
 *   - 세션 조회 실패를 안전하게 `null`로 수렴시켜 핸들러를 단순화합니다.
 * Non-Goals:
 *   - OAuth code 교환 자체는 처리하지 않습니다.
 * Dependencies: ./types
 */

import type { SessionRecord, WorkerEnv } from './types'

const SESSION_COOKIE_NAME = 'gattaca_session'

/**
 * 공개 API: 요청 쿠키에서 세션 ID를 추출합니다.
 * 왜 존재하는가: 세션 read-only endpoint가 credential cookie를 해석해야 하기 때문입니다.
 * 매개변수:
 * - `request`: 현재 HTTP 요청
 * 반환값: 세션 ID 문자열 또는 `null`
 * 에러 동작: 없습니다.
 * 제약: 동일 이름 쿠키가 여러 개면 첫 번째 값을 사용합니다.
 */
export function readSessionIdFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('Cookie')
  if (!cookieHeader) {
    return null
  }

  for (const part of cookieHeader.split(';')) {
    const [name, ...valueParts] = part.trim().split('=')
    if (name === SESSION_COOKIE_NAME) {
      const value = valueParts.join('=').trim()
      return value ? decodeURIComponent(value) : null
    }
  }

  return null
}

/**
 * 공개 API: KV에 저장된 세션 레코드를 조회합니다.
 * 왜 존재하는가: foundation 단계에서 `/api/session`이 미래 OAuth 구현과 동일한 저장소 경계를 사용해야 하기 때문입니다.
 * 매개변수:
 * - `env`: Worker runtime bindings
 * - `sessionId`: 조회할 세션 ID
 * 반환값: 유효한 `SessionRecord` 또는 `null`
 * 에러 동작: KV 오류나 잘못된 형태는 `null`로 수렴합니다.
 * 제약: 세션 만료 계산은 문자열 비교 가능한 ISO timestamp를 전제로 합니다.
 */
export async function loadSession(env: WorkerEnv, sessionId: string | null): Promise<SessionRecord | null> {
  if (!sessionId) {
    return null
  }

  try {
    const payload = await env.SESSION.get(`session:${sessionId}`, 'json')
    if (!payload || typeof payload !== 'object') {
      return null
    }

    const record = payload as Partial<SessionRecord>
    if (
      typeof record.id !== 'string' ||
      typeof record.issuedAt !== 'string' ||
      typeof record.expiresAt !== 'string' ||
      typeof record.profile !== 'object' ||
      !record.profile
    ) {
      return null
    }

    if (Date.parse(record.expiresAt) <= Date.now()) {
      return null
    }

    return record as SessionRecord
  } catch {
    return null
  }
}
