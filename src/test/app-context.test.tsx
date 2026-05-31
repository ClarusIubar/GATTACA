/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * File: src/test/app-context.test.tsx
 * Purpose: AppProvider 컨텍스트 비즈니스 정책 및 권한 제어 규칙에 대한 고밀도 통합 및 회귀 테스트(Integration/Regression Test)를 제공합니다.
 * Primary Responsibility: 사용자 권한 상태(Guest, Pending, Member, Admin)에 따른 데이터 작성/수정/삭제 접근 제한 규칙을 검증합니다.
 * Design Intent: 
 *   - React Context API의 동작을 테스트용 컴포넌트(TestConsumer)를 활용해 렌더링하고 상태가 의도대로 변경되는지 검증합니다.
 *   - 비승인 상태의 사용자가 악의적이거나 잘못된 호출을 감행했을 때(예: 쓰기 호출 등) 비즈니스 가드 로직이 정상 차단(fail-closed)하는지 회귀 검증합니다.
 * Non-Goals: Supabase 스토리지 파일 업로드 처리 등의 브라우저 API 오작동 검증은 단위 테스트에 위임합니다.
 * Dependencies: react, vitest, src/lib/app-context, src/lib/types
 */

import { render, screen, act, waitFor } from '@testing-library/react'
import { describe, expect, it, beforeEach } from 'vitest'
import { AppProvider, useAppContext } from '../lib/app-context'

// 테스트를 수월하게 유도하기 위해 권한 시뮬레이션용 Consumer 컴포넌트 구현
function TestConsumer({
  onLoad,
}: {
  onLoad?: (value: any) => void
}) {
  const context = useAppContext()

  // 렌더링 시점에 상위 상태 노출
  if (onLoad) {
    onLoad(context)
  }

  return (
    <div>
      <span data-testid="persona">{context.demoPersona}</span>
      <span data-testid="user-nickname">{context.currentUser?.kakaoNickname ?? '비로그인'}</span>
      <span data-testid="events-count">{context.events.length}</span>
    </div>
  )
}

describe('AppProvider Integration & Regression Tests', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('provides default demo initial states and allows switching persona', async () => {
    let contextVal: any = null

    render(
      <AppProvider>
        <TestConsumer
          onLoad={(ctx) => {
            contextVal = ctx
          }}
        />
      </AppProvider>
    )

    // 비동기 초기 데이터 로딩 대기
    await waitFor(() => {
      expect(screen.getByTestId('events-count').textContent).toBe('2')
    })

    expect(screen.getByTestId('persona').textContent).toBe('guest')
    expect(screen.getByTestId('user-nickname').textContent).toBe('비로그인')
    expect(contextVal.events).toHaveLength(2)

    // admin 페르소나로 전환
    await act(async () => {
      contextVal.setDemoPersona('admin')
    })

    expect(screen.getByTestId('persona').textContent).toBe('admin')
    expect(screen.getByTestId('user-nickname').textContent).toBe('기관사')
  })

  it('regression: guest or pending user is blocked from creating an event', async () => {
    let contextVal: any = null

    render(
      <AppProvider>
        <TestConsumer
          onLoad={(ctx) => {
            contextVal = ctx
          }}
        />
      </AppProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('events-count').textContent).toBe('2')
    })

    // 게스트는 이벤트 생성 시 에러가 발생해야 함
    await expect(
      contextVal.createEvent({
        title: '신규 모임',
        eventAt: '2026-06-01T12:00',
        location: '강남역',
        what: '모임',
        how: '도보',
        decisionSummary: '요약',
      })
    ).rejects.toThrow('승인된 사용자만 작성할 수 있습니다.')

    // pending 상태로 전환
    await act(async () => {
      contextVal.setDemoPersona('pending')
    })

    expect(screen.getByTestId('user-nickname').textContent).toBe('승인대기 승객')

    // pending 상태에서도 차단되어야 함
    await expect(
      contextVal.createEvent({
        title: '신규 모임 2',
        eventAt: '2026-06-01T12:00',
        location: '강남역',
        what: '모임',
        how: '도보',
        decisionSummary: '요약',
      })
    ).rejects.toThrow('승인된 사용자만 작성할 수 있습니다.')
  })

  it('regression: approved member can create an event but cannot delete it', async () => {
    let contextVal: any = null

    render(
      <AppProvider>
        <TestConsumer
          onLoad={(ctx) => {
            contextVal = ctx
          }}
        />
      </AppProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('events-count').textContent).toBe('2')
    })

    // 승인회원으로 전환
    await act(async () => {
      contextVal.setDemoPersona('approved')
    })

    expect(contextVal.isApproved).toBe(true)
    expect(contextVal.isAdmin).toBe(false)

    // 이벤트 추가 통과
    await act(async () => {
      await contextVal.createEvent({
        title: '승인회원 작성 모임',
        eventAt: '2026-06-01T12:00',
        location: '홍대',
        what: '놀기',
        how: '대중교통',
        decisionSummary: '신나게 놀기',
      })
    })

    // 정상 추가 확인
    expect(contextVal.events).toHaveLength(3)
    const createdEvent = contextVal.events.find((e: any) => e.title === '승인회원 작성 모임')
    expect(createdEvent).toBeDefined()
    expect(createdEvent.location).toBe('홍대')

    // 그러나 삭제 시도는 운영자 전용이므로 에러 발생(fail-closed)
    await expect(contextVal.deleteEvent(contextVal.events[0].id)).rejects.toThrow(
      '운영자만 수행할 수 있습니다.'
    )
  })

  it('regression: member is blocked from editing other users events, but admin can edit and delete anything', async () => {
    let contextVal: any = null

    render(
      <AppProvider>
        <TestConsumer
          onLoad={(ctx) => {
            contextVal = ctx
          }}
        />
      </AppProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('events-count').textContent).toBe('2')
    })

    // 1. 일반 승인회원으로 전환
    await act(async () => {
      contextVal.setDemoPersona('approved')
    })

    // 타인이 작성한 이벤트 ID ('event-spring-seoul'은 profile-admin이 작성)
    const targetEventId = 'event-spring-seoul'

    // 타인 글 수정 시도 차단 검증
    await expect(
      contextVal.updateEvent(targetEventId, {
        title: '수정 시도',
        eventAt: '2026-05-18T14:00',
        location: '서울숲',
        what: '벚꽃 산책',
        how: '도시락',
        decisionSummary: '강행',
      })
    ).rejects.toThrow('작성자 또는 운영자만 수정할 수 있습니다.')

    // 2. 운영자로 전환
    await act(async () => {
      contextVal.setDemoPersona('admin')
    })

    // 운영자는 타인 이벤트 수정 성공
    await act(async () => {
      await contextVal.updateEvent(targetEventId, {
        title: '운영자가 강제 수정한 제목',
        eventAt: '2026-05-18T14:00',
        location: '서울숲',
        what: '벚꽃 산책',
        how: '도시락',
        decisionSummary: '강행',
      })
    })

    expect(contextVal.events.find((e: any) => e.id === targetEventId).title).toBe(
      '운영자가 강제 수정한 제목'
    )

    // 운영자는 타인 이벤트 삭제 가능
    await act(async () => {
      await contextVal.deleteEvent(targetEventId)
    })

    expect(contextVal.events).toHaveLength(1)
  })
})
