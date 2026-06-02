import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../lib/app-context'
import type { EventInput } from '../lib/types'

const defaultForm: EventInput = {
  title: '',
  eventAt: '',
  location: '',
  what: '',
  how: '',
  decisionSummary: '',
}

const hours = Array.from({ length: 24 }, (_, index) => index.toString().padStart(2, '0'))
const minutes = Array.from({ length: 60 }, (_, index) => index.toString().padStart(2, '0'))

export function SubmitPage() {
  const { createEvent, currentUser, isAdmin, isApproved } = useAppContext()
  const [form, setForm] = useState<EventInput>(defaultForm)
  const [eventDate, setEventDate] = useState('')
  const [eventHour, setEventHour] = useState('')
  const [eventMinute, setEventMinute] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const navigate = useNavigate()

  const canWrite = Boolean(currentUser && (isApproved || isAdmin))

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback('')
    setIsSaving(true)

    try {
      await createEvent({
        ...form,
        eventAt: `${eventDate}T${eventHour}:${eventMinute}`,
      })
      setForm(defaultForm)
      setEventDate('')
      setEventHour('')
      setEventMinute('')
      setFeedback('정거장을 등록했습니다. 상세 페이지에서 사진과 코멘트를 이어갈 수 있습니다.')
      navigate('/events')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : '일정 등록에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="shell section">
      <div className="two-column two-column--submit">
        <article className="panel submit-panel">
          <div className="section-heading">
            <span className="section-heading__eyebrow">New station</span>
            <h2>확정된 일정을 새 정거장으로 등록</h2>
            <p>
              단체방에서 이미 결정된 내용을 기록합니다. 캘린더처럼 모든 후보를 담지 않고, 최종 합의만
              나중에 바로 이해할 수 있게 남깁니다.
            </p>
          </div>

          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="title">이벤트 제목</label>
              <input
                id="title"
                value={form.title}
                onChange={(eventObject) => setForm((current) => ({ ...current, title: eventObject.target.value }))}
                placeholder="예: 봄 산책, 기념 모임"
                required
              />
            </div>

            <div className="form-grid form-grid--two">
              <div className="field">
                <label htmlFor="eventDate">날짜</label>
                <input
                  id="eventDate"
                  type="date"
                  value={eventDate}
                  onChange={(eventObject) => setEventDate(eventObject.target.value)}
                  required
                />
              </div>

              <div className="field">
                <span className="field-label">시간</span>
                <div className="time-select-grid" aria-label="시간 선택">
                  <label className="time-select-field" htmlFor="eventHour">
                    <span>시</span>
                    <select
                      id="eventHour"
                      value={eventHour}
                      onChange={(eventObject) => setEventHour(eventObject.target.value)}
                      required
                    >
                      <option value="">선택</option>
                      {hours.map((hour) => (
                        <option key={hour} value={hour}>
                          {hour}시
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="time-select-field" htmlFor="eventMinute">
                    <span>분</span>
                    <select
                      id="eventMinute"
                      value={eventMinute}
                      onChange={(eventObject) => setEventMinute(eventObject.target.value)}
                      required
                    >
                      <option value="">선택</option>
                      {minutes.map((minute) => (
                        <option key={minute} value={minute}>
                          {minute}분
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </div>

            <div className="field">
              <label htmlFor="location">어디서</label>
              <input
                id="location"
                value={form.location}
                onChange={(eventObject) => setForm((current) => ({ ...current, location: eventObject.target.value }))}
                placeholder="예: 서울숲 3번 출구"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="what">무엇을 할지</label>
              <textarea
                id="what"
                value={form.what}
                onChange={(eventObject) => setForm((current) => ({ ...current, what: eventObject.target.value }))}
                placeholder="이번 모임에서 함께 할 활동을 적어주세요."
                required
              />
            </div>

            <div className="field">
              <label htmlFor="how">어떻게 진행할지</label>
              <textarea
                id="how"
                value={form.how}
                onChange={(eventObject) => setForm((current) => ({ ...current, how: eventObject.target.value }))}
                placeholder="준비물, 집합 방식, 역할 분담, 비용 기준을 적어주세요."
                required
              />
            </div>

            <div className="field">
              <label htmlFor="decisionSummary">확정 요약</label>
              <textarea
                id="decisionSummary"
                value={form.decisionSummary}
                onChange={(eventObject) =>
                  setForm((current) => ({ ...current, decisionSummary: eventObject.target.value }))
                }
                placeholder="단체방에서 최종 확정된 내용을 한 문단으로 요약합니다."
                required
              />
            </div>

            {feedback ? <div className="notice-card">{feedback}</div> : null}

            <div className="stack-actions">
              <button className="primary-button" disabled={!canWrite || isSaving} type="submit">
                {isSaving ? '등록 중...' : '정거장 등록'}
              </button>
              {!canWrite ? <span className="muted">승인된 사용자만 새 정거장을 등록할 수 있습니다.</span> : null}
            </div>
          </form>
        </article>

        <aside className="panel submit-guide">
          <div className="section-heading">
            <span className="section-heading__eyebrow">Checklist</span>
            <h2>등록 전에 확인할 것</h2>
          </div>
          <ul className="rail-list">
            <li>단체방 투표와 일정 조율이 끝난 최종안인지 확인합니다.</li>
            <li>장소와 시간은 나중에 봐도 오해 없을 정도로 구체적으로 씁니다.</li>
            <li>무엇을 하고 어떻게 진행할지 분리해서 적습니다.</li>
            <li>사진과 코멘트는 정거장 상세 페이지에서 이어서 남깁니다.</li>
          </ul>
          <p className="muted">현재 계정 상태: {canWrite ? '일정 등록 가능' : currentUser ? '승인 대기' : '비로그인'}</p>
        </aside>
      </div>
    </section>
  )
}
