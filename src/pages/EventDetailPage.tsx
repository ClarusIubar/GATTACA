import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAppContext } from '../lib/app-context'
import { formatDateTime } from '../lib/format'
import { resolveProfileAvatar, resolveProfileName } from '../lib/profile-display'
import type { CommentInput, EventInput, MemoryInput } from '../lib/types'

const createMemoryForm = (eventId: string): MemoryInput => ({
  eventId,
  caption: '',
  recordedAt: '',
})

export function EventDetailPage() {
  const { eventId } = useParams()
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

  const event = events.find((item) => item.id === eventId)
  const [memoryForm, setMemoryForm] = useState<MemoryInput>(() => createMemoryForm(eventId ?? ''))
  const [memoryFile, setMemoryFile] = useState<File | null>(null)
  const [memoryUrl, setMemoryUrl] = useState('')
  const [feedback, setFeedback] = useState('')
  const [editingEvent, setEditingEvent] = useState(false)
  const [eventForm, setEventForm] = useState<EventInput | null>(
    event
      ? {
          title: event.title,
          eventAt: event.eventAt,
          location: event.location,
          what: event.what,
          how: event.how,
          decisionSummary: event.decisionSummary,
        }
      : null,
  )
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [memoryEdits, setMemoryEdits] = useState<Record<string, MemoryInput>>({})
  const [memoryEditUrls, setMemoryEditUrls] = useState<Record<string, string>>({})
  const [memoryEditFiles, setMemoryEditFiles] = useState<Record<string, File | null>>({})
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [commentForm, setCommentForm] = useState<Record<string, string>>({})

  if (!event) {
    return (
      <section className="shell section">
        <div className="empty-card">
          이벤트를 찾을 수 없습니다. <Link to="/events">목록으로 돌아가기</Link>
        </div>
      </section>
    )
  }

  const eventRecord = event
  const eventMemories = memories.filter((memory) => memory.eventId === eventRecord.id)
  const canWrite = Boolean(currentUser && (isApproved || isAdmin))
  const canEditEvent = Boolean(currentUser && (isAdmin || currentUser.id === eventRecord.createdBy))

  async function handleMemorySubmit(eventObject: React.FormEvent<HTMLFormElement>) {
    eventObject.preventDefault()
    setFeedback('')

    try {
      await createMemory(memoryForm, memoryFile, memoryUrl)
      setMemoryForm(createMemoryForm(eventRecord.id))
      setMemoryFile(null)
      setMemoryUrl('')
      setFeedback('추억 기록이 추가되었습니다.')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : '메모리 등록에 실패했습니다.')
    }
  }

  async function handleEventUpdate(eventObject: React.FormEvent<HTMLFormElement>) {
    eventObject.preventDefault()
    if (!eventForm) {
      return
    }

    try {
      await updateEvent(eventRecord.id, eventForm)
      setEditingEvent(false)
      setFeedback('이벤트가 수정되었습니다.')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : '이벤트 수정에 실패했습니다.')
    }
  }

  return (
    <section className="shell section">
      <div className="two-column">
        <div className="grid">
          <article className="panel">
            <div className="event-header">
              <div className="event-meta">
                <span className="pill">{formatDateTime(eventRecord.eventAt)}</span>
                <span>{eventRecord.location}</span>
                <span>등록자: {resolveProfileName(eventRecord.createdBy, profiles)}</span>
              </div>
              <h1>{eventRecord.title}</h1>
              <p>{eventRecord.decisionSummary}</p>
            </div>

            <div className="panel-grid">
              <div className="panel">
                <strong>무엇을</strong>
                <p>{eventRecord.what}</p>
              </div>
              <div className="panel">
                <strong>어떻게</strong>
                <p>{eventRecord.how}</p>
              </div>
            </div>

            {canEditEvent ? (
              <div className="stack-actions">
                <button
                  className="secondary-button"
                  onClick={() => {
                    setEditingEvent((current) => !current)
                    setEventForm({
                      title: eventRecord.title,
                      eventAt: eventRecord.eventAt,
                      location: eventRecord.location,
                      what: eventRecord.what,
                      how: eventRecord.how,
                      decisionSummary: eventRecord.decisionSummary,
                    })
                  }}
                  type="button"
                >
                  {editingEvent ? '수정 닫기' : '이벤트 수정'}
                </button>
                {isAdmin ? (
                  <button
                    className="danger-button"
                    onClick={() => void deleteEvent(eventRecord.id)}
                    type="button"
                  >
                    이벤트 삭제
                  </button>
                ) : null}
              </div>
            ) : null}

            {editingEvent && eventForm ? (
              <form className="form-grid" onSubmit={handleEventUpdate}>
                <div className="field">
                  <label htmlFor="edit-title">제목</label>
                  <input
                    id="edit-title"
                    value={eventForm.title}
                    onChange={(eventObject) =>
                      setEventForm((current) =>
                        current ? { ...current, title: eventObject.target.value } : current,
                      )
                    }
                  />
                </div>
                <div className="form-grid form-grid--two">
                  <div className="field">
                    <label htmlFor="edit-at">언제</label>
                    <input
                      id="edit-at"
                      type="datetime-local"
                      value={eventForm.eventAt}
                      onChange={(eventObject) =>
                        setEventForm((current) =>
                          current ? { ...current, eventAt: eventObject.target.value } : current,
                        )
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
                      setEventForm((current) =>
                        current ? { ...current, what: eventObject.target.value } : current,
                      )
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor="edit-how">어떻게</label>
                  <textarea
                    id="edit-how"
                    value={eventForm.how}
                    onChange={(eventObject) =>
                      setEventForm((current) =>
                        current ? { ...current, how: eventObject.target.value } : current,
                      )
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor="edit-summary">결정 요약</label>
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
                <div className="stack-actions">
                  <button className="primary-button" type="submit">
                    이벤트 저장
                  </button>
                </div>
              </form>
            ) : null}
          </article>

          <article className="panel">
            <div className="section-heading">
              <span className="section-heading__eyebrow">Memories</span>
              <h2>추억 기록</h2>
              <p>사진과 코멘트가 한 이벤트 아래에 모여, 그날의 분위기를 다시 볼 수 있습니다.</p>
            </div>

            <div className="memory-list">
              {eventMemories.map((memory) => {
                const authorName = resolveProfileName(memory.authorId, profiles)
                const authorAvatar = resolveProfileAvatar(memory.authorId, profiles)
                const relatedComments = comments.filter((comment) => comment.memoryId === memory.id)
                const canEditMemory = Boolean(
                  currentUser && (isAdmin || currentUser.id === memory.authorId),
                )
                const activeEdit =
                  memoryEdits[memory.id] ?? {
                    eventId: eventRecord.id,
                    caption: memory.caption,
                    recordedAt: memory.recordedAt,
                  }

                return (
                  <article className="memory-card" key={memory.id}>
                    <div className="memory-meta">
                      <img
                        alt={authorName}
                        src={authorAvatar}
                        style={{ width: 36, height: 36, borderRadius: '50%' }}
                      />
                      <span>{authorName}</span>
                      <span>{formatDateTime(memory.recordedAt)}</span>
                    </div>
                    <p>{memory.caption}</p>
                    <div className="memory-card__image">
                      <img alt={`${eventRecord.title} 메모리`} src={memory.photoUrl} />
                    </div>

                    {canEditMemory ? (
                      <div className="stack-actions">
                        <button
                          className="secondary-button"
                          onClick={() =>
                            setEditingMemoryId((current) => (current === memory.id ? null : memory.id))
                          }
                          type="button"
                        >
                          {editingMemoryId === memory.id ? '수정 닫기' : '메모리 수정'}
                        </button>
                        {isAdmin ? (
                          <button
                            className="danger-button"
                            onClick={() => void deleteMemory(memory.id)}
                            type="button"
                          >
                            메모리 삭제
                          </button>
                        ) : null}
                      </div>
                    ) : null}

                    {editingMemoryId === memory.id ? (
                      <form
                        className="form-grid"
                        onSubmit={(eventObject) => {
                          eventObject.preventDefault()
                          void updateMemory(
                            memory.id,
                            activeEdit,
                            memoryEditFiles[memory.id] ?? null,
                            memoryEditUrls[memory.id] ?? memory.photoUrl,
                          )
                            .then(() => {
                              setEditingMemoryId(null)
                              setFeedback('메모리가 수정되었습니다.')
                            })
                            .catch((error) => {
                              setFeedback(
                                error instanceof Error ? error.message : '메모리 수정에 실패했습니다.',
                              )
                            })
                        }}
                      >
                        <div className="field">
                          <label htmlFor={`memory-caption-${memory.id}`}>캡션</label>
                          <textarea
                            id={`memory-caption-${memory.id}`}
                            value={activeEdit.caption}
                            onChange={(eventObject) =>
                              setMemoryEdits((current) => ({
                                ...current,
                                [memory.id]: { ...activeEdit, caption: eventObject.target.value },
                              }))
                            }
                          />
                        </div>
                        <div className="form-grid form-grid--two">
                          <div className="field">
                            <label htmlFor={`memory-date-${memory.id}`}>기록 시각</label>
                            <input
                              id={`memory-date-${memory.id}`}
                              type="datetime-local"
                              value={activeEdit.recordedAt}
                              onChange={(eventObject) =>
                                setMemoryEdits((current) => ({
                                  ...current,
                                  [memory.id]: { ...activeEdit, recordedAt: eventObject.target.value },
                                }))
                              }
                            />
                          </div>
                          <div className="field">
                            <label htmlFor={`memory-url-${memory.id}`}>사진 URL</label>
                            <input
                              id={`memory-url-${memory.id}`}
                              value={memoryEditUrls[memory.id] ?? memory.photoUrl}
                              onChange={(eventObject) =>
                                setMemoryEditUrls((current) => ({
                                  ...current,
                                  [memory.id]: eventObject.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div className="field">
                          <label htmlFor={`memory-file-${memory.id}`}>새 사진 업로드</label>
                          <input
                            id={`memory-file-${memory.id}`}
                            type="file"
                            accept="image/*"
                            onChange={(eventObject) =>
                              setMemoryEditFiles((current) => ({
                                ...current,
                                [memory.id]: eventObject.target.files?.[0] ?? null,
                              }))
                            }
                          />
                        </div>
                        <button className="primary-button" type="submit">
                          메모리 저장
                        </button>
                      </form>
                    ) : null}

                    <div className="comment-list">
                      {relatedComments.map((comment) => {
                        const canEditComment = Boolean(
                          currentUser && (isAdmin || currentUser.id === comment.authorId),
                        )

                        return (
                          <div className="comment-card" key={comment.id}>
                            <div className="comment-meta">
                              <span>{resolveProfileName(comment.authorId, profiles)}</span>
                              <span>{formatDateTime(comment.createdAt)}</span>
                            </div>

                            {editingCommentId === comment.id ? (
                              <form
                                className="form-grid"
                                onSubmit={(eventObject) => {
                                  eventObject.preventDefault()
                                  const payload: CommentInput = {
                                    memoryId: memory.id,
                                    content: commentDrafts[comment.id] ?? comment.content,
                                  }
                                  void updateComment(comment.id, payload)
                                    .then(() => {
                                      setEditingCommentId(null)
                                      setFeedback('코멘트가 수정되었습니다.')
                                    })
                                    .catch((error) => {
                                      setFeedback(
                                        error instanceof Error
                                          ? error.message
                                          : '코멘트 수정에 실패했습니다.',
                                      )
                                    })
                                }}
                              >
                                <div className="field">
                                  <label htmlFor={`comment-edit-${comment.id}`}>코멘트</label>
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
                                <button className="primary-button" type="submit">
                                  코멘트 저장
                                </button>
                              </form>
                            ) : (
                              <p>{comment.content}</p>
                            )}

                            {canEditComment ? (
                              <div className="stack-actions">
                                <button
                                  className="secondary-button"
                                  onClick={() =>
                                    setEditingCommentId((current) =>
                                      current === comment.id ? null : comment.id,
                                    )
                                  }
                                  type="button"
                                >
                                  {editingCommentId === comment.id ? '수정 닫기' : '코멘트 수정'}
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

                      {canWrite ? (
                        <form
                          className="form-grid"
                          onSubmit={(eventObject) => {
                            eventObject.preventDefault()
                            const content = commentForm[memory.id]?.trim()
                            if (!content) {
                              return
                            }

                            void createComment({ memoryId: memory.id, content })
                              .then(() => {
                                setCommentForm((current) => ({ ...current, [memory.id]: '' }))
                                setFeedback('코멘트가 등록되었습니다.')
                              })
                              .catch((error) => {
                                setFeedback(
                                  error instanceof Error ? error.message : '코멘트 등록에 실패했습니다.',
                                )
                              })
                          }}
                        >
                          <div className="field">
                            <label htmlFor={`comment-create-${memory.id}`}>코멘트 남기기</label>
                            <textarea
                              id={`comment-create-${memory.id}`}
                              placeholder="그날 떠오르는 장면이나 감정을 남겨보세요."
                              value={commentForm[memory.id] ?? ''}
                              onChange={(eventObject) =>
                                setCommentForm((current) => ({
                                  ...current,
                                  [memory.id]: eventObject.target.value,
                                }))
                              }
                            />
                          </div>
                          <button className="secondary-button" type="submit">
                            코멘트 추가
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </article>
                )
              })}

              {eventMemories.length === 0 ? (
                <div className="empty-card">아직 남겨진 메모리가 없습니다. 첫 장면을 기록해보세요.</div>
              ) : null}
            </div>
          </article>
        </div>

        <aside className="grid">
          <article className="panel">
            <div className="section-heading">
              <span className="section-heading__eyebrow">Write memory</span>
              <h2>새 메모리 등록</h2>
            </div>

            <form className="form-grid" onSubmit={handleMemorySubmit}>
              <div className="field">
                <label htmlFor="memory-caption">메모리 캡션</label>
                <textarea
                  id="memory-caption"
                  placeholder="그날의 장면, 감정, 짧은 후기"
                  value={memoryForm.caption}
                  onChange={(eventObject) =>
                    setMemoryForm((current) => ({ ...current, caption: eventObject.target.value }))
                  }
                  disabled={!canWrite}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="memory-recorded-at">기록 시각</label>
                <input
                  id="memory-recorded-at"
                  type="datetime-local"
                  value={memoryForm.recordedAt}
                  onChange={(eventObject) =>
                    setMemoryForm((current) => ({ ...current, recordedAt: eventObject.target.value }))
                  }
                  disabled={!canWrite}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="memory-file">사진 업로드</label>
                <input
                  id="memory-file"
                  type="file"
                  accept="image/*"
                  onChange={(eventObject) => setMemoryFile(eventObject.target.files?.[0] ?? null)}
                  disabled={!canWrite}
                />
              </div>
              <div className="field">
                <label htmlFor="memory-url">또는 사진 URL</label>
                <input
                  id="memory-url"
                  value={memoryUrl}
                  onChange={(eventObject) => setMemoryUrl(eventObject.target.value)}
                  placeholder="https://..."
                  disabled={!canWrite}
                />
              </div>
              <button className="primary-button" disabled={!canWrite} type="submit">
                메모리 남기기
              </button>
            </form>

            {feedback ? <div className="notice-card">{feedback}</div> : null}
          </article>

          <article className="panel">
            <div className="section-heading">
              <span className="section-heading__eyebrow">운영 메모</span>
              <h2>이벤트 기록 원칙</h2>
            </div>
            <ul className="rail-list">
              <li>단체방에서 이미 결정된 사안만 기록</li>
              <li>사진은 행사 분위기를 전달할 수 있는 장면 위주로 등록</li>
              <li>삭제는 운영자만 수행</li>
            </ul>
          </article>
        </aside>
      </div>
    </section>
  )
}
