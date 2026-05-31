/**
 * File: src/lib/file-validation.ts
 * Purpose: 업로드할 파일의 크기 및 MIME 타입을 엄격히 제한하는 유효성 가드 유틸리티입니다.
 * Primary Responsibility: 파일의 MIME 타입(JPEG, PNG, WEBP) 및 파일 용량(5MB 이하)을 정밀 검증하여 보안 및 통신 자원을 보호합니다.
 */

export function validateImageFile(file: File): string | null {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return 'JPEG, PNG, WEBP 형식의 이미지 파일만 업로드할 수 있습니다.'
  }
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    return '5MB 이하의 이미지 파일만 업로드할 수 있습니다.'
  }
  return null
}
