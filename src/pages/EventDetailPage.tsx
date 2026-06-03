import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAppContext } from '../lib/app-context'
import { validateImageFile } from '../lib/file-validation'
import { formatDateTime } from '../lib/format'
import { resolveProfileAvatar, resolveProfileName } from '../lib/profile-display'
import type { CommentInput, EventInput, MemoryInput } from '../lib/types'

const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='640' height='420' viewBox='0 0 640 420'><rect width='640' height='420' fill='%23f6efe3'/><circle cx='500' cy='90' r='54' fill='%23d8542f' opacity='0.2'/><path d='M80 285h480' stroke='%23221c16' stroke-width='10' stroke-linecap='round'/><text x='50%25' y='48%25' dominant-baseline='middle' text-anchor='middle' font-family='serif' font-size='24' fill='%236a5445'>Memory Train</text></svg>"

const hours = Array.from({ length: 24 }, (_, index) => index.toString().padStart(2, '0'))
const minutes = Array.from({ length: 60 }, (_, index) => index.toString().padStart(2, '0'))

const createMemoryForm = (eventId: string): MemoryInput => ({
  eventId,
  caption: '',
  recordedAt: '',
})

function splitDateTime(value: string) {
  const [date = '', time = ''] = value.split('T')
  const [hour = '', minute = ''] = time.split(':')
  return { date, hour, minute }
}

function composeDateTime(date: string, hour: string, minute: string) {
  if (!date && !hour && !minute) {
    return ''
  }
  return `${date}T${hour}:${minute}`
}

interface DateTimeSelectProps {
  idPrefix: string
  value: string
  onChange: (nextValue: string) => void
  dateLabel: string
  hourLabel: string
  minuteLabel: string
  required?: boolean
}

function DateTimeSelect({
  idPrefix,
  value,
  onChange,
  dateLabel,
  hourLabel,
  minuteLabel,
  required = false,
}: DateTimeSelectProps) {
  const { date, hour, minute } = splitDateTime(value)

  return (
    <div className="datetime-select-grid">
      <label className="field" htmlFor={`${idPrefix}-date`}>
        <span>{dateLabel}</span>
        <input
          id={`${idPrefix}-date`}
          type="date"
          value={date}
          onChange={(eventObject) => onChange(composeDateTime(eventObject.target.value, hour, minute))}
          required={required}
        />
      </label>
      <label className="time-select-field" htmlFor={`${idPrefix}-hour`}>
        <span>{hourLabel}</span>
        <select
          id={`${idPrefix}-hour`}
          value={hour}
          onChange={(eventObject) => onChange(composeDateTime(date, eventObject.target.value, minute))}
          required={required}
        >
          <option value="">선택</option>
          {hours.map((hourValue) => (
            <option key={hourValue} value={hourValue}>
              {hourValue}시
            </option>
          ))}
        </select>
      </label>
      <label className="time-select-field" htmlFor={`${idPrefix}-minute`}>
        <span>{minuteLabel}</span>
        <select
          id={`${idPrefix}-minute`}
          value={minute}
          onChange={(eventObject) => onChange(composeDateTime(date, hour, eventObject.target.value))}
          required={required}
        >
          <option value="">선택</option>
          {minutes.map((minuteValue) => (
            <option key={minuteValue} value={minuteValue}>
              {minuteValue}분
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

export function EventDetailPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const {
    comments,
    createComment,
    createMemory,
    currentUser,
    deleteComment,
    deleteEvent,
    deleteMemory,
    events,
    isAdmin,
    isApproved,
    memories,
    profiles,
    updateComment,
    updateEvent,
    updateMemory,
  } = useAppContext()

  const eventRecord = events.find((item) => item.id === eventId)
  const [feedback, setFeedback] = useState('')
  const [editingEvent, setEditingEvent] = useState(false)
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [memoryForm, setMemoryForm] = useState<MemoryInput>(() => createMemoryForm(eventId ?? ''))
  const [memoryFile, setMemoryFile] = useState<File | null>(null)
  const [memoryUrl, setMemoryUrl] = useState('')
  const [memoryEdits, setMemoryEdits] = useState<Record<string, MemoryInput>>({})
  const [memoryEditFiles, setMemoryEditFiles] = useState<Record<string, File | null>>({})
  const [memoryEditUrls, setMemoryEditUrls] = useState<Record<string, string>>({})
  const [commentForm, setCommentForm] = useState<Record<string, string>>({})
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [eventForm, setEventForm] = useState<EventInput | null>(
    eventRecord
      ? {
          title: eventRecord.title,
          eventAt: eventRecord.eventAt,
          location: eventRecord.location,
          what: eventRecord.what,
          how: eventRecord.how,
          decisionSummary: eventRecord.decisionSummary,
        }
      : null,
  )

  if (!eventRecord) {
    return (
      <section className="shell section">
        <div className="empty-card">
          정거장을 찾을 수 없습니다. <Link to="/events">기록 목록으로 돌아가기</Link>
        </div>
      </section>
    )
  }

  const selectedEvent = eventRecord
  const eventMemories = memories.filter((memory) => memory.eventId === selectedEvent.id)
  const canWrite = Boolean(currentUser && (isApproved || isAdmin))
  const canEditEvent = Boolean(currentUser && (isAdmin || currentUser.id === selectedEvent.createdBy))

  async function handleEventUpdate(eventObject: React.FormEvent<HTMLFormElement>) {
    eventObject.preventDefault()
    if (!eventForm) {
      return
    }

    try {
      await updateEvent(selectedEvent.id, eventForm)
      setEditingEvent(false)
      setFeedback('정거장 정보를 수정했습니다.')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : '정거장 수정에 실패했습니다.')
    }
  }

  async function handleMemorySubmit(eventObject: React.FormEvent<HTMLFormElement>) {
    eventObject.preventDefault()
    setFeedback('')

    if (memoryFile) {
      const validationError = validateImageFile(memoryFile)
      if (validationError) {
        setFeedback(validationError)
        return
      }
    }

    try {
      await createMemory(memoryForm, memoryFile, memoryUrl)
      setMemoryForm(createMemoryForm(selectedEvent.id))
      setMemoryFile(null)
      setMemoryUrl('')
      setFeedback('메모리를 남겼습니다.')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : '메모리 등록에 실패했습니다.')
    }
  }

  async function handleMemoryUpdate(memoryId: string) {
    const draft = memoryEdits[memoryId]
    if (!draft) {
      return
    }

    const file = memoryEditFiles[memoryId] ?? null
    if (file) {
      const validationError = validateImageFile(file)
      if (validationError) {
        setFeedback(validationError)
        return
      }
    }

    try {
      await updateMemory(memoryId, draft, file, memoryEditUrls[memoryId] ?? '')
      setEditingMemoryId(null)
      setFeedback('메모리를 수정했습니다.')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : '메모리 수정에 실패했습니다.')
    }
  }

  async function handleCommentSubmit(memoryId: string) {
    const content = commentForm[memoryId]?.trim()
    if (!content) {
      return
    }

    const input: CommentInput = { memoryId, content }
    try {
      await createComment(input)
      setCommentForm((current) => ({ ...current, [memoryId]: '' }))
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : '코멘트 등록에 실패했습니다.')
    }
  }

  async function handleCommentUpdate(commentId: string) {
    const content = commentDrafts[commentId]?.trim()
    if (!content) {
      return
    }

    try {
      await updateComment(commentId, { memoryId: '', content })
      setEditingCommentId(null)
      setFeedback('코멘트를 수정했습니다.')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : '코멘트 수정에 실패했습니다.')
    }
  }

  return (
    <section className="shell section">
      <div className="detail-layout">
        <main className="detail-main">
          <article className="panel event-hero-card">
            <div className="event-header">
              <div className="event-meta">
                <span className="pill">{formatDateTime(selectedEvent.eventAt)}</span>
                <span>{selectedEvent.location}</span>
                <span>등록자 {resolveProfileName(selectedEvent.createdBy, profiles)}</span>
              </div>
              <h1>{selectedEvent.title}</h1>
              <p>{selectedEvent.decisionSummary}</p>
            </div>

            <div className="panel-grid">
              <div className="panel panel--nested">
                <strong>무엇을</strong>
                <p>{selectedEvent.what}</p>
              </div>
              <div className="panel panel--nested">
                <strong>어떻게</strong>
                <p>{selectedEvent.how}</p>
              </div>
            </div>

            {canEditEvent ? (
              <div className="stack-actions">
                <button
                  className="secondary-button"
                  onClick={() => {
                    setEditingEvent((current) => !current)
                    setEventForm({
                      title: selectedEvent.title,
                      eventAt: selectedEvent.eventAt,
                      location: selectedEvent.location,
                      what: selectedEvent.what,
                      how: selectedEvent.how,
                      decisionSummary: selectedEvent.decisionSummary,
                    })
                  }}
                  type="button"
                >
                  {editingEvent ? '수정 닫기' : '정거장 수정'}
                </button>
                {isAdmin ? (
                  <button
                    className="danger-button"
                    onClick={() => {
                      if (window.confirm('이 정거장과 연결된 메모리, 코멘트를 삭제할까요?')) {
                        void deleteEvent(selectedEvent.id).then(() => navigate('/events'))
                      }
                    }}
                    type="button"
                  >
                    정거장 삭제
                  </button>
                ) : null}
              </div>
            ) : null}

            {editingEvent && eventForm ? (
              <form className="form-grid edit-panel" onSubmit={handleEventUpdate}>
                <div className="field">
                  <label htmlFor="edit-title">제목</label>
                  <input
                    id="edit-title"
                    value={eventForm.title}
                    onChange={(eventObject) =>
                      setEventForm((current) => (current ? { ...current, title: eventObject.target.value } : current))
                    }
                  />
                </div>
                <div className="form-grid form-grid--two">
                  <div className="field">
                    <span className="field-label">언제</span>
                    <DateTimeSelect
                      idPrefix="edit-event-at"
                      value={eventForm.eventAt}
                      dateLabel="수정 날짜"
                      hourLabel="수정 시"
                      minuteLabel="수정 분"
                      onChange={(nextValue) =>
                        setEventForm((current) => (current ? { ...current, eventAt: nextValue } : current))
                      }
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="edit-location">어디서</label>
                    <input
                      id="edit-location"
                      value={eventForm.location}
                      onChange={(eventObject) =>
                        setEventForm((current) =>
                          current ? { ...current, location: eventObject.target.value } : current,
                        )
                      }
                    />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="edit-what">무엇을</label>
                  <textarea
                    id="edit-what"
                    value={eventForm.what}
                    onChange={(eventObject) =>
                      setEventForm((current) => (current ? { ...current, what: eventObject.target.value } : current))
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor="edit-how">어떻게</label>
                  <textarea
                    id="edit-how"
                    value={eventForm.how}
                    onChange={(eventObject) =>
                      setEventForm((current) => (current ? { ...current, how: eventObject.target.value } : current))
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor="edit-summary">확정 요약</label>
                  <textarea
                    id="edit-summary"
                    value={eventForm.decisionSummary}
                    onChange={(eventObject) =>
                      setEventForm((current) =>
                        current ? { ...current, decisionSummary: eventObject.target.value } : current,
                      )
                    }
                  />
                </div>
                <button className="primary-button" type="submit">
                  정거장 저장
                </button>
              </form>
            ) : null}
          </article>

          <article className="panel">
            <div className="section-heading section-heading--split">
              <div>
                <span className="section-heading__eyebrow">Memories</span>
                <h2>그날의 장면</h2>
                <p>사진과 코멘트를 이 정거장 아래에 이어 붙입니다.</p>
              </div>
              <span className="pill">{eventMemories.length}개 메모리</span>
            </div>

            {eventMemories.length === 0 ? (
              <div className="empty-card">아직 남겨진 장면이 없습니다. 첫 사진이나 메모를 남겨보세요.</div>
            ) : null}

            <div className="memory-grid">
              {eventMemories.map((memory) => {
                const authorName = resolveProfileName(memory.authorId, profiles)
                const authorAvatar = resolveProfileAvatar(memory.authorId, profiles)
                const memoryComments = comments.filter((comment) => comment.memoryId === memory.id)
                const canEditMemory = Boolean(currentUser && (isAdmin || currentUser.id === memory.authorId))
                const isEditingMemory = editingMemoryId === memory.id

                return (
                  <article className="memory-card" key={memory.id}>
                    <img
                      alt={`${authorName}의 메모리 사진`}
                      src={memory.photoUrl || FALLBACK_IMAGE}
                      onError={(eventObject) => {
                        eventObject.currentTarget.src = FALLBACK_IMAGE
                      }}
                    />
                    <div className="memory-card__body">
                      <div className="comment-author">
                        <img alt="" src={authorAvatar} />
                        <span>{authorName}</span>
                        <small>{formatDateTime(memory.recordedAt)}</small>
                      </div>

                      {isEditingMemory ? (
                        <div className="form-grid edit-panel">
                          <div className="field">
                            <label htmlFor={`memory-caption-${memory.id}`}>메모리 캡션 수정</label>
                            <textarea
                              id={`memory-caption-${memory.id}`}
                              value={memoryEdits[memory.id]?.caption ?? memory.caption}
                              onChange={(eventObject) =>
                                setMemoryEdits((current) => ({
                                  ...current,
                                  [memory.id]: {
                                    ...(current[memory.id] ?? {
                                      eventId: selectedEvent.id,
                                      caption: memory.caption,
                                      recordedAt: memory.recordedAt,
                                    }),
                                    caption: eventObject.target.value,
                                  },
                                }))
                              }
                            />
                          </div>
                          <div className="field">
                            <span className="field-label">기록 시각 수정</span>
                            <DateTimeSelect
                              idPrefix={`memory-recorded-${memory.id}`}
                              value={memoryEdits[memory.id]?.recordedAt ?? memory.recordedAt}
                              dateLabel="기록 수정 날짜"
                              hourLabel="기록 수정 시"
                              minuteLabel="기록 수정 분"
                              onChange={(nextValue) =>
                                setMemoryEdits((current) => ({
                                  ...current,
                                  [memory.id]: {
                                    ...(current[memory.id] ?? {
                                      eventId: selectedEvent.id,
                                      caption: memory.caption,
                                      recordedAt: memory.recordedAt,
                                    }),
                                    recordedAt: nextValue,
                                  },
                                }))
                              }
                            />
                          </div>
                          <div className="field">
                            <label htmlFor={`memory-url-${memory.id}`}>사진 URL 수정</label>
                            <input
                              id={`memory-url-${memory.id}`}
                              value={memoryEditUrls[memory.id] ?? memory.photoUrl}
                              onChange={(eventObject) =>
                                setMemoryEditUrls((current) => ({ ...current, [memory.id]: eventObject.target.value }))
                              }
                            />
                          </div>
                          <div className="field">
                            <label htmlFor={`memory-file-${memory.id}`}>사진 파일 교체</label>
                            <input
                              id={`memory-file-${memory.id}`}
                              accept="image/jpeg,image/png,image/webp"
                              type="file"
                              onChange={(eventObject) =>
                                setMemoryEditFiles((current) => ({
                                  ...current,
                                  [memory.id]: eventObject.target.files?.[0] ?? null,
                                }))
                              }
                            />
                          </div>
                          <div className="stack-actions">
                            <button className="primary-button" onClick={() => void handleMemoryUpdate(memory.id)} type="button">
                              메모리 저장
                            </button>
                            <button className="secondary-button" onClick={() => setEditingMemoryId(null)} type="button">
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p>{memory.caption}</p>
                      )}

                      {canEditMemory && !isEditingMemory ? (
                        <div className="stack-actions">
                          <button
                            className="secondary-button"
                            onClick={() => {
                              setEditingMemoryId(memory.id)
                              setMemoryEdits((current) => ({
                                ...current,
                                [memory.id]: {
                                  eventId: selectedEvent.id,
                                  caption: memory.caption,
                                  recordedAt: memory.recordedAt,
                                },
                              }))
                              setMemoryEditUrls((current) => ({ ...current, [memory.id]: memory.photoUrl }))
                            }}
                            type="button"
                          >
                            메모리 수정
                          </button>
                          {isAdmin ? (
                            <button className="danger-button" onClick={() => void deleteMemory(memory.id)} type="button">
                              메모리 삭제
                            </button>
                          ) : null}
                        </div>
                      ) : null}

                      <div className="comment-list">
                        {memoryComments.map((comment) => {
                          const canEditComment = Boolean(currentUser && (isAdmin || currentUser.id === comment.authorId))
                          const isEditingComment = editingCommentId === comment.id

                          return (
                            <div className="comment-card" key={comment.id}>
                              <div className="comment-author">
                                <img alt="" src={resolveProfileAvatar(comment.authorId, profiles)} />
                                <span>{resolveProfileName(comment.authorId, profiles)}</span>
                                <small>{formatDateTime(comment.createdAt)}</small>
                              </div>
                              {isEditingComment ? (
                                <div className="form-grid edit-panel">
                                  <div className="field">
                                    <label htmlFor={`comment-edit-${comment.id}`}>코멘트 수정</label>
                                    <textarea
                                      id={`comment-edit-${comment.id}`}
                                      value={commentDrafts[comment.id] ?? comment.content}
                                      onChange={(eventObject) =>
                                        setCommentDrafts((current) => ({
                                          ...current,
                                          [comment.id]: eventObject.target.value,
                                        }))
                                      }
                                    />
                                  </div>
                                  <div className="stack-actions">
                                    <button
                                      className="primary-button"
                                      onClick={() => void handleCommentUpdate(comment.id)}
                                      type="button"
                                    >
                                      코멘트 저장
                                    </button>
                                    <button
                                      className="secondary-button"
                                      onClick={() => setEditingCommentId(null)}
                                      type="button"
                                    >
                                      취소
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p>{comment.content}</p>
                              )}

                              {canEditComment && !isEditingComment ? (
                                <div className="stack-actions">
                                  <button
                                    className="secondary-button"
                                    onClick={() => {
                                      setEditingCommentId(comment.id)
                                      setCommentDrafts((current) => ({ ...current, [comment.id]: comment.content }))
                                    }}
                                    type="button"
                                  >
                                    코멘트 수정
                                  </button>
                                  {isAdmin ? (
                                    <button
                                      className="danger-button"
                                      onClick={() => void deleteComment(comment.id)}
                                      type="button"
                                    >
                                      코멘트 삭제
                                    </button>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          )
                        })}
                      </div>

                      {canWrite ? (
                        <form
                          className="comment-form"
                          onSubmit={(eventObject) => {
                            eventObject.preventDefault()
                            void handleCommentSubmit(memory.id)
                          }}
                        >
                          <label className="field" htmlFor={`comment-${memory.id}`}>
                            <span>코멘트 남기기</span>
                            <textarea
                              id={`comment-${memory.id}`}
                              value={commentForm[memory.id] ?? ''}
                              onChange={(eventObject) =>
                                setCommentForm((current) => ({ ...current, [memory.id]: eventObject.target.value }))
                              }
                              placeholder="그날의 공기를 짧게 남겨주세요."
                            />
                          </label>
                          <button className="secondary-button" type="submit">
                            코멘트 추가
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </article>
                )
              })}
            </div>
          </article>
        </main>

        <aside className="panel memory-submit-panel">
          <div className="section-heading">
            <span className="section-heading__eyebrow">Add memory</span>
            <h2>이 정거장에 장면 남기기</h2>
            <p>사진 파일 또는 URL을 넣고, 그 시각의 설명과 함께 남깁니다.</p>
          </div>

          <form className="form-grid" onSubmit={handleMemorySubmit}>
            <div className="field">
              <label htmlFor="memory-caption">메모리 캡션</label>
              <textarea
                id="memory-caption"
                value={memoryForm.caption}
                onChange={(eventObject) =>
                  setMemoryForm((current) => ({ ...current, caption: eventObject.target.value }))
                }
                placeholder="사진에 담긴 장면과 짧은 말을 적어주세요."
                required
              />
            </div>
            <div className="field">
              <span className="field-label">기록 시각</span>
              <DateTimeSelect
                idPrefix="recorded-at"
                value={memoryForm.recordedAt}
                dateLabel="기록 날짜"
                hourLabel="기록 시"
                minuteLabel="기록 분"
                required
                onChange={(nextValue) =>
                  setMemoryForm((current) => ({ ...current, eventId: selectedEvent.id, recordedAt: nextValue }))
                }
              />
            </div>
            <div className="field">
              <label htmlFor="memory-file">사진 파일</label>
              <input
                id="memory-file"
                accept="image/jpeg,image/png,image/webp"
                disabled={!canWrite}
                type="file"
                onChange={(eventObject) => setMemoryFile(eventObject.target.files?.[0] ?? null)}
              />
            </div>
            <div className="field">
              <label htmlFor="memory-url">또는 사진 URL</label>
              <input
                id="memory-url"
                disabled={!canWrite}
                value={memoryUrl}
                onChange={(eventObject) => setMemoryUrl(eventObject.target.value)}
                placeholder="https://..."
              />
            </div>

            {feedback ? <div className="notice-card">{feedback}</div> : null}

            <button className="primary-button" disabled={!canWrite} type="submit">
              메모리 남기기
            </button>
            {!canWrite ? <p className="muted">승인된 사용자만 메모리를 남길 수 있습니다.</p> : null}
          </form>
        </aside>
      </div>
    </section>
  )
}
