const DEFAULT_ALLOWED_HEADERS = 'Content-Type, Authorization'
const DEFAULT_ALLOWED_METHODS = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'

export class HttpError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export function createCorsHeaders(origin?: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin?.trim() || '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': DEFAULT_ALLOWED_HEADERS,
    'Access-Control-Allow-Methods': DEFAULT_ALLOWED_METHODS,
    Vary: 'Origin',
  }
}

export function jsonResponse(
  payload: unknown,
  init: ResponseInit = {},
  origin?: string | null,
): Response {
  return new Response(JSON.stringify(payload), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...createCorsHeaders(origin),
      ...(init.headers ?? {}),
    },
  })
}

export function optionsResponse(origin?: string | null): Response {
  return new Response(null, {
    status: 204,
    headers: createCorsHeaders(origin),
  })
}

export function errorResponse(error: unknown, origin?: string | null): Response {
  if (error instanceof HttpError) {
    return jsonResponse(
      {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.status },
      origin,
    )
  }

  return jsonResponse(
    {
      ok: false,
      error: {
        code: 'internal_error',
        message: error instanceof Error ? error.message : '알 수 없는 서버 오류가 발생했습니다.',
      },
    },
    { status: 500 },
    origin,
  )
}
