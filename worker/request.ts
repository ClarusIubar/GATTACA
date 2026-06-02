/**
 * File: worker/request.ts
 * Purpose: Worker CRUD route에서 사용하는 JSON body 파싱과 경로 ID 추출 유틸을 제공합니다.
 * Primary Responsibility: 핸들러가 HTTP 입력 검증 보일러플레이트 없이 도메인 로직에 집중하게 하는 것입니다.
 * Design Intent:
 *   - 잘못된 JSON이나 잘못된 경로를 조기에 `HttpError`로 수렴해 route 정책을 단순화합니다.
 *   - 입력 검증 seam을 고정해 이후 권한 체크 추가 시 로직 중복을 줄입니다.
 * Non-Goals:
 *   - 도메인 필드별 상세 validation은 최소한만 수행합니다.
 *   - multipart/form-data 업로드는 다루지 않습니다.
 * Dependencies: ./http
 */

import { HttpError } from './http'

/**
 * 공개 API: 요청 body를 JSON으로 파싱합니다.
 * 왜 존재하는가: CRUD route가 잘못된 요청을 일관된 400 에러로 반환해야 하기 때문입니다.
 * 매개변수:
 * - `request`: 현재 HTTP 요청
 * 반환값: 파싱된 JSON 객체
 * 에러 동작: JSON 파싱 실패 또는 object가 아니면 400 `HttpError`를 throw 합니다.
 * 제약: 배열 payload는 허용하지 않습니다.
 */
export async function readJsonObject<T>(request: Request): Promise<T> {
  try {
    const body = await request.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new HttpError(400, 'invalid_json_body', 'JSON object body가 필요합니다.')
    }
    return body as T
  } catch (error) {
    if (error instanceof HttpError) {
      throw error
    }
    throw new HttpError(400, 'invalid_json_body', 'JSON body를 해석할 수 없습니다.')
  }
}

/**
 * 공개 API: `/api/<resource>/<id>` 패턴에서 마지막 경로 조각을 추출합니다.
 * 왜 존재하는가: update/delete 라우트가 경로 파라미터를 명시적으로 검증해야 하기 때문입니다.
 * 매개변수:
 * - `pathname`: 요청 경로
 * - `resource`: 기대하는 리소스 이름
 * 반환값: ID 문자열
 * 에러 동작: 경로가 기대 형식이 아니면 400 `HttpError`를 throw 합니다.
 * 제약: 추가 하위 경로는 허용하지 않습니다.
 */
export function requireResourceId(pathname: string, resource: string): string {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length !== 3 || segments[0] !== 'api' || segments[1] !== resource || !segments[2]) {
    throw new HttpError(400, 'invalid_route_parameters', `잘못된 ${resource} 경로입니다: ${pathname}`)
  }
  return segments[2]
}
