/**
 * File: worker/router.ts
 * Purpose: Worker foundation 범위의 라우팅과 공통 에러 경계를 조합합니다.
 * Primary Responsibility: 요청 메서드/경로에 따라 foundation handler를 선택하고 표준 응답을 보장하는 것입니다.
 * Design Intent:
 *   - 엔트리 파일은 최대한 얇게 유지하고 실제 라우팅 판단은 이 모듈로 집중시킵니다.
 *   - 추후 CRUD/OAuth route가 늘어나도 handler 등록 지점을 한 곳으로 유지합니다.
 * Non-Goals:
 *   - 도메인 SQL 실행을 직접 수행하지 않습니다.
 *   - 프레임워크 라우터를 도입하지 않습니다.
 * Dependencies: ./handlers, ./http, ./types
 */

import {
  handleCommentById,
  handleComments,
  handleEventById,
  handleEvents,
  handleHealth,
  handleKakaoAuthorize,
  handleKakaoCallback,
  handleKakaoEventNotification,
  handleLogout,
  handleMemories,
  handleMemoryById,
  handleProfileApproval,
  handleProfiles,
  handleRuntimeStatus,
  handleSession,
  handleUpload,
  handleUploadedImage,
} from './handlers'
import { errorResponse, HttpError, optionsResponse } from './http'
import type { WorkerEnv } from './types'

/**
 * 공개 API: Worker foundation 라우팅을 처리합니다.
 * 왜 존재하는가: 엔트리 파일과 라우팅 정책을 분리해 테스트와 확장을 단순화하기 위함입니다.
 * 매개변수:
 * - `request`: 현재 HTTP 요청
 * - `env`: Worker runtime bindings
 * 반환값: 라우팅 결과 `Response`
 * 에러 동작: handler가 throw 한 예외는 JSON 에러 응답으로 변환됩니다.
 * 제약: 이슈 범위 밖인 route는 404 JSON으로 닫습니다.
 */
export async function routeRequest(request: Request, env: WorkerEnv): Promise<Response> {
  const url = new URL(request.url)
  const origin = request.headers.get('Origin')

  try {
    if (request.method === 'OPTIONS') {
      return optionsResponse(origin)
    }

    if (request.method === 'GET' && url.pathname === '/api/health') {
      return await handleHealth(request, env)
    }

    if (request.method === 'GET' && url.pathname === '/api/runtime-status') {
      return await handleRuntimeStatus(request, env)
    }

    if (request.method === 'GET' && url.pathname === '/api/session') {
      return await handleSession(request, env)
    }

    if (request.method === 'GET' && url.pathname === '/api/auth/kakao') {
      return await handleKakaoAuthorize(request, env)
    }

    if (request.method === 'GET' && url.pathname === '/api/auth/callback') {
      return await handleKakaoCallback(request, env)
    }

    if (request.method === 'POST' && url.pathname === '/api/auth/logout') {
      return await handleLogout(request, env)
    }

    if (request.method === 'POST' && url.pathname === '/api/notifications/kakao-event') {
      return await handleKakaoEventNotification(request, env)
    }

    if (request.method === 'POST' && url.pathname === '/api/upload') {
      return await handleUpload(request, env)
    }

    if (request.method === 'GET' && url.pathname.startsWith('/uploads/')) {
      return await handleUploadedImage(request, env)
    }

    if (request.method === 'GET' && url.pathname === '/api/profiles') {
      return await handleProfiles(request, env)
    }

    if (request.method === 'PUT' && /^\/api\/profiles\/[^/]+\/approval$/.test(url.pathname)) {
      return await handleProfileApproval(request, env)
    }

    if ((request.method === 'GET' || request.method === 'POST') && url.pathname === '/api/events') {
      return await handleEvents(request, env)
    }

    if ((request.method === 'PUT' || request.method === 'DELETE') && /^\/api\/events\/[^/]+$/.test(url.pathname)) {
      return await handleEventById(request, env)
    }

    if ((request.method === 'GET' || request.method === 'POST') && url.pathname === '/api/memories') {
      return await handleMemories(request, env)
    }

    if ((request.method === 'PUT' || request.method === 'DELETE') && /^\/api\/memories\/[^/]+$/.test(url.pathname)) {
      return await handleMemoryById(request, env)
    }

    if ((request.method === 'GET' || request.method === 'POST') && url.pathname === '/api/comments') {
      return await handleComments(request, env)
    }

    if ((request.method === 'PUT' || request.method === 'DELETE') && /^\/api\/comments\/[^/]+$/.test(url.pathname)) {
      return await handleCommentById(request, env)
    }

    if (url.pathname.startsWith('/api/')) {
      throw new HttpError(404, 'route_not_found', `지원하지 않는 API 경로입니다: ${url.pathname}`)
    }

    throw new HttpError(404, 'not_found', '지원하지 않는 경로입니다.')
  } catch (error) {
    return errorResponse(error, origin)
  }
}
