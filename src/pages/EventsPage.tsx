import { Link } from 'react-router-dom'
import { useAppContext } from '../lib/app-context'
import { formatDateTime } from '../lib/format'
import { resolveProfileName } from '../lib/profile-display'

export function EventsPage() {
  const { comments, events, memories, profiles } = useAppContext()

  return (
    <section className="shell section">
      <div className="section-heading section-heading--split">
        <div>
          <span className="section-heading__eyebrow">Station archive</span>
          <h2>추억열차 정거장 목록</h2>
          <p>결정된 약속을 시간 순서로 정리하고, 각 정거장에 사진과 코멘트를 이어 붙입니다.</p>
        </div>
        <Link className="primary-button" to="/submit">
          새 정거장 등록
        </Link>
      </div>

      <div className="station-timeline" aria-label="추억열차 정거장 타임라인">
        {events.map((event, index) => {
          const eventMemories = memories.filter((memory) => memory.eventId === event.id)
          const commentCount = comments.filter((comment) =>
            eventMemories.some((memory) => memory.id === comment.memoryId),
          ).length
          const authorName = resolveProfileName(event.createdBy, profiles)

          return (
            <article className="station-card station-card--readable" key={event.id}>
              <div className="station-card__index">{String(index + 1).padStart(2, '0')}</div>
              <div className="station-card__body">
                <div className="station-card__topline">
                  <span className="pill">{formatDateTime(event.eventAt)}</span>
                  <span className="station-card__location">{event.location}</span>
                  <span className="station-card__author">등록자 {authorName}</span>
                </div>
                <h3>{event.title}</h3>
                <p className="station-card__summary">{event.decisionSummary}</p>

                <dl className="event-facts" aria-label={`${event.title} 핵심 정보`}>
                  <div>
                    <dt>언제</dt>
                    <dd>{formatDateTime(event.eventAt)}</dd>
                  </div>
                  <div>
                    <dt>어디서</dt>
                    <dd>{event.location}</dd>
                  </div>
                  <div>
                    <dt>누가</dt>
                    <dd>{authorName}</dd>
                  </div>
                  <div>
                    <dt>무엇</dt>
                    <dd>{event.what}</dd>
                  </div>
                  <div>
                    <dt>어떻게</dt>
                    <dd>{event.how}</dd>
                  </div>
                </dl>

                <div className="station-card__footer">
                  <div className="inline-list">
                    <span>메모리 {eventMemories.length}건</span>
                    <span>코멘트 {commentCount}건</span>
                  </div>
                  <Link className="secondary-button" to={`/events/${event.id}`}>
                    정거장 상세 보기
                  </Link>
                </div>
              </div>
            </article>
          )
        })}

        {events.length === 0 ? (
          <div className="empty-card">아직 등록된 정거장이 없습니다. 첫 일정을 기록해 운행을 시작하세요.</div>
        ) : null}
      </div>
    </section>
  )
}
