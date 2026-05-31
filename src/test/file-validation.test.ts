/**
 * File: src/test/file-validation.test.ts
 * Purpose: file-validation 유틸리티의 이미지 파일 크기 및 포맷 검증 가드 로직을 철저히 검증하는 단위 테스트(Unit Test)를 제공합니다.
 * Primary Responsibility: 허용 포맷/용량 경계 조건 및 비허용 파일 유입 시 안전하게 차단(fail-closed)하는 비즈니스 정책을 입증합니다.
 */

import { describe, expect, it } from 'vitest'
import { validateImageFile } from '../lib/file-validation'

describe('Image File Validation Unit Tests', () => {
  // 모의 File 클래스를 수월하게 시뮬레이션하기 위해 가상 File 객체 팩토리 구현
  function createMockFile(name: string, size: number, type: string): File {
    const file = new File([''], name, { type })
    Object.defineProperty(file, 'size', { value: size, writable: false })
    return file
  }

  it('allows JPEG, PNG, WEBP files under 5MB', () => {
    const jpegFile = createMockFile('test.jpg', 2 * 1024 * 1024, 'image/jpeg')
    const pngFile = createMockFile('test.png', 4.9 * 1024 * 1024, 'image/png')
    const webpFile = createMockFile('test.webp', 1024, 'image/webp')

    expect(validateImageFile(jpegFile)).toBeNull()
    expect(validateImageFile(pngFile)).toBeNull()
    expect(validateImageFile(webpFile)).toBeNull()
  })

  it('blocks files with unsupported mime types (fail-closed)', () => {
    const gifFile = createMockFile('test.gif', 1024, 'image/gif')
    const txtFile = createMockFile('test.txt', 1024, 'text/plain')
    const exeFile = createMockFile('malicious.exe', 2048, 'application/x-msdownload')

    expect(validateImageFile(gifFile)).toBe('JPEG, PNG, WEBP 형식의 이미지 파일만 업로드할 수 있습니다.')
    expect(validateImageFile(txtFile)).toBe('JPEG, PNG, WEBP 형식의 이미지 파일만 업로드할 수 있습니다.')
    expect(validateImageFile(exeFile)).toBe('JPEG, PNG, WEBP 형식의 이미지 파일만 업로드할 수 있습니다.')
  })

  it('blocks files exceeding 5MB size limit (fail-closed)', () => {
    const largeJpeg = createMockFile('huge.jpg', 5 * 1024 * 1024 + 1, 'image/jpeg')
    const exactLimit = createMockFile('limit.png', 5 * 1024 * 1024, 'image/png')

    expect(validateImageFile(largeJpeg)).toBe('5MB 이하의 이미지 파일만 업로드할 수 있습니다.')
    expect(validateImageFile(exactLimit)).toBeNull() // 5MB 경계 조건은 정확히 통과해야 함
  })
})
