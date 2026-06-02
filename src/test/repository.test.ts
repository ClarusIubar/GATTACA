import { beforeEach, describe, expect, it } from 'vitest'
import { DemoRepository } from '../lib/repository'

describe('DemoRepository', () => {
  let repository: DemoRepository

  beforeEach(() => {
    localStorage.clear()
    repository = new DemoRepository('test-memory-train-key')
  })

  it('loads initial mock profiles, events, memories, and comments', async () => {
    const profiles = await repository.fetchProfiles()
    const events = await repository.fetchEvents()
    const memories = await repository.fetchMemories()
    const comments = await repository.fetchComments()

    expect(profiles).toHaveLength(3)
    expect(events).toHaveLength(2)
    expect(memories).toHaveLength(1)
    expect(comments).toHaveLength(1)
  })

  it('creates, updates, and deletes an event in local storage', async () => {
    const input = {
      title: '새 테스트 모임',
      eventAt: '2026-06-10T12:00',
      location: '테스트역 1번 출구',
      what: '테스트 목적',
      how: '테스트 방식',
      decisionSummary: '결정 요약',
    }

    const created = await repository.createEvent(input, 'profile-admin')
    let events = await repository.fetchEvents()

    expect(created.title).toBe('새 테스트 모임')
    expect(events).toHaveLength(3)
    expect(events[0].title).toBe('새 테스트 모임')
    expect(events[0].createdBy).toBe('profile-admin')

    const newEventId = events[0].id

    await repository.updateEvent(newEventId, {
      ...input,
      title: '수정된 테스트 모임',
    })
    events = await repository.fetchEvents()
    expect(events.find((event) => event.id === newEventId)?.title).toBe('수정된 테스트 모임')

    await repository.deleteEvent(newEventId)
    events = await repository.fetchEvents()
    expect(events).toHaveLength(2)
  })

  it('creates, updates, and deletes a memory', async () => {
    const input = {
      eventId: 'event-spring-seoul',
      caption: '추억 기록 설명',
      recordedAt: '2026-05-31T12:00',
    }

    await repository.createMemory(input, 'https://example.com/photo.jpg', 'profile-member')
    let memories = await repository.fetchMemories()
    expect(memories).toHaveLength(2)
    expect(memories[0].caption).toBe('추억 기록 설명')
    expect(memories[0].photoUrl).toBe('https://example.com/photo.jpg')

    const newMemoryId = memories[0].id

    await repository.updateMemory(newMemoryId, input, 'https://example.com/photo2.jpg')
    memories = await repository.fetchMemories()
    expect(memories.find((memory) => memory.id === newMemoryId)?.photoUrl).toBe(
      'https://example.com/photo2.jpg',
    )

    await repository.deleteMemory(newMemoryId)
    memories = await repository.fetchMemories()
    expect(memories).toHaveLength(1)
  })

  it('creates, updates, and deletes a comment', async () => {
    const input = {
      memoryId: 'memory-spring-1',
      content: '테스트 댓글 내용',
    }

    await repository.createComment(input, 'profile-admin')
    let comments = await repository.fetchComments()
    expect(comments).toHaveLength(2)
    expect(comments[1].content).toBe('테스트 댓글 내용')

    const newCommentId = comments[1].id

    await repository.updateComment(newCommentId, { ...input, content: '수정된 댓글 내용' })
    comments = await repository.fetchComments()
    expect(comments.find((comment) => comment.id === newCommentId)?.content).toBe('수정된 댓글 내용')

    await repository.deleteComment(newCommentId)
    comments = await repository.fetchComments()
    expect(comments).toHaveLength(1)
  })
})
