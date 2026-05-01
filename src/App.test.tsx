import { render, screen } from '@testing-library/react'
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
