import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../App'

describe('Memory Train end-to-end user flow', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.replaceState({}, '', '/')
  })

  it('creates a station, opens detail, adds a memory, and adds a comment', async () => {
    render(<App />)

    const user = userEvent.setup()

    const select = screen.getByLabelText('데모 권한') as HTMLSelectElement
    await user.selectOptions(select, 'approved')

    expect(screen.getByText('차창풍경')).toBeInTheDocument()
    expect(screen.getAllByText('승인회원').length).toBeGreaterThan(0)

    await user.click(screen.getByRole('link', { name: '일정 등록' }))
    expect(screen.getByRole('heading', { name: '확정된 일정을 정거장으로 등록' })).toBeInTheDocument()

    await user.type(screen.getByLabelText('이벤트 제목'), '테스트 E2E 모임 개설')
    await user.type(screen.getByLabelText('언제'), '2026-06-15T18:00')
    await user.type(screen.getByLabelText('어디서'), '가락역')
    await user.type(screen.getByLabelText('무엇을 할지'), '가벼운 파티와 회상 전시')
    await user.type(screen.getByLabelText('어떻게 진행할지'), '회비 5만원, 각자 사진 한 장 준비')
    await user.type(screen.getByLabelText('확정 요약'), '가락역 근처에서 모여 사진과 이야기를 남기기로 확정')

    await user.click(screen.getByRole('button', { name: '정거장 등록' }))

    await waitFor(() => {
      expect(screen.getByText('테스트 E2E 모임 개설')).toBeInTheDocument()
    })
    expect(screen.getByText('가락역 근처에서 모여 사진과 이야기를 남기기로 확정')).toBeInTheDocument()

    await user.click(screen.getAllByRole('link', { name: '정거장 상세 보기' })[0])

    expect(await screen.findByRole('heading', { name: '테스트 E2E 모임 개설' })).toBeInTheDocument()
    expect(screen.getByText('가벼운 파티와 회상 전시')).toBeInTheDocument()

    await user.type(screen.getByLabelText('메모리 캡션'), '첫 번째 가락역 단체 사진')
    await user.type(screen.getByLabelText('기록 시각'), '2026-06-15T18:30')
    await user.type(screen.getByLabelText('또는 사진 URL'), 'https://images.unsplash.com/photo-1501504905252-473c47e087f8')

    await user.click(screen.getByRole('button', { name: '메모리 남기기' }))

    expect(await screen.findByText('첫 번째 가락역 단체 사진')).toBeInTheDocument()

    await user.type(screen.getByLabelText('코멘트 남기기'), '비 오는 날이라 더 기억에 남아요.')
    await user.click(screen.getByRole('button', { name: '코멘트 추가' }))

    expect(await screen.findByText('비 오는 날이라 더 기억에 남아요.')).toBeInTheDocument()
  })
})
