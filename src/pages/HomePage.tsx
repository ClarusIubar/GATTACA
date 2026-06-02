/*
 * File: src/pages/HomePage.tsx
 * Purpose: Present the Memory Train landing page as an implementation-ready desktop and mobile web layout.
 * Primary Responsibility: Explain the product concept, live status, route flow, recent stations, and access rules.
 * Design Intent: Translate the Figma desktop/mobile direction into resilient React markup that can collapse cleanly on phones.
 * Non-Goals: This page does not perform writes, approvals, or direct Worker/Kakao calls.
 * Dependencies: AppContext data, React Router links, date/profile formatting helpers.
 */
import { Link } from 'react-router-dom'
import { useAppContext } from '../lib/app-context'
import { formatDateTime, formatShortDate } from '../lib/format'

export function HomePage() {
  const { authMode, comments, currentUser, events, isAdmin, isApproved, memories, runtimeStatus } = useAppContext()
  const latestEvents = events.slice(0, 3)
  const canWrite = Boolean(currentUser && (isApproved || isAdmin))
  const runtimeReady = authMode === 'cloudflare' && runtimeStatus?.auth.kakaoOAuthConfigured
  const trainStatus = runtimeReady ? '실제 운행 중' : authMode === 'demo' ? '시운전 중' : '설정 점검 중'

  return (
    <>
      <section className="shell hero hero--responsive" aria-labelledby="home-hero-title">
        <div className="hero__copy">
          <span className="eyebrow">Memory Train No. 305</span>
          <h1 id="home-hero-title">단톡방의 약속을 오래 남는 정거장으로.</h1>
          <p>
            투표와 조율은 단체방에서 끝내고, 추억열차에는 확정된 일정과 그날의 사진, 코멘트를 남깁니다.
            복잡한 캘린더가 아니라 오래 꺼내 보는 기록소입니다.
          </p>
          <div className="hero__actions">
            <Link className="primary-button" to="/events">
              정거장 둘러보기
            </Link>
            <Link className="secondary-button" to="/submit">
              새 일정 기록
            </Link>
          </div>
        </div>

        <aside className="departure-board" aria-label="오늘의 운행 상태">
          <span className="board-label">Today Status</span>
          <strong>{trainStatus}</strong>
          <dl>
            <div>
              <dt>접근</dt>
              <dd>{canWrite ? '기록 가능' : currentUser ? '승인 대기' : '읽기 가능'}</dd>
            </div>
            <div>
              <dt>백엔드</dt>
              <dd>{authMode === 'cloudflare' ? 'Worker 연결' : authMode === 'demo' ? 'Demo seam' : '설정 필요'}</dd>
            </div>
            <div>
              <dt>Kakao</dt>
              <dd>{runtimeReady ? 'OAuth 준비' : '상태 표시'}</dd>
            </div>
            <div>
              <dt>기록</dt>
              <dd>{events.length}개 정거장</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="shell section" aria-labelledby="route-title">
        <div className="route-panel">
          <div>
            <span className="eyebrow">Route Map</span>
            <h2 id="route-title">기록 노선도</h2>
          </div>
          <ol className="route-steps">
            <li>
              <span>01</span>
              <strong>단체방 결정</strong>
              <p>투표와 일정 조율은 기존 카카오톡 단체방 흐름을 사용합니다.</p>
            </li>
            <li>
              <span>02</span>
              <strong>확정 기록</strong>
              <p>언제, 어디서, 무엇을, 어떻게 할지 최종 결과만 남깁니다.</p>
            </li>
            <li>
              <span>03</span>
              <strong>장면 보관</strong>
              <p>사진, 메모리 캡션, 코멘트를 같은 정거장에 이어 붙입니다.</p>
            </li>
            <li>
              <span>04</span>
              <strong>승인 통제</strong>
              <p>승인 사용자는 CRU, 삭제와 승인은 운영자만 수행합니다.</p>
            </li>
          </ol>
        </div>
      </section>

      <section className="shell section">
        <div className="stats stats--station">
          <article className="stat-card">
            <small>기록된 정거장</small>
            <strong>{events.length}</strong>
            <span>확정된 일정만 시간 순서로 남깁니다.</span>
          </article>
          <article className="stat-card">
            <small>보관된 장면</small>
            <strong>{memories.length}</strong>
            <span>사진과 메모가 이벤트에 연결됩니다.</span>
          </article>
          <article className="stat-card">
            <small>이어진 코멘트</small>
            <strong>{comments.length}</strong>
            <span>그날의 감정과 공기를 대화처럼 남깁니다.</span>
          </article>
        </div>
      </section>

      <section className="shell section">
        <div className="section-heading section-heading--split">
          <div>
            <span className="eyebrow">Recent Stops</span>
            <h2>최근 도착한 정거장</h2>
            <p>월간 달력 대신 각 모임을 하나의 승차권 카드로 보여줍니다.</p>
          </div>
          <Link className="secondary-button" to="/events">
            전체 노선 보기
          </Link>
        </div>

        <div className="ticket-grid">
          {latestEvents.map((event) => (
            <article className="ticket-card" key={event.id}>
              <span className="ticket-card__meta">
                {formatShortDate(event.eventAt)} / {event.location}
              </span>
              <h3>{event.title}</h3>
              <p>{event.decisionSummary}</p>
              <div className="ticket-card__footer">
                <span>{formatDateTime(event.eventAt)}</span>
                <Link to={`/events/${event.id}`}>상세 보기</Link>
              </div>
            </article>
          ))}

          {latestEvents.length === 0 ? (
            <div className="empty-card">아직 도착한 정거장이 없습니다. 첫 일정을 기록해 노선을 시작하세요.</div>
          ) : null}
        </div>
      </section>

      <section className="shell section">
        <div className="operations-grid">
          <article className="panel panel--dark">
            <span className="eyebrow">Operations</span>
            <h2>카카오톡은 결정 장소, 추억열차는 기록 장소입니다.</h2>
            <p>
              v1은 단체방 API를 억지로 붙이지 않습니다. 단체방에서 정해진 결과를 운영자가 정리하고,
              승인된 멤버가 그날의 장면을 보태는 흐름에 집중합니다.
            </p>
          </article>

          <article className="panel">
            <span className="eyebrow">Access Rule</span>
            <h2>권한은 승인 기반으로 통제합니다.</h2>
            <ul className="rail-list">
              <li>비로그인 사용자는 공개 기록만 볼 수 있습니다.</li>
              <li>승인 대기 사용자는 작성 기능을 사용할 수 없습니다.</li>
              <li>승인 회원은 일정, 사진, 코멘트를 만들고 수정할 수 있습니다.</li>
              <li>삭제와 승인 관리는 운영자만 수행합니다.</li>
            </ul>
          </article>
        </div>
      </section>
    </>
  )
}
