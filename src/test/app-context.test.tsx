/* eslint-disable @typescript-eslint/no-explicit-any */
import { act, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { AppProvider, useAppContext } from '../lib/app-context'

function TestConsumer({ onLoad }: { onLoad?: (value: any) => void }) {
  const context = useAppContext()
  onLoad?.(context)

  return (
    <div>
      <span data-testid="persona">{context.demoPersona}</span>
      <span data-testid="user-nickname">{context.currentUser?.kakaoNickname ?? '비로그인'}</span>
      <span data-testid="events-count">{context.events.length}</span>
    </div>
  )
}

describe('AppProvider demo mode', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('loads demo data and switches persona', async () => {
    let contextVal: any = null

    render(
      <AppProvider>
        <TestConsumer onLoad={(ctx) => (contextVal = ctx)} />
      </AppProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('events-count').textContent).toBe('2')
    })

    expect(screen.getByTestId('persona').textContent).toBe('guest')
    expect(screen.getByTestId('user-nickname').textContent).toBe('비로그인')
    expect(contextVal.events).toHaveLength(2)

    await act(async () => {
      contextVal.setDemoPersona('admin')
    })

    expect(screen.getByTestId('persona').textContent).toBe('admin')
    expect(screen.getByTestId('user-nickname').textContent).not.toBe('비로그인')
  })

  it('blocks guest and pending users from creating events', async () => {
    let contextVal: any = null

    render(
      <AppProvider>
        <TestConsumer onLoad={(ctx) => (contextVal = ctx)} />
      </AppProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('events-count').textContent).toBe('2')
    })

    await expect(
      contextVal.createEvent({
        title: '새 모임',
        eventAt: '2026-06-01T12:00',
        location: '강남역',
        what: '모임',
        how: '투표',
        decisionSummary: '요약',
      }),
    ).rejects.toThrow('승인된 사용자만 작성할 수 있습니다.')

    await act(async () => {
      contextVal.setDemoPersona('pending')
    })

    await expect(
      contextVal.createEvent({
        title: '새 모임 2',
        eventAt: '2026-06-01T12:00',
        location: '강남역',
        what: '모임',
        how: '투표',
        decisionSummary: '요약',
      }),
    ).rejects.toThrow('승인된 사용자만 작성할 수 있습니다.')
  })

  it('allows approved members to create events but not delete them', async () => {
    let contextVal: any = null

    render(
      <AppProvider>
        <TestConsumer onLoad={(ctx) => (contextVal = ctx)} />
      </AppProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('events-count').textContent).toBe('2')
    })

    await act(async () => {
      contextVal.setDemoPersona('approved')
    })

    await act(async () => {
      await contextVal.createEvent({
        title: '멤버 생성 일정',
        eventAt: '2026-06-01T12:00',
        location: '한강',
        what: '산책',
        how: '다같이',
        decisionSummary: '요약',
      })
    })

    expect(contextVal.events).toHaveLength(3)
    expect(contextVal.events.find((event: any) => event.title === '멤버 생성 일정')).toBeDefined()

    await expect(contextVal.deleteEvent(contextVal.events[0].id)).rejects.toThrow(
      '운영자만 수행할 수 있습니다.',
    )
  })

  it('blocks non-owners from editing other users events and allows admins to edit/delete', async () => {
    let contextVal: any = null

    render(
      <AppProvider>
        <TestConsumer onLoad={(ctx) => (contextVal = ctx)} />
      </AppProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('events-count').textContent).toBe('2')
    })

    await act(async () => {
      contextVal.setDemoPersona('approved')
    })

    const targetEventId = 'event-spring-seoul'

    await expect(
      contextVal.updateEvent(targetEventId, {
        title: '수정 시도',
        eventAt: '2026-05-18T14:00',
        location: '서울역',
        what: '계획',
        how: '회의',
        decisionSummary: '강행',
      }),
    ).rejects.toThrow('작성자 또는 운영자만 수정할 수 있습니다.')

    await act(async () => {
      contextVal.setDemoPersona('admin')
    })

    await act(async () => {
      await contextVal.updateEvent(targetEventId, {
        title: '운영자 수정 제목',
        eventAt: '2026-05-18T14:00',
        location: '서울역',
        what: '계획',
        how: '회의',
        decisionSummary: '강행',
      })
    })

    expect(contextVal.events.find((event: any) => event.id === targetEventId).title).toBe('운영자 수정 제목')

    await act(async () => {
      await contextVal.deleteEvent(targetEventId)
    })

    expect(contextVal.events).toHaveLength(1)
  })
})
