import { Link } from 'react-router-dom'
import { useAppContext } from '../lib/app-context'
import { formatDateTime, formatShortDate } from '../lib/format'
import { resolveProfileName } from '../lib/profile-display'

export function HomePage() {
  const { authMode, comments, currentUser, events, isAdmin, isApproved, memories, profiles, runtimeStatus } =
    useAppContext()
  const latestEvents = events.slice(0, 3)
  const canWrite = Boolean(currentUser && (isApproved || isAdmin))
  const runtimeReady = authMode === 'cloudflare' && runtimeStatus?.auth.kakaoOAuthConfigured
  const trainStatus = runtimeReady ? '실제 운행 중' : authMode === 'demo' ? '시운전 중' : '설정 점검 중'

  return (
    <>
      <section className="shell hero hero--station" aria-labelledby="home-hero-title">
        <div className="hero__grid">
          <div className="hero__copy">
            <span className="hero__eyebrow">Memory Train No. 305</span>
            <h1 id="home-hero-title">단톡방의 약속을 오래 남는 정거장으로.</h1>
            <p>
              추억열차는 카카오톡 단체방에서 이미 결정된 일정과 그날의 사진, 코멘트를 하나의 노선으로
              묶어 두는 메모리얼 페이지입니다. 캘린더가 아니라 우리가 함께 지나온 날을 다시 꺼내 보는
              기록소입니다.
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
            <div className="departure-board__header">
              <span>오늘의 운행 상태</span>
              <strong>{trainStatus}</strong>
            </div>
            <dl className="departure-board__grid">
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
        </div>
      </section>

      <section className="shell section section--compact" aria-labelledby="route-map-title">
        <div className="route-map">
          <div className="section-heading">
            <span className="section-heading__eyebrow">Route map</span>
            <h2 id="route-map-title">기록 노선도</h2>
            <p>단체방의 결정부터 행사 이후의 사진과 코멘트까지, v1의 실제 운영 경계를 그대로 보여줍니다.</p>
          </div>

          <ol className="route-steps">
            <li>
              <span>01</span>
              <strong>단체방에서 결정</strong>
              <p>투표와 일정 조율은 기존 카카오톡 단체방 흐름을 사용합니다.</p>
            </li>
            <li>
              <span>02</span>
              <strong>추억열차에 확정 기록</strong>
              <p>언제, 어디서, 무엇을, 어떻게 할지 확정 결과만 정리합니다.</p>
            </li>
            <li>
              <span>03</span>
              <strong>그날의 장면 보관</strong>
              <p>사진, 메모, 코멘트를 같은 이벤트 페이지에 이어 붙입니다.</p>
            </li>
            <li>
              <span>04</span>
              <strong>승인 기반 권한 유지</strong>
              <p>단체방 참여자 승인 후 CRU 가능, 삭제는 운영자만 수행합니다.</p>
            </li>
          </ol>
        </div>
      </section>

      <section className="shell section">
        <div className="stats stats--station">
          <article className="stat-card">
            <small>기록된 정거장</small>
            <strong>{events.length}</strong>
            <span className="muted">확정된 일정만 시간 순서로 남깁니다.</span>
          </article>
          <article className="stat-card">
            <small>보관된 장면</small>
            <strong>{memories.length}</strong>
            <span className="muted">사진과 메모가 이벤트에 연결됩니다.</span>
          </article>
          <article className="stat-card">
            <small>이어진 코멘트</small>
            <strong>{comments.length}</strong>
            <span className="muted">그날의 감정과 후기를 대화처럼 남깁니다.</span>
          </article>
        </div>
      </section>

      <section className="shell section">
        <div className="section-heading section-heading--split">
          <div>
            <span className="section-heading__eyebrow">Recent stops</span>
            <h2>최근 도착한 정거장</h2>
            <p>복잡한 월간 캘린더 대신, 각 모임을 하나의 정거장 카드로 보여줍니다.</p>
          </div>
          <Link className="secondary-button" to="/events">
            전체 노선 보기
          </Link>
        </div>

        <div className="station-timeline">
          {latestEvents.map((event, index) => (
            <article className="station-card" key={event.id}>
              <div className="station-card__index">{String(index + 1).padStart(2, '0')}</div>
              <div>
                <div className="timeline-card__meta">
                  <span className="pill">{formatShortDate(event.eventAt)}</span>
                  <span>{event.location}</span>
                  <span>등록자 {resolveProfileName(event.createdBy, profiles)}</span>
                </div>
                <h3>{event.title}</h3>
                <p>{event.decisionSummary}</p>
                <div className="stack-actions">
                  <span className="muted">{formatDateTime(event.eventAt)}</span>
                  <Link className="secondary-button" to={`/events/${event.id}`}>
                    상세 보기
                  </Link>
                </div>
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
            <span className="section-heading__eyebrow">Operations</span>
            <h2>카카오톡은 결정의 장소, 추억열차는 기록의 장소입니다.</h2>
            <p>
              v1은 단체방 API를 무리하게 붙이지 않습니다. 단체방에서 정해진 결과를 운영자가 정리하고,
              승인된 멤버가 그날의 장면을 보태는 흐름에 집중합니다.
            </p>
          </article>

          <article className="panel">
            <span className="section-heading__eyebrow">Access rule</span>
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

      <div className="footer-space" />
    </>
  )
}
