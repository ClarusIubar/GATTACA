import { useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import { useAppContext } from '../lib/app-context'
import { formatDateTime } from '../lib/format'

export function AdminPage() {
  const { events, isAdmin, profiles, updateProfileApproval } = useAppContext()

  const pendingProfiles = useMemo(
    () => profiles.filter((profile) => profile.approvalStatus === 'pending'),
    [profiles],
  )

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return (
    <section className="shell section">
      <div className="section-heading">
        <span className="section-heading__eyebrow">Admin control</span>
        <h2>운영실 대시보드</h2>
        <p>단체방 참여자 승인과 삭제 권한은 운영자 1인이 관리합니다.</p>
      </div>

      <div className="panel-grid">
        <article className="admin-card">
          <h3>승인 대기 사용자</h3>
          <div className="admin-list">
            {pendingProfiles.map((profile) => (
              <div className="panel panel--nested" key={profile.id}>
                <strong>{profile.kakaoNickname}</strong>
                <p className="muted">{profile.authUserId}</p>
                <div className="stack-actions">
                  <button
                    className="primary-button"
                    onClick={() => void updateProfileApproval(profile.id, 'approved')}
                    type="button"
                  >
                    승인
                  </button>
                  <button
                    className="danger-button"
                    onClick={() => void updateProfileApproval(profile.id, 'rejected')}
                    type="button"
                  >
                    반려
                  </button>
                </div>
              </div>
            ))}

            {pendingProfiles.length === 0 ? (
              <div className="empty-card">현재 승인 대기 중인 사용자가 없습니다.</div>
            ) : null}
          </div>
        </article>

        <article className="admin-card">
          <h3>최근 운영 대상 이벤트</h3>
          <div className="admin-list">
            {events.slice(0, 5).map((event) => (
              <div className="panel panel--nested" key={event.id}>
                <strong>{event.title}</strong>
                <p className="muted">{formatDateTime(event.eventAt)}</p>
                <p>{event.decisionSummary}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  )
}
