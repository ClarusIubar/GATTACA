import { Link } from 'react-router-dom'
import { useAppContext } from '../lib/app-context'
import { formatDateTime } from '../lib/format'
import { resolveProfileName } from '../lib/profile-display'

export function EventsPage() {
  const { comments, events, memories, profiles } = useAppContext()

  return (
    <section className="shell section">
      <div className="section-heading">
        <span className="section-heading__eyebrow">Timeline</span>
        <h2>이벤트 기록 목록</h2>
        <p>단체방에서 결정된 일정이 시간순으로 쌓이며, 이후 사진과 코멘트가 이어집니다.</p>
      </div>

      <div className="timeline">
        {events.map((event) => {
          const memoryCount = memories.filter((memory) => memory.eventId === event.id).length
          const commentCount = comments.filter((comment) =>
            memories.some((memory) => memory.id === comment.memoryId && memory.eventId === event.id),
          ).length

          return (
            <article className="timeline-card" key={event.id}>
              <div className="timeline-card__meta">
                <span className="pill">{formatDateTime(event.eventAt)}</span>
                <span>{event.location}</span>
                <span>등록자: {resolveProfileName(event.createdBy, profiles)}</span>
              </div>
              <h3>{event.title}</h3>
              <p>{event.decisionSummary}</p>
              <div className="inline-list">
                <span>메모리 {memoryCount}건</span>
                <span>코멘트 {commentCount}건</span>
                <span>무엇을: {event.what}</span>
              </div>
              <div className="stack-actions">
                <Link className="secondary-button" to={`/events/${event.id}`}>
                  상세 기록 보기
                </Link>
              </div>
            </article>
          )
        })}

        {events.length === 0 ? (
          <div className="empty-card">아직 기록된 이벤트가 없습니다. 첫 일정을 등록해보세요.</div>
        ) : null}
      </div>
    </section>
  )
}
