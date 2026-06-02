import type { ApprovalStatus, CommentInput, EventInput, MemoryInput } from '../src/lib/types'
import {
  loadSessionContext,
  requireAdminContext,
  requireApprovedWriterContext,
  requireOwnerOrAdmin,
} from './authz'
import {
  buildKakaoAuthorizeUrl,
  exchangeCodeForAccessToken,
  fetchKakaoIdentity,
  resolveFrontendRedirect,
} from './auth'
import {
  createComment,
  createEvent,
  createMemory,
  deleteComment,
  deleteEvent,
  deleteMemory,
  getCommentById,
  getEventById,
  getMemoryById,
  listComments,
  listEvents,
  listMemories,
  listProfiles,
  updateComment,
  updateEvent,
  updateMemory,
  updateProfileApproval,
  upsertProfileFromKakaoIdentity,
} from './d1-repository'
import { HttpError, jsonResponse } from './http'
import { assertValidKakaoTemplate, sendKakaoMemoMessage } from './kakao-notification'
import { readJsonObject, requireResourceId } from './request'
import { buildExpiredSessionCookie, buildSessionCookie, createSession, deleteSession, getSessionTtlSeconds } from './session-store'
import type { WorkerEnv } from './types'
import {
  assertUploadableImage,
  buildUploadObjectKey,
  buildUploadPublicUrl,
  buildUploadResponse,
  decodeUploadPath,
  storeUploadObject,
} from './upload'

export async function handleHealth(request: Request, env: WorkerEnv): Promise<Response> {
  const origin = request.headers.get('Origin')

  return jsonResponse(
    {
      ok: true,
      service: 'gattaca-backend',
      timestamp: new Date().toISOString(),
      bindings: {
        db: Boolean(env.DB),
        session: Boolean(env.SESSION),
        bucket: Boolean(env.BUCKET),
      },
    },
    { status: 200 },
    origin,
  )
}

export async function handleRuntimeStatus(request: Request, env: WorkerEnv): Promise<Response> {
  const origin = request.headers.get('Origin')
  const kakaoRestApiKeyConfigured = Boolean(env.KAKAO_REST_API_KEY)
  const kakaoClientSecretConfigured = Boolean(env.KAKAO_CLIENT_SECRET)

  return jsonResponse(
    {
      ok: true,
      service: 'gattaca-backend',
      timestamp: new Date().toISOString(),
      bindings: {
        db: Boolean(env.DB),
        session: Boolean(env.SESSION),
        bucket: Boolean(env.BUCKET),
      },
      auth: {
        kakaoRestApiKeyConfigured,
        kakaoClientSecretConfigured,
        kakaoOAuthConfigured: kakaoRestApiKeyConfigured && kakaoClientSecretConfigured,
      },
    },
    { status: 200 },
    origin,
  )
}

export async function handleSession(request: Request, env: WorkerEnv): Promise<Response> {
  if (!env.SESSION) {
    throw new HttpError(500, 'session_store_missing', 'SESSION 바인딩이 구성되지 않았습니다.')
  }

  const origin = request.headers.get('Origin')
  const context = await loadSessionContext(request, env)

  return jsonResponse(
    {
      ok: true,
      authenticated: Boolean(context),
      session: context
        ? {
            id: context.session.id,
            issuedAt: context.session.issuedAt,
            expiresAt: context.session.expiresAt,
            profile: {
              profileId: context.profile.id,
              authUserId: context.profile.authUserId,
              role: context.profile.role,
              approvalStatus: context.profile.approvalStatus,
              kakaoNickname: context.profile.kakaoNickname,
              avatarUrl: context.profile.avatarUrl,
            },
          }
        : null,
    },
    { status: 200 },
    origin,
  )
}

export async function handleKakaoAuthorize(request: Request, env: WorkerEnv): Promise<Response> {
  const url = new URL(request.url)
  const frontendRedirect = url.searchParams.get('redirect_uri') ?? env.APP_BASE_URL ?? ''
  const authorizeUrl = buildKakaoAuthorizeUrl(env, url, frontendRedirect)
  return Response.redirect(authorizeUrl, 302)
}

export async function handleKakaoCallback(request: Request, env: WorkerEnv): Promise<Response> {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  if (!code) {
    throw new HttpError(400, 'missing_oauth_code', 'Kakao OAuth code 값이 필요합니다.')
  }

  const redirectTo = resolveFrontendRedirect(url.searchParams.get('state'))
  const accessToken = await exchangeCodeForAccessToken(env, url, code, fetch)
  const identity = await fetchKakaoIdentity(accessToken, fetch)
  const profile = await upsertProfileFromKakaoIdentity(env.DB, identity, {
    adminAuthUserId: env.ADMIN_AUTH_USER_ID,
  })
  const session = await createSession(env, profile, { kakaoAccessToken: accessToken })
  const secure = url.protocol === 'https:'
  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectTo,
      'Set-Cookie': buildSessionCookie(session.id, secure, getSessionTtlSeconds(env)),
    },
  })
}

export async function handleLogout(request: Request, env: WorkerEnv): Promise<Response> {
  const origin = request.headers.get('Origin')
  const cookieHeader = request.headers.get('Cookie')
  const sessionId = cookieHeader
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('gattaca_session='))
    ?.slice('gattaca_session='.length) ?? null
  await deleteSession(env, sessionId ? decodeURIComponent(sessionId) : null)
  const secure = new URL(request.url).protocol === 'https:'
  return jsonResponse(
    { ok: true },
    {
      status: 200,
      headers: {
        'Set-Cookie': buildExpiredSessionCookie(secure),
      },
    },
    origin,
  )
}

export async function handleKakaoEventNotification(request: Request, env: WorkerEnv): Promise<Response> {
  const origin = request.headers.get('Origin')
  const actor = await requireApprovedWriterContext(request, env)
  const body = await readJsonObject<{
    text?: string
    buttonTitle?: string
    buttonUrl?: string
  }>(request)

  const template = {
    text: body.text ?? '',
    buttonTitle: body.buttonTitle ?? '',
    buttonUrl: body.buttonUrl ?? '',
  }
  assertValidKakaoTemplate(template)
  await sendKakaoMemoMessage(actor.session.kakaoAccessToken ?? '', template, fetch)

  return jsonResponse({ ok: true }, { status: 202 }, origin)
}

export async function handleUpload(request: Request, env: WorkerEnv): Promise<Response> {
  const origin = request.headers.get('Origin')
  const actor = await requireApprovedWriterContext(request, env)
  const formData = await request.formData()
  const fileEntry = formData.get('file')
  if (!(fileEntry instanceof File)) {
    throw new HttpError(400, 'upload_file_required', 'multipart form-data에 file 필드가 필요합니다.')
  }

  assertUploadableImage(fileEntry)
  const objectKey = buildUploadObjectKey(actor.profile.id, fileEntry.type)
  await storeUploadObject(env.BUCKET, objectKey, fileEntry)

  return jsonResponse(
    {
      ok: true,
      objectKey,
      publicUrl: buildUploadPublicUrl(new URL(request.url), objectKey),
    },
    { status: 201 },
    origin,
  )
}

export async function handleUploadedImage(request: Request, env: WorkerEnv): Promise<Response> {
  const objectKey = decodeUploadPath(new URL(request.url).pathname)
  const object = await env.BUCKET.get(objectKey)
  if (!object) {
    throw new HttpError(404, 'upload_not_found', `업로드한 이미지를 찾을 수 없습니다: ${objectKey}`)
  }
  return buildUploadResponse(object)
}

export async function handleProfiles(request: Request, env: WorkerEnv): Promise<Response> {
  const origin = request.headers.get('Origin')
  return jsonResponse(await listProfiles(env.DB), { status: 200 }, origin)
}

export async function handleProfileApproval(request: Request, env: WorkerEnv): Promise<Response> {
  const origin = request.headers.get('Origin')
  await requireAdminContext(request, env)
  const profileId = requireResourceId(new URL(request.url).pathname.replace('/approval', ''), 'profiles')
  const body = await readJsonObject<{ approvalStatus?: ApprovalStatus }>(request)
  if (
    body.approvalStatus !== 'pending' &&
    body.approvalStatus !== 'approved' &&
    body.approvalStatus !== 'rejected'
  ) {
    throw new HttpError(400, 'invalid_approval_status', 'approvalStatus 값이 유효하지 않습니다.')
  }
  await updateProfileApproval(env.DB, profileId, body.approvalStatus)
  return jsonResponse({ ok: true }, { status: 200 }, origin)
}

export async function handleEvents(request: Request, env: WorkerEnv): Promise<Response> {
  const origin = request.headers.get('Origin')
  if (request.method === 'GET') {
    return jsonResponse(await listEvents(env.DB), { status: 200 }, origin)
  }

  const actor = await requireApprovedWriterContext(request, env)
  const body = await readJsonObject<EventInput>(request)
  const created = await createEvent(env.DB, body, actor.profile.id)
  return jsonResponse({ ok: true, event: created }, { status: 201 }, origin)
}

export async function handleEventById(request: Request, env: WorkerEnv): Promise<Response> {
  const origin = request.headers.get('Origin')
  const eventId = requireResourceId(new URL(request.url).pathname, 'events')

  if (request.method === 'PUT') {
    const actor = await requireApprovedWriterContext(request, env)
    const event = await getEventById(env.DB, eventId)
    requireOwnerOrAdmin(actor, event.createdBy, '이벤트')
    const body = await readJsonObject<EventInput>(request)
    await updateEvent(env.DB, eventId, body)
    return jsonResponse({ ok: true }, { status: 200 }, origin)
  }

  await requireAdminContext(request, env)
  await deleteEvent(env.DB, eventId)
  return jsonResponse({ ok: true }, { status: 200 }, origin)
}

export async function handleMemories(request: Request, env: WorkerEnv): Promise<Response> {
  const origin = request.headers.get('Origin')
  if (request.method === 'GET') {
    return jsonResponse(await listMemories(env.DB), { status: 200 }, origin)
  }

  const actor = await requireApprovedWriterContext(request, env)
  const body = await readJsonObject<MemoryInput & { photoUrl?: string }>(request)
  if (!body.photoUrl) {
    throw new HttpError(400, 'memory_fields_required', 'photoUrl 값이 필요합니다.')
  }
  const created = await createMemory(env.DB, body, body.photoUrl, actor.profile.id)
  return jsonResponse({ ok: true, memory: created }, { status: 201 }, origin)
}

export async function handleMemoryById(request: Request, env: WorkerEnv): Promise<Response> {
  const origin = request.headers.get('Origin')
  const memoryId = requireResourceId(new URL(request.url).pathname, 'memories')

  if (request.method === 'PUT') {
    const actor = await requireApprovedWriterContext(request, env)
    const memory = await getMemoryById(env.DB, memoryId)
    requireOwnerOrAdmin(actor, memory.authorId, '메모리')
    const body = await readJsonObject<MemoryInput & { photoUrl?: string }>(request)
    if (!body.photoUrl) {
      throw new HttpError(400, 'photo_url_required', 'photoUrl 값이 필요합니다.')
    }
    await updateMemory(env.DB, memoryId, body, body.photoUrl)
    return jsonResponse({ ok: true }, { status: 200 }, origin)
  }

  await requireAdminContext(request, env)
  await deleteMemory(env.DB, memoryId)
  return jsonResponse({ ok: true }, { status: 200 }, origin)
}

export async function handleComments(request: Request, env: WorkerEnv): Promise<Response> {
  const origin = request.headers.get('Origin')
  if (request.method === 'GET') {
    return jsonResponse(await listComments(env.DB), { status: 200 }, origin)
  }

  const actor = await requireApprovedWriterContext(request, env)
  const body = await readJsonObject<CommentInput>(request)
  const created = await createComment(env.DB, body, actor.profile.id)
  return jsonResponse({ ok: true, comment: created }, { status: 201 }, origin)
}

export async function handleCommentById(request: Request, env: WorkerEnv): Promise<Response> {
  const origin = request.headers.get('Origin')
  const commentId = requireResourceId(new URL(request.url).pathname, 'comments')

  if (request.method === 'PUT') {
    const actor = await requireApprovedWriterContext(request, env)
    const comment = await getCommentById(env.DB, commentId)
    requireOwnerOrAdmin(actor, comment.authorId, '코멘트')
    const body = await readJsonObject<CommentInput>(request)
    await updateComment(env.DB, commentId, body)
    return jsonResponse({ ok: true }, { status: 200 }, origin)
  }

  await requireAdminContext(request, env)
  await deleteComment(env.DB, commentId)
  return jsonResponse({ ok: true }, { status: 200 }, origin)
}
