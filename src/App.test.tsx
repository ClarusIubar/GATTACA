import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test } from 'vitest'
import App from './App'

beforeEach(() => {
  localStorage.clear()
  window.history.replaceState({}, '', '/')
})

test('renders demo mode banner when runtime falls back to demo', async () => {
  render(<App />)
  expect(await screen.findByText('데모 모드')).toBeInTheDocument()
})

test('shows home hero content with train concept and operational status', async () => {
  render(<App />)
  expect(await screen.findByRole('heading', { name: '단톡방의 약속을 오래 남는 정거장으로.' })).toBeInTheDocument()
  expect(screen.getByText('Today Status')).toBeInTheDocument()
  expect(screen.getByText('기록 노선도')).toBeInTheDocument()
})

test('renders persona switcher and allows UI switching in header', async () => {
  render(<App />)

  expect(screen.getByText('비로그인 방문자')).toBeInTheDocument()
  expect(screen.getByText('게스트')).toBeInTheDocument()

  const select = screen.getByLabelText('데모 권한') as HTMLSelectElement
  expect(select.value).toBe('guest')

  const user = userEvent.setup()
  await user.selectOptions(select, 'admin')

  expect(screen.getAllByText('운영자').length).toBeGreaterThan(0)
})
