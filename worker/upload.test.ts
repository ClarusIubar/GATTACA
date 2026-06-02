import { beforeEach, describe, expect, it, vi } from 'vitest'
import { routeRequest } from './router'
import { createAuthHeaders, createSessionRecord, createWorkerEnv, type FakeStore } from './test-support'

describe('worker upload routes', () => {
  let store: FakeStore

  beforeEach(() => {
    store = {
      profiles: [
        {
          id: 'profile-approved',
          auth_user_id: 'kakao:approved',
          kakao_nickname: '승인회원',
          avatar_url: 'https://example.com/approved.png',
          approval_status: 'approved',
          role: 'member',
        },
        {
          id: 'profile-pending',
          auth_user_id: 'kakao:pending',
          kakao_nickname: '대기회원',
          avatar_url: 'https://example.com/pending.png',
          approval_status: 'pending',
          role: 'member',
        },
      ],
      events: [],
      memories: [],
      comments: [],
    }

    vi.restoreAllMocks()
    vi.spyOn(globalThis.crypto, 'randomUUID').mockImplementation(
      () => '00000000-0000-0000-0000-000000000000',
    )
  })

  it('stores upload in R2 using the session profile id and serves it back', async () => {
    const { env, bucket } = createWorkerEnv(store, {
      session: createSessionRecord(store.profiles[0]),
    })
    const formData = new FormData()
    formData.set('userId', 'forged-profile')
    formData.set('file', new File([new Uint8Array([1, 2, 3, 4])], 'memory.png', { type: 'image/png' }))
    const uploadRequest = new Request('https://api.example.com/api/upload', {
      method: 'POST',
      headers: createAuthHeaders(),
    })
    Object.defineProperty(uploadRequest, 'formData', {
      value: async () => formData,
    })

    const uploadResponse = await routeRequest(uploadRequest, env)

    expect(uploadResponse.status).toBe(201)
    const uploadBody = (await uploadResponse.json()) as { objectKey: string; publicUrl: string }
    expect(uploadBody.objectKey).toBe(
      'memories/profile-approved/00000000-0000-0000-0000-000000000000.png',
    )
    expect(uploadBody.publicUrl).toBe(
      'https://api.example.com/uploads/memories/profile-approved/00000000-0000-0000-0000-000000000000.png',
    )
    expect(bucket.objects.has(uploadBody.objectKey)).toBe(true)

    const imageResponse = await routeRequest(new Request(uploadBody.publicUrl), env)
    expect(imageResponse.status).toBe(200)
    expect(imageResponse.headers.get('Content-Type')).toBe('image/png')
    expect(new Uint8Array(await imageResponse.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3, 4]))
  })

  it('rejects pending users and unsupported mime types', async () => {
    const pendingEnv = createWorkerEnv(store, {
      session: createSessionRecord(store.profiles[1]),
    }).env

    const pendingForm = new FormData()
    pendingForm.set('file', new File([new Uint8Array([1])], 'memory.png', { type: 'image/png' }))
    const pendingRequest = new Request('https://api.example.com/api/upload', {
      method: 'POST',
      headers: createAuthHeaders(),
    })
    Object.defineProperty(pendingRequest, 'formData', {
      value: async () => pendingForm,
    })

    const pendingResponse = await routeRequest(pendingRequest, pendingEnv)
    expect(pendingResponse.status).toBe(403)
    expect((await pendingResponse.json()) as { error: { code: string } }).toEqual(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'approval_required' }),
      }),
    )

    const approvedEnv = createWorkerEnv(store, {
      session: createSessionRecord(store.profiles[0]),
    }).env
    const invalidForm = new FormData()
    invalidForm.set('file', new File([new Uint8Array([1])], 'memory.gif', { type: 'image/gif' }))
    const invalidRequest = new Request('https://api.example.com/api/upload', {
      method: 'POST',
      headers: createAuthHeaders(),
    })
    Object.defineProperty(invalidRequest, 'formData', {
      value: async () => invalidForm,
    })

    const invalidResponse = await routeRequest(invalidRequest, approvedEnv)
    expect(invalidResponse.status).toBe(400)
    expect((await invalidResponse.json()) as { error: { code: string } }).toEqual(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'invalid_upload_type' }),
      }),
    )
  })
})
