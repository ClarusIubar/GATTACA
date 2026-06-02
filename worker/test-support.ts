import type { KVNamespace, R2Bucket, R2ObjectBody, WorkerEnv, D1Database, D1PreparedStatement, SessionRecord } from './types'

export interface FakeProfileRow {
  id: string
  auth_user_id: string
  kakao_nickname: string
  avatar_url: string
  approval_status: 'pending' | 'approved' | 'rejected'
  role: 'admin' | 'member'
}

export interface FakeEventRow {
  id: string
  title: string
  event_at: string
  location: string
  what: string
  how: string
  decision_summary: string
  created_by: string
}

export interface FakeMemoryRow {
  id: string
  event_id: string
  author_id: string
  photo_url: string
  caption: string
  recorded_at: string
}

export interface FakeCommentRow {
  id: string
  memory_id: string
  author_id: string
  content: string
  created_at: string
}

export interface FakeStore {
  profiles: FakeProfileRow[]
  events: FakeEventRow[]
  memories: FakeMemoryRow[]
  comments: FakeCommentRow[]
}

class FakeStatement implements D1PreparedStatement {
  private bound: unknown[] = []
  private readonly query: string
  private readonly store: FakeStore

  constructor(query: string, store: FakeStore) {
    this.query = query
    this.store = store
  }

  bind(...values: unknown[]): D1PreparedStatement {
    this.bound = values
    return this
  }

  async first<T = Record<string, unknown>>(): Promise<T | null> {
    if (this.query.includes('FROM profiles') && this.query.includes('WHERE auth_user_id')) {
      return (this.store.profiles.find((row) => row.auth_user_id === this.bound[0]) as T) ?? null
    }
    if (this.query.includes('FROM profiles') && this.query.includes('WHERE id')) {
      return (this.store.profiles.find((row) => row.id === this.bound[0]) as T) ?? null
    }
    if (this.query.includes('FROM events') && this.query.includes('WHERE id')) {
      return (this.store.events.find((row) => row.id === this.bound[0]) as T) ?? null
    }
    if (this.query.includes('FROM memories') && this.query.includes('WHERE id')) {
      return (this.store.memories.find((row) => row.id === this.bound[0]) as T) ?? null
    }
    if (this.query.includes('FROM comments') && this.query.includes('WHERE id')) {
      return (this.store.comments.find((row) => row.id === this.bound[0]) as T) ?? null
    }

    const id = this.bound[0]
    for (const collection of [this.store.profiles, this.store.events, this.store.memories, this.store.comments]) {
      const row = collection.find((item) => item.id === id)
      if (row) {
        return row as T
      }
    }

    return null
  }

  async all<T = Record<string, unknown>>(): Promise<{ results: T[] }> {
    if (this.query.includes('FROM profiles')) {
      return { results: this.store.profiles as T[] }
    }
    if (this.query.includes('FROM events')) {
      return { results: this.store.events as T[] }
    }
    if (this.query.includes('FROM memories')) {
      return { results: this.store.memories as T[] }
    }
    if (this.query.includes('FROM comments')) {
      return { results: this.store.comments as T[] }
    }
    return { results: [] }
  }

  async run(): Promise<unknown> {
    if (this.query.includes('INSERT INTO profiles')) {
      this.store.profiles.push({
        id: this.bound[0] as string,
        auth_user_id: this.bound[1] as string,
        kakao_nickname: this.bound[2] as string,
        avatar_url: this.bound[3] as string,
        approval_status: 'pending',
        role: 'member',
      })
      return undefined
    }

    if (this.query.includes('UPDATE profiles') && this.query.includes('SET approval_status')) {
      const target = this.store.profiles.find((row) => row.id === this.bound[0])
      if (target) {
        target.approval_status = this.bound[1] as FakeProfileRow['approval_status']
      }
      return undefined
    }

    if (this.query.includes('UPDATE profiles') && this.query.includes('SET kakao_nickname')) {
      const target = this.store.profiles.find((row) => row.auth_user_id === this.bound[0])
      if (target) {
        target.kakao_nickname = this.bound[1] as string
        target.avatar_url = this.bound[2] as string
      }
      return undefined
    }

    if (this.query.includes('INSERT INTO events')) {
      this.store.events.push({
        id: this.bound[0] as string,
        title: this.bound[1] as string,
        event_at: this.bound[2] as string,
        location: this.bound[3] as string,
        what: this.bound[4] as string,
        how: this.bound[5] as string,
        decision_summary: this.bound[6] as string,
        created_by: this.bound[7] as string,
      })
      return undefined
    }

    if (this.query.includes('UPDATE events')) {
      const target = this.store.events.find((row) => row.id === this.bound[0])
      if (target) {
        target.title = this.bound[1] as string
        target.event_at = this.bound[2] as string
        target.location = this.bound[3] as string
        target.what = this.bound[4] as string
        target.how = this.bound[5] as string
        target.decision_summary = this.bound[6] as string
      }
      return undefined
    }

    if (this.query.includes('DELETE FROM events')) {
      this.store.events = this.store.events.filter((row) => row.id !== this.bound[0])
      return undefined
    }

    if (this.query.includes('INSERT INTO memories')) {
      this.store.memories.push({
        id: this.bound[0] as string,
        event_id: this.bound[1] as string,
        author_id: this.bound[2] as string,
        photo_url: this.bound[3] as string,
        caption: this.bound[4] as string,
        recorded_at: this.bound[5] as string,
      })
      return undefined
    }

    if (this.query.includes('UPDATE memories')) {
      const target = this.store.memories.find((row) => row.id === this.bound[0])
      if (target) {
        target.event_id = this.bound[1] as string
        target.photo_url = this.bound[2] as string
        target.caption = this.bound[3] as string
        target.recorded_at = this.bound[4] as string
      }
      return undefined
    }

    if (this.query.includes('DELETE FROM memories')) {
      this.store.memories = this.store.memories.filter((row) => row.id !== this.bound[0])
      return undefined
    }

    if (this.query.includes('INSERT INTO comments')) {
      this.store.comments.push({
        id: this.bound[0] as string,
        memory_id: this.bound[1] as string,
        author_id: this.bound[2] as string,
        content: this.bound[3] as string,
        created_at: this.bound[4] as string,
      })
      return undefined
    }

    if (this.query.includes('UPDATE comments')) {
      const target = this.store.comments.find((row) => row.id === this.bound[0])
      if (target) {
        target.content = this.bound[1] as string
      }
      return undefined
    }

    if (this.query.includes('DELETE FROM comments')) {
      this.store.comments = this.store.comments.filter((row) => row.id !== this.bound[0])
      return undefined
    }

    return undefined
  }
}

export class FakeDatabase implements D1Database {
  private readonly store: FakeStore

  constructor(store: FakeStore) {
    this.store = store
  }

  prepare(query: string): D1PreparedStatement {
    return new FakeStatement(query, this.store)
  }
}

export class FakeKv implements KVNamespace {
  readonly store = new Map<string, string>()

  async get(key: string, options?: 'text' | 'json' | 'arrayBuffer' | 'stream'): Promise<unknown> {
    const value = this.store.get(key)
    if (!value) {
      return null
    }
    if (options === 'json') {
      return JSON.parse(value)
    }
    return value
  }

  async put(key: string, value: string): Promise<void> {
    this.store.set(key, value)
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key)
  }
}

export class FakeR2Object implements R2ObjectBody {
  readonly httpMetadata?: { contentType?: string }
  private readonly bytes: Uint8Array

  constructor(bytes: Uint8Array, contentType: string) {
    this.bytes = bytes
    this.httpMetadata = { contentType }
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    return this.bytes.buffer.slice(
      this.bytes.byteOffset,
      this.bytes.byteOffset + this.bytes.byteLength,
    ) as ArrayBuffer
  }
}

export class FakeBucket implements R2Bucket {
  readonly objects = new Map<string, FakeR2Object>()

  async put(
    key: string,
    value: ArrayBuffer,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<void> {
    this.objects.set(
      key,
      new FakeR2Object(new Uint8Array(value), options?.httpMetadata?.contentType || 'application/octet-stream'),
    )
  }

  async get(key: string): Promise<R2ObjectBody | null> {
    return this.objects.get(key) ?? null
  }

  async head(key: string): Promise<unknown> {
    return this.objects.get(key) ?? null
  }
}

export function createSessionRecord(profile: FakeProfileRow, overrides?: Partial<SessionRecord>): SessionRecord {
  return {
    id: overrides?.id ?? 'session-1',
    issuedAt: overrides?.issuedAt ?? '2026-06-02T00:00:00.000Z',
    expiresAt: overrides?.expiresAt ?? '2099-06-02T01:00:00.000Z',
    kakaoAccessToken: overrides?.kakaoAccessToken ?? null,
    profile: {
      profileId: profile.id,
      authUserId: profile.auth_user_id,
      role: profile.role,
      approvalStatus: profile.approval_status,
      kakaoNickname: profile.kakao_nickname,
      avatarUrl: profile.avatar_url,
    },
  }
}

export function createWorkerEnv(
  store: FakeStore,
  options?: {
    session?: SessionRecord | null
    bucket?: FakeBucket
    appBaseUrl?: string
    adminAuthUserId?: string
    kakaoRestApiKey?: string
    kakaoClientSecret?: string
    sessionTtlSeconds?: string
  },
): { env: WorkerEnv; kv: FakeKv; bucket: FakeBucket } {
  const kv = new FakeKv()
  const bucket = options?.bucket ?? new FakeBucket()
  if (options?.session) {
    kv.store.set(`session:${options.session.id}`, JSON.stringify(options.session))
  }

  return {
    kv,
    bucket,
    env: {
      DB: new FakeDatabase(store),
      SESSION: kv,
      BUCKET: bucket,
      APP_BASE_URL: options?.appBaseUrl ?? 'https://train.example.com',
      KAKAO_REST_API_KEY: options?.kakaoRestApiKey ?? 'kakao-rest-key',
      KAKAO_CLIENT_SECRET: options?.kakaoClientSecret ?? 'kakao-secret',
      SESSION_TTL_SECONDS: options?.sessionTtlSeconds ?? '3600',
      ADMIN_AUTH_USER_ID: options?.adminAuthUserId,
    },
  }
}

export function createAuthHeaders(sessionId = 'session-1'): HeadersInit {
  return {
    Origin: 'https://train.example.com',
    Cookie: `gattaca_session=${sessionId}`,
  }
}
