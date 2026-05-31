import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import { AppProvider, useAppContext } from './lib/app-context'
import { AboutPage } from './pages/AboutPage'
import { AdminPage } from './pages/AdminPage'
import { EventDetailPage } from './pages/EventDetailPage'
import { EventsPage } from './pages/EventsPage'
import { HomePage } from './pages/HomePage'
import { SubmitPage } from './pages/SubmitPage'

function Header() {
  const {
    authMode,
    currentUser,
    demoPersona,
    isAdmin,
    isApproved,
    setDemoPersona,
    signInWithKakao,
    signOut,
  } = useAppContext()

  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <NavLink className="brand" to="/">
          <span className="brand__mark">MT</span>
          <span>
            <strong>추억열차</strong>
            <small>Memory Train</small>
          </span>
        </NavLink>

        <nav className="site-nav" aria-label="주요 메뉴">
          <NavLink to="/events">기록 목록</NavLink>
          <NavLink to="/submit">일정 등록</NavLink>
          <NavLink to="/about">운영 원칙</NavLink>
          {isAdmin ? <NavLink to="/admin">운영자</NavLink> : null}
        </nav>

        <div className="header-tools">
          {authMode === 'demo' ? (
            <label className="persona-switch">
              <span>데모 권한</span>
              <select
                value={demoPersona}
                onChange={(event) => {
                  setDemoPersona(event.target.value as typeof demoPersona)
                }}
              >
                <option value="guest">방문자</option>
                <option value="pending">승인대기</option>
                <option value="approved">승인회원</option>
                <option value="admin">운영자</option>
              </select>
            </label>
          ) : null}

          <div className="auth-chip">
            <span>{currentUser?.kakaoNickname ?? '비로그인 승객'}</span>
            <small>
              {isAdmin ? '운영자' : isApproved ? '승인회원' : currentUser ? '승인대기' : '게스트'}
            </small>
          </div>

          {authMode === 'cloudflare' ? (
            currentUser ? (
              <button className="secondary-button" onClick={() => void signOut()}>
                로그아웃
              </button>
            ) : (
              <button className="primary-button" onClick={() => void signInWithKakao()}>
                카카오 로그인
              </button>
            )
          ) : null}
        </div>
      </div>
    </header>
  )
}

function StatusBanner() {
  const { authMode, isConfigured, isLoading, errorMessage, currentUser, isApproved, isAdmin } =
    useAppContext()

  if (isLoading) {
    return (
      <div className="shell">
        <div className="notice-card">데이터를 불러오는 중입니다.</div>
      </div>
    )
  }

  if (!isConfigured) {
    return (
      <div className="shell">
        <div className="notice-card notice-card--demo">
          <strong>데모 모드</strong>
          <p>
            백엔드 API 설정이 없어 읽기 중심 데모 모드로 실행 중입니다. 헤더에서 권한 상태를
            바꾸며 승인 흐름을 검증할 수 있습니다.
          </p>
        </div>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="shell">
        <div className="notice-card notice-card--error">{errorMessage}</div>
      </div>
    )
  }

  if (authMode === 'cloudflare' && !currentUser) {
    return (
      <div className="shell">
        <div className="notice-card">
          카카오 로그인 후 승인 절차를 거치면 일정, 메모리, 코멘트를 남길 수 있습니다.
        </div>
      </div>
    )
  }

  if (currentUser && !isApproved && !isAdmin) {
    return (
      <div className="shell">
        <div className="notice-card">
          승인 대기 중입니다. 운영자가 단체방 참여 여부를 확인하면 작성 기능이 열립니다.
        </div>
      </div>
    )
  }

  return null
}

function AppShell() {
  return (
    <>
      <Header />
      <StatusBanner />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:eventId" element={<EventDetailPage />} />
          <Route path="/submit" element={<SubmitPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </main>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </BrowserRouter>
  )
}
