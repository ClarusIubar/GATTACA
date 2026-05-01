import { Link } from 'react-router-dom'
import { useAppContext } from '../lib/app-context'
import { formatDateTime, formatShortDate } from '../lib/format'
import { resolveProfileName } from '../lib/profile-display'

export function HomePage() {
  const { comments, events, memories, profiles } = useAppContext()
  const latestEvents = events.slice(0, 3)

  return (
    <>
      <section className="shell hero">
        <div className="hero__grid">
          <div>
            <span className="hero__eyebrow">Shared memory log</span>
            <h1>함께 정한 하루를, 오래 남는 기록으로.</h1>
            <p>
              추억열차는 단체방에서 정해진 약속을 한 번 더 정성스럽게 보관하는 메모리얼 페이지입니다.
              시간, 장소, 계획, 사진, 코멘트까지 한 칸씩 연결해 지나온 장면을 다시 꺼내볼 수 있게
              만듭니다.
            </p>
            <div className="hero__actions">
              <Link className="primary-button" to="/events">
                기록 둘러보기
              </Link>
              <Link className="secondary-button" to="/submit">
                일정 등록하기
              </Link>
            </div>
          </div>

          <div className="train-panel">
            <strong>기록의 선로</strong>
            <p className="muted">
              카카오톡 단체방에서 정해진 결정은 여기에서 하루의 기록으로 이어집니다.
            </p>
            <div className="train-panel__rail">
              <div className="train-panel__stop">
                <strong>1. 단톡방에서 결정</strong>
                <span>투표와 일정 확정은 기존 대화 흐름 그대로 유지</span>
              </div>
              <div className="train-panel__stop">
                <strong>2. 추억열차에 기록</strong>
                <span>언제, 어디서, 무엇을, 어떻게 할지 요약</span>
              </div>
              <div className="train-panel__stop">
                <strong>3. 사진과 코멘트 보관</strong>
                <span>행사 후 같은 페이지에 추억을 누적</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="shell section">
        <div className="stats">
          <article className="stat-card">
            <small>기록된 이벤트</small>
            <strong>{events.length}</strong>
            <span className="muted">결정된 일정이 시간순으로 남습니다.</span>
          </article>
          <article className="stat-card">
            <small>메모리 장면</small>
            <strong>{memories.length}</strong>
            <span className="muted">사진과 메모가 이벤트와 연결됩니다.</span>
          </article>
          <article className="stat-card">
            <small>대화 흔적</small>
            <strong>{comments.length}</strong>
            <span className="muted">그날의 감정과 후기를 코멘트로 남깁니다.</span>
          </article>
        </div>
      </section>

      <section className="shell section">
        <div className="section-heading">
          <span className="section-heading__eyebrow">Recent stops</span>
          <h2>최근 일정</h2>
          <p>캘린더보다 기록에 집중해, 한 번의 모임이 하나의 이야기로 남도록 구성했습니다.</p>
        </div>

        <div className="timeline">
          {latestEvents.map((event) => (
            <article className="timeline-card" key={event.id}>
              <div className="timeline-card__meta">
                <span className="pill">{formatShortDate(event.eventAt)}</span>
                <span>{event.location}</span>
                <span>등록자: {resolveProfileName(event.createdBy, profiles)}</span>
              </div>
              <h3>{event.title}</h3>
              <p>{event.decisionSummary}</p>
              <div className="stack-actions">
                <span className="muted">{formatDateTime(event.eventAt)}</span>
                <Link className="secondary-button" to={`/events/${event.id}`}>
                  상세 보기
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="shell section">
        <div className="panel-grid">
          <article className="panel">
            <div className="section-heading">
              <span className="section-heading__eyebrow">v1 운영 범위</span>
              <h2>카카오톡 연동은 운영 흐름으로 다룹니다</h2>
            </div>
            <ul className="rail-list">
              <li>단톡방에서 투표와 일정 확정</li>
              <li>운영자 또는 승인 회원이 추억열차에 결과 정리</li>
              <li>행사 후 같은 페이지에 사진과 코멘트 추가</li>
            </ul>
          </article>

          <article className="panel">
            <div className="section-heading">
              <span className="section-heading__eyebrow">Access rule</span>
              <h2>권한은 승인 기반으로 통제합니다</h2>
            </div>
            <ul className="rail-list">
              <li>비로그인 사용자는 기록 열람만 가능</li>
              <li>승인 대기 사용자는 안내 확인 후 대기</li>
              <li>승인 회원은 Create/Update 가능</li>
              <li>운영자는 승인 관리와 삭제 권한 보유</li>
            </ul>
          </article>
        </div>
      </section>

      <div className="footer-space" />
    </>
  )
}
