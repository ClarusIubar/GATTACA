/**
 * File: worker/session-store.ts
 * Purpose: KV 세션 저장/삭제와 쿠키 헤더 조합을 담당합니다.
 * Primary Responsibility: 인증 후 current-user 복원에 필요한 세션 persistence 경계를 제공하는 것입니다.
 * Design Intent:
 *   - auth handler가 세션 저장 메커니즘을 직접 다루지 않도록 KV/cookie 정책을 캡슐화합니다.
 *   - 후속 권한 이슈에서 세션 읽기/검증을 재사용할 수 있도록 단일 contract를 유지합니다.
 * Non-Goals:
 *   - 세션 권한 검증을 수행하지 않습니다.
 *   - refresh token 로테이션을 구현하지 않습니다.
 * Dependencies: ./types
 */

import type { SessionProfileSnapshot, SessionRecord, WorkerEnv } from './types'

const SESSION_COOKIE_NAME = 'gattaca_session'
const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 24 * 14

function sessionTtlSeconds(env: WorkerEnv): number {
  const parsed = Number.parseInt(env.SESSION_TTL_SECONDS ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_SESSION_TTL_SECONDS
}

/**
 * 공개 API: 세션 레코드를 생성해 KV에 저장합니다.
 * 왜 존재하는가: OAuth callback 완료 후 새로고침 가능한 서버 세션이 필요하기 때문입니다.
 * 매개변수:
 * - `env`: Worker runtime env
 * - `profile`: 세션에 저장할 현재 사용자 프로필 스냅샷
 * 반환값: 저장된 `SessionRecord`
 * 에러 동작: KV 쓰기 실패는 상위 호출자에게 전파됩니다.
 * 제약: TTL은 `SESSION_TTL_SECONDS` env 또는 기본 14일을 사용합니다.
 */
export async function createSession(
  env: WorkerEnv,
  profile: SessionProfileSnapshot,
  options?: { kakaoAccessToken?: string | null },
): Promise<SessionRecord> {
  const ttl = sessionTtlSeconds(env)
  const issuedAt = new Date().toISOString()
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString()
  const session: SessionRecord = {
    id: crypto.randomUUID(),
    profile,
    issuedAt,
    expiresAt,
    kakaoAccessToken: options?.kakaoAccessToken ?? null,
  }

  await env.SESSION.put(`session:${session.id}`, JSON.stringify(session), {
    expirationTtl: ttl,
  })

  return session
}

/**
 * 공개 API: 세션 레코드를 KV에서 삭제합니다.
 * 왜 존재하는가: 로그아웃 시 세션 무효화를 서버 저장소에 반영해야 하기 때문입니다.
 * 매개변수:
 * - `env`: Worker runtime env
 * - `sessionId`: 삭제할 세션 ID
 * 반환값: 없음
 * 에러 동작: KV 삭제 실패는 상위 호출자에게 전파됩니다.
 * 제약: `null` sessionId는 no-op입니다.
 */
export async function deleteSession(env: WorkerEnv, sessionId: string | null): Promise<void> {
  if (!sessionId) {
    return
  }
  await env.SESSION.delete(`session:${sessionId}`)
}

/**
 * 공개 API: 세션 쿠키 헤더 문자열을 생성합니다.
 * 왜 존재하는가: callback/로그아웃 응답이 브라우저에 안정된 session cookie를 내려야 하기 때문입니다.
 * 매개변수:
 * - `sessionId`: 새 세션 ID
 * - `secure`: HTTPS 환경 여부
 * - `maxAge`: 쿠키 만료 초
 * 반환값: `Set-Cookie` 헤더 값
 * 에러 동작: 없습니다.
 * 제약: `SameSite=Lax`, `HttpOnly`, `Path=/`를 고정합니다.
 */
export function buildSessionCookie(sessionId: string, secure: boolean, maxAge: number): string {
  return [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
    secure ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ')
}

/**
 * 공개 API: 세션 삭제용 만료 쿠키를 생성합니다.
 * 왜 존재하는가: 로그아웃 시 브라우저 쿠키를 즉시 지워야 하기 때문입니다.
 * 매개변수:
 * - `secure`: HTTPS 환경 여부
 * 반환값: 만료된 `Set-Cookie` 헤더 값
 * 에러 동작: 없습니다.
 * 제약: cookie 이름은 고정입니다.
 */
export function buildExpiredSessionCookie(secure: boolean): string {
  return [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
    secure ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ')
}

/**
 * 공개 API: env 기준 세션 TTL을 노출합니다.
 * 왜 존재하는가: callback handler가 쿠키 `Max-Age`와 KV TTL을 같은 값으로 맞춰야 하기 때문입니다.
 * 매개변수:
 * - `env`: Worker runtime env
 * 반환값: TTL 초
 * 에러 동작: 없습니다.
 * 제약: 비정상 env 값은 기본 14일로 강등합니다.
 */
export function getSessionTtlSeconds(env: WorkerEnv): number {
  return sessionTtlSeconds(env)
}
