/**
 * File: src/test/e2e-flow.test.tsx
 * Purpose: 추억열차 모임 관리 및 피드백 대화의 핵심 유저 스나리오 전체를 시뮬레이션하는 종단간(E2E/UI Flow) 테스트를 제공합니다.
 * Primary Responsibility: 약속 개설부터 상세 갤러리 등록, 댓글 추가까지 이어지는 실제 사용자 행동 흐름의 유기적 상호작용 무결성을 검증합니다.
 * Design Intent: 
 *   - React Router DOM의 메모리 기반 라우터(MemoryRouter) 혹은 브라우저 라우터 및 상태 공급자를 전체 조합해 렌더링하고 시나리오를 실행합니다.
 *   - 사용자의 클릭, 타이핑, 페이지 전환(Link 클릭 등)을 완전히 재현하여 실제 상용 배포 환경과 동일한 렌더링 검증 심(Seam)을 구성합니다.
 * Non-Goals: 이미지 파일의 바이너리 압축 및 스토리지 물리 업로드 완료 여부는 이 E2E 흐름의 범위를 벗어납니다.
 * Dependencies: react, @testing-library/react, @testing-library/user-event, vitest, src/App
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, beforeEach } from 'vitest'
import App from '../App'

describe('Memory Train End-to-End User Flow', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.replaceState({}, '', '/')
  })

  it('runs complete user scenario: switch persona -> create event -> view event detail -> add memory -> add comment', async () => {
    render(<App />)

    const user = userEvent.setup()

    // 1. 비로그인 게스트에서 '승인회원'으로 페르소나 전환
    const select = screen.getByLabelText('데모 권한') as HTMLSelectElement
    await user.selectOptions(select, 'approved')

    expect(screen.getByText('차창풍경')).toBeInTheDocument()
    expect(screen.getAllByText('승인회원').length).toBeGreaterThan(0)

    // 2. 헤더 네비게이션에서 '일정 등록' 메뉴 클릭해 SubmitPage 진입
    const submitNavLink = screen.getByRole('link', { name: '일정 등록' })
    await user.click(submitNavLink)

    // SubmitPage 진입 완료 확인
    expect(screen.getByRole('heading', { name: '확정된 일정 등록' })).toBeInTheDocument()

    // 3. 약속 개설 양식 입력 및 개설
    await user.type(screen.getByLabelText('이벤트 제목'), '테스트 E2E 모임 개설')
    await user.type(screen.getByLabelText('언제'), '2026-06-15T18:00')
    await user.type(screen.getByLabelText('어디서'), '가평역')
    await user.type(screen.getByLabelText('무엇을 할지'), '가평 엠티 및 수상 레저')
    await user.type(screen.getByLabelText('어떻게 진행할지'), '회비 5만원 걷어서 펜션 및 마트 장보기')
    await user.type(screen.getByLabelText('결정 요약'), '가평 마트에서 모인 뒤 마트 카트로 장보기 진행')

    const submitBtn = screen.getByRole('button', { name: '이벤트 등록' })
    await user.click(submitBtn)

    // 4. 모임 목록(Timeline) 페이지로 자동 리다이렉트 및 목록에 추가되었는지 확인
    await waitFor(() => {
      expect(screen.getByText('테스트 E2E 모임 개설')).toBeInTheDocument()
    })
    expect(screen.getByText('가평 마트에서 모인 뒤 마트 카트로 장보기 진행')).toBeInTheDocument()

    // 5. 방금 생성한 이벤트의 '상세 기록 보기' 클릭해 상세 페이지 진입
    const detailBtn = screen.getAllByRole('link', { name: '상세 기록 보기' })[0]
    await user.click(detailBtn)

    // 상세 페이지 내 제목 및 기획 의도 노출 확인
    expect(await screen.findByRole('heading', { name: '테스트 E2E 모임 개설' })).toBeInTheDocument()
    expect(screen.getByText('가평 엠티 및 수상 레저')).toBeInTheDocument()

    // 6. 상세 페이지 내 새 메모리(사진갤러리) 등록 시뮬레이션
    await user.type(screen.getByLabelText('메모리 캡션'), '최초의 가평역 단체 사진!')
    await user.type(screen.getByLabelText('기록 시각'), '2026-06-15T18:30')
    await user.type(screen.getByLabelText('또는 사진 URL'), 'https://images.unsplash.com/photo-1501504905252-473c47e087f8')

    const memorySubmitBtn = screen.getByRole('button', { name: '메모리 남기기' })
    await user.click(memorySubmitBtn)

    // 메모리 갤러리 카드 렌더링 확인
    expect(await screen.findByText('최초의 가평역 단체 사진!')).toBeInTheDocument()

    // 7. 등록된 메모리에 코멘트 추가하기 시뮬레이션
    await user.type(screen.getByLabelText('코멘트 남기기'), '이 날 비온다더니 날씨 진짜 좋았어요!')
    const commentSubmitBtn = screen.getByRole('button', { name: '코멘트 추가' })
    await user.click(commentSubmitBtn)

    // 코멘트 리스트 내 정상 표기 확인
    expect(await screen.findByText('이 날 비온다더니 날씨 진짜 좋았어요!')).toBeInTheDocument()
  })
})
