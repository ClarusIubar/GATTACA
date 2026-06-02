/**
 * File: worker/types.ts
 * Purpose: Cloudflare Worker foundation의 런타임 바인딩과 세션 페이로드 계약을 정의합니다.
 * Primary Responsibility: Worker HTTP 계층이 의존하는 최소한의 환경/세션 타입 경계를 제공하는 것입니다.
 * Design Intent:
 *   - Cloudflare 런타임 세부 구현을 HTTP/handler 로직과 분리해 이후 D1, R2, KV 세부 확장을 안전하게 수용합니다.
 *   - 현재 이슈 범위에서는 foundation 계약만 정의하고, 비즈니스 CRUD 스키마는 다음 child issue로 미룹니다.
 * Non-Goals:
 *   - D1 SQL 스키마를 여기서 정의하지 않습니다.
 *   - Kakao OAuth 토큰 구조나 세션 생성 절차를 완성하지 않습니다.
 * Dependencies: 표준 TypeScript 타입 시스템, Cloudflare Worker 런타임 전역 API
 */

export interface D1Result<T = Record<string, unknown>> {
  results?: T[]
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = Record<string, unknown>>(): Promise<T | null>
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>
  run(): Promise<unknown>
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement
}

export interface KVNamespace {
  get(key: string, options?: 'text' | 'json' | 'arrayBuffer' | 'stream'): Promise<unknown>
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
  delete(key: string): Promise<void>
}

export interface R2Bucket {
  put(
    key: string,
    value: ArrayBuffer,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<void>
  get(key: string): Promise<R2ObjectBody | null>
  head(key: string): Promise<unknown>
}

export interface R2ObjectBody {
  arrayBuffer(): Promise<ArrayBuffer>
  httpMetadata?: {
    contentType?: string
  }
}

export interface WorkerEnv {
  DB: D1Database
  SESSION: KVNamespace
  BUCKET: R2Bucket
  APP_BASE_URL?: string
  SESSION_TTL_SECONDS?: string
  ADMIN_AUTH_USER_ID?: string
  KAKAO_REST_API_KEY?: string
  KAKAO_CLIENT_SECRET?: string
}

export interface WorkerExecutionContext {
  waitUntil(promise: Promise<unknown>): void
  passThroughOnException?(): void
}

export interface SessionProfileSnapshot {
  profileId: string
  authUserId: string
  role: 'admin' | 'member'
  approvalStatus: 'pending' | 'approved' | 'rejected'
  kakaoNickname: string
  avatarUrl: string
}

export interface SessionRecord {
  id: string
  profile: SessionProfileSnapshot
  issuedAt: string
  expiresAt: string
  kakaoAccessToken?: string | null
}
