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
    runtimeStatus,
    setDemoPersona,
    signInWithKakao,
    signOut,
  } = useAppContext()

  const kakaoReady = runtimeStatus?.auth.kakaoOAuthConfigured !== false

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
          {isAdmin ? <NavLink to="/admin">운영실</NavLink> : null}
        </nav>

        <div className="header-tools">
          {authMode === 'demo' ? (
            <label className="persona-switch">
              <span>데모 권한</span>
              <select
                aria-label="데모 권한"
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
            <span>{currentUser?.kakaoNickname ?? '비로그인 방문자'}</span>
            <small>{isAdmin ? '운영자' : isApproved ? '승인회원' : currentUser ? '승인대기' : '게스트'}</small>
          </div>

          {authMode === 'cloudflare' ? (
            currentUser ? (
              <button className="secondary-button" onClick={() => void signOut()}>
                로그아웃
              </button>
            ) : (
              <button
                className="primary-button"
                disabled={!kakaoReady}
                onClick={() => void signInWithKakao()}
                title={kakaoReady ? undefined : 'Worker에 Kakao OAuth 시크릿이 아직 설정되지 않았습니다.'}
              >
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
  const { authMode, isLoading, errorMessage, runtimeStatus, currentUser, isApproved, isAdmin } =
    useAppContext()

  if (isLoading) {
    return (
      <div className="shell">
        <div className="notice-card">데이터를 불러오는 중입니다.</div>
      </div>
    )
  }

  if (authMode === 'setup') {
    return (
      <div className="shell">
        <div className="notice-card notice-card--error">
          <strong>배포 설정 필요</strong>
          <p>
            실제 연결 모드로 실행하려면 <code>VITE_CLOUDFLARE_API_URL</code>을 설정해야 합니다.
          </p>
        </div>
      </div>
    )
  }

  if (authMode === 'demo') {
    return (
      <div className="shell">
        <div className="notice-card notice-card--demo">
          <strong>데모 모드</strong>
          <p>로컬 검증용 데모 모드입니다. 헤더에서 권한 상태를 바꿔 승인 흐름과 UI를 확인할 수 있습니다.</p>
        </div>
      </div>
    )
  }

  if (authMode === 'cloudflare' && runtimeStatus && !runtimeStatus.auth.kakaoOAuthConfigured) {
    return (
      <div className="shell">
        <div className="notice-card notice-card--error">
          <strong>카카오 연결 대기 중</strong>
          <p>
            Worker는 배포되었지만 <code>KAKAO_REST_API_KEY</code>와 <code>KAKAO_CLIENT_SECRET</code>이 아직
            설정되지 않았습니다. 공개 읽기와 배포 상태 확인은 가능하지만 로그인은 열리지 않습니다.
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

  if (!currentUser) {
    return (
      <div className="shell">
        <div className="notice-card">
          카카오 로그인과 운영자 승인 절차를 거치면 일정, 메모리, 코멘트를 작성할 수 있습니다.
        </div>
      </div>
    )
  }

  if (!isApproved && !isAdmin) {
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
