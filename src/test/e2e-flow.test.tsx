import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../App'

describe('Memory Train end-to-end user flow', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.replaceState({}, '', '/')
  })

  it('creates a station with separate date/time selects, adds a memory, and adds a comment', async () => {
    render(<App />)

    const user = userEvent.setup()

    await user.selectOptions(screen.getByLabelText('데모 권한'), 'approved')

    expect(screen.getAllByText('승인회원').length).toBeGreaterThan(0)
    expect(document.querySelector(`input[type="${'datetime'}-${'local'}"]`)).toBeNull()
    expect(document.querySelector(`input[type="${'time'}"]`)).toBeNull()

    await user.click(screen.getByRole('link', { name: '일정 등록' }))
    expect(screen.getByRole('heading', { name: '확정된 일정을 새 정거장으로 등록' })).toBeInTheDocument()

    await user.type(screen.getByLabelText('이벤트 제목'), '테스트 E2E 모임 개설')
    await user.type(screen.getByLabelText('날짜'), '2026-06-15')
    await user.selectOptions(screen.getByLabelText('시'), '18')
    await user.selectOptions(screen.getByLabelText('분'), '00')
    await user.type(screen.getByLabelText('어디서'), '강남역')
    await user.type(screen.getByLabelText('무엇을 할지'), '가벼운 티타임과 사진 전시')
    await user.type(screen.getByLabelText('어떻게 진행할지'), '회비 5만원, 각자 사진 1장 준비')
    await user.type(screen.getByLabelText('확정 요약'), '강남역 근처에서 모여 사진과 이야기를 남기기로 확정')

    await user.click(screen.getByRole('button', { name: '정거장 등록' }))

    await waitFor(() => {
      expect(screen.getByText('테스트 E2E 모임 개설')).toBeInTheDocument()
    })
    expect(screen.getByText('강남역 근처에서 모여 사진과 이야기를 남기기로 확정')).toBeInTheDocument()
    expect(screen.getAllByText('언제').length).toBeGreaterThan(0)
    expect(screen.getAllByText('누가').length).toBeGreaterThan(0)
    expect(screen.getAllByText('어떻게').length).toBeGreaterThan(0)

    await user.click(screen.getAllByRole('link', { name: '정거장 상세 보기' })[0])

    expect(await screen.findByRole('heading', { name: '테스트 E2E 모임 개설' })).toBeInTheDocument()
    expect(screen.getByText('가벼운 티타임과 사진 전시')).toBeInTheDocument()
    expect(document.querySelector(`input[type="${'datetime'}-${'local'}"]`)).toBeNull()
    expect(document.querySelector(`input[type="${'time'}"]`)).toBeNull()

    await user.type(screen.getByLabelText('메모리 캡션'), '첫 번째 강남 단체 사진')
    await user.type(screen.getByLabelText('기록 날짜'), '2026-06-15')
    await user.selectOptions(screen.getByLabelText('기록 시'), '18')
    await user.selectOptions(screen.getByLabelText('기록 분'), '30')
    await user.click(screen.getByRole('button', { name: '메모리 남기기' }))

    expect(await screen.findByText('첫 번째 강남 단체 사진')).toBeInTheDocument()

    await user.type(screen.getByLabelText('코멘트 남기기'), '비 오던 날이라 더 기억에 남았다')
    await user.click(screen.getByRole('button', { name: '코멘트 추가' }))

    expect(await screen.findByText('비 오던 날이라 더 기억에 남았다')).toBeInTheDocument()
  })
})
