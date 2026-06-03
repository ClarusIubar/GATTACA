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

test('renders persona switcher and allows UI switching in header', async () => {
  render(<App />)

  expect(screen.getByText('비로그인 방문자')).toBeInTheDocument()
  expect(screen.getByText('게스트')).toBeInTheDocument()

  const select = screen.getByLabelText('데모 권한') as HTMLSelectElement
  expect(select.value).toBe('guest')

  const user = userEvent.setup()
  await user.selectOptions(select, 'admin')

  expect(screen.getAllByText('운영자').length).toBeGreaterThan(0)
  expect(screen.getByRole('link', { name: '운영실' })).toBeInTheDocument()
  const removedNavName = `${'운영'} ${'원칙'}`
  expect(screen.queryByRole('link', { name: removedNavName })).not.toBeInTheDocument()
})

test('admin dashboard exposes meaningful operations actions', async () => {
  render(<App />)

  const user = userEvent.setup()
  await user.selectOptions(screen.getByLabelText('데모 권한'), 'admin')
  await user.click(screen.getByRole('link', { name: '운영실' }))

  expect(await screen.findByRole('heading', { name: '운영실 대시보드' })).toBeInTheDocument()
  expect(screen.getByLabelText('운영 요약')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '승인' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '반려' })).toBeInTheDocument()
  expect(screen.getAllByRole('button', { name: '이벤트 삭제' }).length).toBeGreaterThan(0)
  expect(screen.getAllByRole('link', { name: '상세 진입' }).length).toBeGreaterThan(0)
})
