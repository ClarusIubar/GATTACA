/**
 * File: worker/upload.ts
 * Purpose: R2 업로드와 재표시를 위한 object key 규칙, server-side validation, public URL 생성을 담당합니다.
 * Primary Responsibility: 업로드 메커니즘을 HTTP handler와 분리해 R2 저장/조회 규칙을 중앙화하는 것입니다.
 * Design Intent:
 *   - 프론트의 file validation과 동일한 MIME/크기 제약을 서버에서도 강제해 blob/local URL 우회를 막습니다.
 *   - 업로드 URL과 조회 URL 규칙을 한 곳에 고정해 메모리 `photoUrl`이 안정된 worker-served 경로를 가리키게 합니다.
 * Non-Goals:
 *   - 작성자/운영자 권한 강제를 구현하지 않습니다.
 *   - 이미지 리사이즈나 썸네일 생성은 수행하지 않습니다.
 * Dependencies: ./http, ./types
 */

import { HttpError } from './http'
import type { R2Bucket, R2ObjectBody } from './types'

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_CONTENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

function fileExtensionFor(contentType: string): string {
  switch (contentType) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    default:
      return 'bin'
  }
}

function normalizeOwnerSegment(rawOwner: string | null | undefined): string {
  const trimmed = rawOwner?.trim() || 'anonymous'
  return trimmed.replace(/[^a-zA-Z0-9:_-]/g, '-')
}

/**
 * 공개 API: 업로드 대상 이미지 파일을 server-side validation 합니다.
 * 왜 존재하는가: 클라이언트 validation만으로는 MIME/크기 우회를 막을 수 없기 때문입니다.
 * 매개변수:
 * - `file`: multipart에서 추출한 이미지 파일
 * 반환값: 없음
 * 에러 동작: 허용되지 않는 MIME/크기면 400 `HttpError`를 throw 합니다.
 * 제약: 허용 형식은 jpeg/png/webp, 최대 크기는 5MB입니다.
 */
export function assertUploadableImage(file: File): void {
  if (!ALLOWED_CONTENT_TYPES.has(file.type)) {
    throw new HttpError(400, 'invalid_upload_type', 'JPEG, PNG, WEBP 형식의 이미지 파일만 업로드할 수 있습니다.')
  }
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new HttpError(400, 'upload_too_large', '5MB 이하의 이미지 파일만 업로드할 수 있습니다.')
  }
}

/**
 * 공개 API: 업로드된 객체 키를 생성합니다.
 * 왜 존재하는가: user 단위 디렉터리와 확장자 규칙을 일관되게 유지해야 하기 때문입니다.
 * 매개변수:
 * - `ownerId`: 세션 프로필 또는 form-data에서 얻은 사용자 식별자
 * - `contentType`: 파일 MIME 타입
 * 반환값: R2 object key
 * 에러 동작: 없습니다.
 * 제약: owner segment는 안전 문자만 유지합니다.
 */
export function buildUploadObjectKey(ownerId: string | null | undefined, contentType: string): string {
  return `memories/${normalizeOwnerSegment(ownerId)}/${crypto.randomUUID()}.${fileExtensionFor(contentType)}`
}

/**
 * 공개 API: worker-served 업로드 URL을 생성합니다.
 * 왜 존재하는가: 메모리 photoUrl이 R2 public bucket이 아닌 Worker proxy 경로를 가리켜야 하기 때문입니다.
 * 매개변수:
 * - `requestUrl`: 현재 요청 URL
 * - `objectKey`: 저장된 R2 key
 * 반환값: 절대 public URL
 * 에러 동작: 없습니다.
 * 제약: key path segment는 개별적으로 URL encoding 합니다.
 */
export function buildUploadPublicUrl(requestUrl: URL, objectKey: string): string {
  const encodedKey = objectKey
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
  return new URL(`/uploads/${encodedKey}`, requestUrl.origin).toString()
}

/**
 * 공개 API: R2에 이미지 객체를 저장합니다.
 * 왜 존재하는가: handler가 put 옵션과 key 규칙을 직접 다루지 않게 하기 위해 필요합니다.
 * 매개변수:
 * - `bucket`: R2 bucket binding
 * - `objectKey`: 저장할 key
 * - `file`: 업로드할 파일
 * 반환값: 없음
 * 에러 동작: bucket put 실패는 상위 호출자에게 전파됩니다.
 * 제약: contentType을 httpMetadata에 함께 저장합니다.
 */
export async function storeUploadObject(bucket: R2Bucket, objectKey: string, file: File): Promise<void> {
  const bytes = await file.arrayBuffer()
  await bucket.put(objectKey, bytes, {
    httpMetadata: {
      contentType: file.type,
    },
  })
}

/**
 * 공개 API: worker URL path에서 object key를 복원합니다.
 * 왜 존재하는가: `/uploads/<key>` 경로가 R2 key와 직접 연결되기 때문입니다.
 * 매개변수:
 * - `pathname`: 요청 path
 * 반환값: decoded object key
 * 에러 동작: 잘못된 path면 400 `HttpError`를 throw 합니다.
 * 제약: 최소 한 개 이상의 key segment가 필요합니다.
 */
export function decodeUploadPath(pathname: string): string {
  const prefix = '/uploads/'
  if (!pathname.startsWith(prefix) || pathname.length <= prefix.length) {
    throw new HttpError(400, 'invalid_upload_path', `잘못된 업로드 경로입니다: ${pathname}`)
  }
  return pathname
    .slice(prefix.length)
    .split('/')
    .map((segment) => decodeURIComponent(segment))
    .join('/')
}

/**
 * 공개 API: R2 object를 이미지 응답으로 변환합니다.
 * 왜 존재하는가: 메모리 상세에서 업로드된 이미지를 같은 Worker origin으로 재표시해야 하기 때문입니다.
 * 매개변수:
 * - `object`: R2에서 조회한 객체
 * 반환값: 이미지 `Response`
 * 에러 동작: 객체가 없으면 호출자에서 처리해야 합니다.
 * 제약: content type이 없으면 octet-stream으로 강등합니다.
 */
export async function buildUploadResponse(object: R2ObjectBody): Promise<Response> {
  const body = await object.arrayBuffer()
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
