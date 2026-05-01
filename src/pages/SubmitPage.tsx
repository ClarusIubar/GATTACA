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

export function SubmitPage() {
  const { createEvent, currentUser, isAdmin, isApproved } = useAppContext()
  const [form, setForm] = useState<EventInput>(defaultForm)
  const [feedback, setFeedback] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const navigate = useNavigate()

  const canWrite = Boolean(currentUser && (isApproved || isAdmin))

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback('')
    setIsSaving(true)

    try {
      await createEvent(form)
      setForm(defaultForm)
      setFeedback('이벤트가 등록되었습니다. 상세 페이지에서 추억 기록을 이어갈 수 있습니다.')
      navigate('/events')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : '일정 등록에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="shell section">
      <div className="two-column">
        <article className="panel">
          <div className="section-heading">
            <span className="section-heading__eyebrow">Schedule log</span>
            <h2>확정된 일정 등록</h2>
            <p>캘린더 대신 하나의 기록 카드로 남깁니다. 무엇을, 어디서, 어떻게 할지 분명히 적어주세요.</p>
          </div>

          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="title">이벤트 제목</label>
              <input
                id="title"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="예: 봄 소풍, 기념일 모임"
                required
              />
            </div>

            <div className="form-grid form-grid--two">
              <div className="field">
                <label htmlFor="eventAt">언제</label>
                <input
                  id="eventAt"
                  type="datetime-local"
                  value={form.eventAt}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, eventAt: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="location">어디서</label>
                <input
                  id="location"
                  value={form.location}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, location: event.target.value }))
                  }
                  placeholder="예: 서울숲 3번 출구"
                  required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="what">무엇을 할지</label>
              <textarea
                id="what"
                value={form.what}
                onChange={(event) => setForm((current) => ({ ...current, what: event.target.value }))}
                placeholder="이번 모임에서 할 핵심 활동을 적어주세요."
                required
              />
            </div>

            <div className="field">
              <label htmlFor="how">어떻게 진행할지</label>
              <textarea
                id="how"
                value={form.how}
                onChange={(event) => setForm((current) => ({ ...current, how: event.target.value }))}
                placeholder="준비물, 집합 방식, 역할 분담 등을 적어주세요."
                required
              />
            </div>

            <div className="field">
              <label htmlFor="decisionSummary">결정 요약</label>
              <textarea
                id="decisionSummary"
                value={form.decisionSummary}
                onChange={(event) =>
                  setForm((current) => ({ ...current, decisionSummary: event.target.value }))
                }
                placeholder="단톡방에서 최종 확정된 내용을 한 문단으로 요약해주세요."
                required
              />
            </div>

            {feedback ? <div className="notice-card">{feedback}</div> : null}

            <div className="stack-actions">
              <button className="primary-button" disabled={!canWrite || isSaving} type="submit">
                {isSaving ? '등록 중...' : '이벤트 등록'}
              </button>
            </div>
          </form>
        </article>

        <aside className="panel">
          <div className="section-heading">
            <span className="section-heading__eyebrow">작성 규칙</span>
            <h2>이 페이지가 기록하는 것</h2>
          </div>
          <ul className="rail-list">
            <li>카카오톡 단체방에서 이미 결정된 일정</li>
            <li>운영자가 추후에도 이해할 수 있는 요약 문장</li>
            <li>당일 메모리와 코멘트가 이어질 수 있는 맥락</li>
          </ul>
          <p className="muted">
            {canWrite
              ? '현재 계정은 일정 등록 권한을 가지고 있습니다.'
              : '승인된 사용자만 일정을 등록할 수 있습니다.'}
          </p>
        </aside>
      </div>
    </section>
  )
}
