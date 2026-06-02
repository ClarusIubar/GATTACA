import type { UserProfile } from '../src/lib/types'
import { findProfileById } from './d1-repository'
import { HttpError } from './http'
import { loadSession, readSessionIdFromRequest } from './session'
import type { SessionRecord, WorkerEnv } from './types'

export interface SessionContext {
  session: SessionRecord
  profile: UserProfile
}

export async function loadSessionContext(
  request: Request,
  env: WorkerEnv,
): Promise<SessionContext | null> {
  const sessionId = readSessionIdFromRequest(request)
  const session = await loadSession(env, sessionId)
  if (!session) {
    return null
  }

  const profile = await findProfileById(env.DB, session.profile.profileId)
  if (!profile || profile.authUserId !== session.profile.authUserId) {
    return null
  }

  return {
    session,
    profile,
  }
}

export async function requireSessionContext(
  request: Request,
  env: WorkerEnv,
): Promise<SessionContext> {
  const context = await loadSessionContext(request, env)
  if (!context) {
    throw new HttpError(401, 'authentication_required', '로그인이 필요한 요청입니다.')
  }
  return context
}

export async function requireApprovedWriterContext(
  request: Request,
  env: WorkerEnv,
): Promise<SessionContext> {
  const context = await requireSessionContext(request, env)
  if (context.profile.role === 'admin' || context.profile.approvalStatus === 'approved') {
    return context
  }

  throw new HttpError(403, 'approval_required', '승인된 사용자만 이 작업을 수행할 수 있습니다.')
}

export async function requireAdminContext(
  request: Request,
  env: WorkerEnv,
): Promise<SessionContext> {
  const context = await requireSessionContext(request, env)
  if (context.profile.role !== 'admin') {
    throw new HttpError(403, 'admin_required', '운영자만 이 작업을 수행할 수 있습니다.')
  }
  return context
}

export function requireOwnerOrAdmin(
  context: SessionContext,
  ownerId: string,
  resourceLabel: string,
): void {
  if (context.profile.role === 'admin' || context.profile.id === ownerId) {
    return
  }

  throw new HttpError(
    403,
    'resource_owner_required',
    `${resourceLabel} 작성자 또는 운영자만 이 작업을 수행할 수 있습니다.`,
  )
}
