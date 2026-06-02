/**
 * File: worker/auth.ts
 * Purpose: Kakao OAuth authorize/callback에 필요한 URL 생성과 토큰/프로필 교환 helper를 제공한다.
 * Primary Responsibility: Worker auth handler가 Kakao provider 의존성을 직접 품지 않도록 분리한다.
 * Design Intent:
 *   - route layer는 HTTP 계약에 집중하고, OAuth provider 호출은 별도 helper에 맡긴다.
 *   - 테스트에서는 fetch mocking만으로 authorize/callback 경계를 검증할 수 있게 한다.
 * Non-Goals:
 *   - 세션 저장이나 D1 profile upsert는 여기서 처리하지 않는다.
 *   - Kakao 메시지 API 전송은 여기서 처리하지 않는다.
 * Dependencies: ./http, ./types
 */

import { HttpError } from './http'
import type { WorkerEnv } from './types'

interface KakaoTokenResponse {
  access_token: string
}

interface KakaoUserResponse {
  id: number | string
  properties?: {
    nickname?: string
    profile_image?: string
    thumbnail_image?: string
  }
  kakao_account?: {
    profile?: {
      nickname?: string
      profile_image_url?: string
      thumbnail_image_url?: string
    }
  }
}

export interface KakaoIdentity {
  authUserId: string
  kakaoNickname: string
  avatarUrl: string
}

interface OAuthStatePayload {
  redirectTo: string
}

function encodeState(payload: OAuthStatePayload): string {
  return btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function decodeState(state: string | null): OAuthStatePayload {
  if (!state) {
    throw new HttpError(400, 'missing_oauth_state', 'OAuth state 값이 필요합니다.')
  }

  const normalized = state.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  try {
    const parsed = JSON.parse(atob(padded)) as Partial<OAuthStatePayload>
    if (!parsed.redirectTo || typeof parsed.redirectTo !== 'string') {
      throw new Error('redirectTo missing')
    }
    return { redirectTo: parsed.redirectTo }
  } catch {
    throw new HttpError(400, 'invalid_oauth_state', 'OAuth state를 해석할 수 없습니다.')
  }
}

/**
 * 공개 API: Kakao authorize URL을 생성한다.
 * 왜 존재하는가: 프론트 로그인 버튼이 Worker를 통해 provider authorize 단계로 진입해야 하기 때문이다.
 * 매개변수:
 * - `env`: Worker runtime env
 * - `requestUrl`: 현재 Worker 요청 URL
 * - `frontendRedirect`: 로그인 후 돌아갈 프론트엔드 origin 또는 URL
 * 반환값: Kakao authorize URL 문자열
 * 에러 동작: Kakao REST API key가 없거나 redirect URL이 비정상이면 `HttpError`를 던진다.
 * 제약: callback은 현재 Worker origin의 `/api/auth/callback`으로 고정한다.
 */
export function buildKakaoAuthorizeUrl(
  env: WorkerEnv,
  requestUrl: URL,
  frontendRedirect: string,
): string {
  if (!env.KAKAO_REST_API_KEY) {
    throw new HttpError(500, 'kakao_rest_key_missing', 'KAKAO_REST_API_KEY가 구성되지 않았습니다.')
  }

  let redirectTo: URL
  try {
    redirectTo = new URL(frontendRedirect)
  } catch {
    throw new HttpError(400, 'invalid_redirect_uri', 'redirect_uri 값이 올바르지 않습니다.')
  }

  const callbackUrl = new URL('/api/auth/callback', requestUrl.origin)
  const kakaoUrl = new URL('https://kauth.kakao.com/oauth/authorize')
  kakaoUrl.searchParams.set('client_id', env.KAKAO_REST_API_KEY)
  kakaoUrl.searchParams.set('redirect_uri', callbackUrl.toString())
  kakaoUrl.searchParams.set('response_type', 'code')
  kakaoUrl.searchParams.set('state', encodeState({ redirectTo: redirectTo.toString() }))
  return kakaoUrl.toString()
}

/**
 * 공개 API: callback state를 해석해 최종 프론트 redirect URL을 반환한다.
 * 왜 존재하는가: callback handler가 사용자를 어디로 돌려보낼지 안정적으로 복원해야 하기 때문이다.
 * 매개변수:
 * - `state`: Kakao callback의 state 값
 * 반환값: 프론트 redirect URL
 * 에러 동작: state 누락/손상 시 `HttpError`를 던진다.
 * 제약: state는 Worker가 encode한 JSON payload 형식이어야 한다.
 */
export function resolveFrontendRedirect(state: string | null): string {
  return decodeState(state).redirectTo
}

/**
 * 공개 API: Kakao authorization code를 access token으로 교환한다.
 * 왜 존재하는가: callback 단계에서 Kakao 사용자 정보를 조회하려면 access token이 필요하기 때문이다.
 * 매개변수:
 * - `env`: Worker runtime env
 * - `requestUrl`: 현재 Worker callback URL
 * - `code`: authorization code
 * - `fetchImpl`: 테스트 가능한 fetch 구현체
 * 반환값: Kakao access token 문자열
 * 에러 동작: provider 실패 또는 응답 이상 시 `HttpError`를 던진다.
 * 제약: callback redirect URI는 현재 Worker origin 기준으로 계산한다.
 */
export async function exchangeCodeForAccessToken(
  env: WorkerEnv,
  requestUrl: URL,
  code: string,
  fetchImpl: typeof fetch,
): Promise<string> {
  if (!env.KAKAO_REST_API_KEY) {
    throw new HttpError(500, 'kakao_rest_key_missing', 'KAKAO_REST_API_KEY가 구성되지 않았습니다.')
  }

  const callbackUrl = new URL('/api/auth/callback', requestUrl.origin)
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: env.KAKAO_REST_API_KEY,
    redirect_uri: callbackUrl.toString(),
    code,
  })

  if (env.KAKAO_CLIENT_SECRET) {
    body.set('client_secret', env.KAKAO_CLIENT_SECRET)
  }

  const response = await fetchImpl('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
    body: body.toString(),
  })

  if (!response.ok) {
    throw new HttpError(502, 'kakao_token_exchange_failed', 'Kakao token 교환에 실패했습니다.')
  }

  const payload = (await response.json()) as Partial<KakaoTokenResponse>
  if (!payload.access_token) {
    throw new HttpError(502, 'kakao_token_missing', 'Kakao access token 응답이 비어 있습니다.')
  }

  return payload.access_token
}

/**
 * 공개 API: Kakao access token으로 사용자 계정 정보를 조회한다.
 * 왜 존재하는가: D1 profile upsert와 세션 생성을 위해 provider identity가 필요하기 때문이다.
 * 매개변수:
 * - `accessToken`: Kakao access token
 * - `fetchImpl`: 테스트 가능한 fetch 구현체
 * 반환값: 내부에 정규화된 `KakaoIdentity`
 * 에러 동작: provider 실패 또는 필수 프로필 누락 시 `HttpError`를 던진다.
 * 제약: 닉네임이 없으면 로그인 진행을 막는다.
 */
export async function fetchKakaoIdentity(
  accessToken: string,
  fetchImpl: typeof fetch,
): Promise<KakaoIdentity> {
  const response = await fetchImpl('https://kapi.kakao.com/v2/user/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new HttpError(502, 'kakao_user_fetch_failed', 'Kakao 사용자 조회에 실패했습니다.')
  }

  const payload = (await response.json()) as KakaoUserResponse
  const nickname =
    payload.kakao_account?.profile?.nickname ??
    payload.properties?.nickname ??
    ''
  const avatarUrl =
    payload.kakao_account?.profile?.profile_image_url ??
    payload.properties?.profile_image ??
    payload.kakao_account?.profile?.thumbnail_image_url ??
    payload.properties?.thumbnail_image ??
    ''

  if (!payload.id || !nickname) {
    throw new HttpError(502, 'kakao_user_payload_invalid', 'Kakao 사용자 응답이 불완전합니다.')
  }

  return {
    authUserId: `kakao:${payload.id}`,
    kakaoNickname: nickname,
    avatarUrl,
  }
}
