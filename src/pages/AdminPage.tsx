import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAppContext } from '../lib/app-context'
import { formatDateTime } from '../lib/format'
import { resolveProfileName } from '../lib/profile-display'

export function AdminPage() {
  const {
    comments,
    deleteEvent,
    events,
    isAdmin,
    memories,
    profiles,
    updateProfileApproval,
  } = useAppContext()
  const [feedback, setFeedback] = useState('')

  const pendingProfiles = useMemo(
    () => profiles.filter((profile) => profile.approvalStatus === 'pending'),
    [profiles],
  )

  const rejectedProfiles = useMemo(
    () => profiles.filter((profile) => profile.approvalStatus === 'rejected'),
    [profiles],
  )

  const approvedProfiles = useMemo(
    () => profiles.filter((profile) => profile.approvalStatus === 'approved'),
    [profiles],
  )

  const recentEvents = useMemo(
    () => [...events].sort((left, right) => right.eventAt.localeCompare(left.eventAt)).slice(0, 8),
    [events],
  )

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  async function approveProfile(profileId: string) {
    setFeedback('')
    try {
      await updateProfileApproval(profileId, 'approved')
      setFeedback('사용자를 승인했습니다.')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : '사용자 승인에 실패했습니다.')
    }
  }

  async function rejectProfile(profileId: string) {
    setFeedback('')
    try {
      await updateProfileApproval(profileId, 'rejected')
      setFeedback('사용자를 반려했습니다.')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : '사용자 반려에 실패했습니다.')
    }
  }

  async function removeEvent(eventId: string, title: string) {
    if (!window.confirm(`"${title}" 정거장과 연결된 메모리/코멘트를 삭제할까요?`)) {
      return
    }

    setFeedback('')
    try {
      await deleteEvent(eventId)
      setFeedback('정거장을 삭제했습니다.')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : '정거장 삭제에 실패했습니다.')
    }
  }

  return (
    <section className="shell section">
      <div className="section-heading section-heading--split">
        <div>
          <span className="section-heading__eyebrow">Admin control</span>
          <h2>운영실 대시보드</h2>
          <p>승인 대기자 처리, 이벤트 삭제, 기록 상태 확인, 상세 진입을 한 화면에서 수행합니다.</p>
        </div>
        <Link className="secondary-button" to="/events">
          정거장 목록으로
        </Link>
      </div>

      <div className="admin-stats" aria-label="운영 요약">
        <article className="stat-card">
          <span>승인 대기</span>
          <strong>{pendingProfiles.length}</strong>
          <small>처리 필요</small>
        </article>
        <article className="stat-card">
          <span>승인 회원</span>
          <strong>{approvedProfiles.length}</strong>
          <small>CRU 가능</small>
        </article>
        <article className="stat-card">
          <span>정거장</span>
          <strong>{events.length}</strong>
          <small>운영 대상</small>
        </article>
        <article className="stat-card">
          <span>기록량</span>
          <strong>{memories.length + comments.length}</strong>
          <small>메모리+코멘트</small>
        </article>
      </div>

      {feedback ? <div className="notice-card">{feedback}</div> : null}

      <div className="admin-layout">
        <article className="admin-card">
          <div className="section-heading">
            <span className="section-heading__eyebrow">Access queue</span>
            <h3>승인 대기 사용자</h3>
          </div>
          <div className="admin-list">
            {pendingProfiles.map((profile) => (
              <div className="panel panel--nested admin-user-row" key={profile.id}>
                <img alt="" src={profile.avatarUrl} />
                <div>
                  <strong>{profile.kakaoNickname}</strong>
                  <p className="muted">{profile.authUserId}</p>
                </div>
                <div className="stack-actions">
                  <button className="primary-button" onClick={() => void approveProfile(profile.id)} type="button">
                    승인
                  </button>
                  <button className="danger-button" onClick={() => void rejectProfile(profile.id)} type="button">
                    반려
                  </button>
                </div>
              </div>
            ))}

            {pendingProfiles.length === 0 ? (
              <div className="empty-card">현재 승인 대기 중인 사용자가 없습니다.</div>
            ) : null}
          </div>

          {rejectedProfiles.length > 0 ? (
            <p className="muted">반려된 계정 {rejectedProfiles.length}건은 재승인 정책 결정 전까지 작성 기능이 막힙니다.</p>
          ) : null}
        </article>

        <article className="admin-card">
          <div className="section-heading">
            <span className="section-heading__eyebrow">Event operations</span>
            <h3>운영 대상 정거장</h3>
          </div>
          <div className="admin-list">
            {recentEvents.map((event) => {
              const eventMemories = memories.filter((memory) => memory.eventId === event.id)
              const eventComments = comments.filter((comment) =>
                eventMemories.some((memory) => memory.id === comment.memoryId),
              )

              return (
                <div className="panel panel--nested admin-event-row" key={event.id}>
                  <div className="admin-event-row__main">
                    <strong>{event.title}</strong>
                    <dl className="event-facts event-facts--compact">
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
                        <dd>{resolveProfileName(event.createdBy, profiles)}</dd>
                      </div>
                    </dl>
                    <p>{event.decisionSummary}</p>
                    <p className="muted">
                      메모리 {eventMemories.length}건, 코멘트 {eventComments.length}건
                    </p>
                  </div>
                  <div className="admin-event-row__actions">
                    <Link className="secondary-button" to={`/events/${event.id}`}>
                      상세 진입
                    </Link>
                    <button className="danger-button" onClick={() => void removeEvent(event.id, event.title)} type="button">
                      이벤트 삭제
                    </button>
                  </div>
                </div>
              )
            })}

            {recentEvents.length === 0 ? <div className="empty-card">운영할 정거장이 아직 없습니다.</div> : null}
          </div>
        </article>
      </div>
    </section>
  )
}
