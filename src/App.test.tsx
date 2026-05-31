/**
 * File: src/App.test.tsx
 * Purpose: 전체 애플리케이션에 대한 UI 초기화 스모크 테스트(Smoke Test) 및 사용자 인터페이스 무결성 검증을 제공합니다.
 * Primary Responsibility: 기본 데모 폴백, 홈 메인 영역 노출 및 헤더의 페르소나 전환 UI가 오류 없이 정상 연동되는지 검증합니다.
 * Design Intent: 
 *   - React Testing Library와 user-event 모듈을 사용하여 사용자가 데모 권한을 전환할 때 헤더의 닉네임과 권한 배지가 올바르게 실시간 연동 업데이트되는지 시뮬레이션 테스트합니다.
 * Non-Goals: 개별 페이지의 내부 심화 로직(약속 폼 검증 등)은 E2E 혹은 통합 테스트에 위임합니다.
 * Dependencies: react, @testing-library/react, @testing-library/user-event, vitest, src/App
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test } from 'vitest'
import App from './App'

beforeEach(() => {
  localStorage.clear()
  window.history.replaceState({}, '', '/')
})

test('renders demo mode banner when supabase env is missing', async () => {
  render(<App />)
  expect(await screen.findByText('데모 모드')).toBeInTheDocument()
})

test('shows home hero content', async () => {
  render(<App />)
  expect(await screen.findByText('함께 정한 하루를, 오래 남는 기록으로.')).toBeInTheDocument()
})

test('renders persona switcher and allows UI switching in header', async () => {
  render(<App />)

  // 초기 상태는 비로그인 / 게스트 확인
  expect(screen.getByText('비로그인 승객')).toBeInTheDocument()
  expect(screen.getByText('게스트')).toBeInTheDocument()

  // 페르소나 셀렉트 노출 확인
  const select = screen.getByLabelText('데모 권한') as HTMLSelectElement
  expect(select).toBeInTheDocument()
  expect(select.value).toBe('guest')

  // '운영자'로 변경 시뮬레이션
  const user = userEvent.setup()
  await user.selectOptions(select, 'admin')

  // UI 실시간 렌더링 업데이트 확인
  expect(screen.getByText('기관사')).toBeInTheDocument()
  expect(screen.getAllByText('운영자').length).toBeGreaterThan(0)
})
