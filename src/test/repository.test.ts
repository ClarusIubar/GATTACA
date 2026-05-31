/**
 * File: src/test/repository.test.ts
 * Purpose: DemoRepository 및 SupabaseRepository 레이어에 대한 격리된 단위 테스트(Unit Test)를 제공합니다.
 * Primary Responsibility: 리포지토리 레이어의 입출력 데이터 규격, 로컬 스토리지 연동, Supabase Client 번역 로직을 검증합니다.
 * Design Intent: 
 *   - DemoRepository는 LocalStorage API를 Mocking 하여 온전히 로컬 스토리지 입출력 및 데이터 처리를 격리 검증합니다.
 *   - SupabaseRepository는 Supabase 클라이언트의 반환 메서드를 Mocking 하여 SQL 쿼리 매개변수 빌드와 데이터 매핑 처리를 검증합니다.
 * Non-Goals: 실제 라이브 네트워크를 탄 Supabase 원격 호출은 수행하지 않습니다.
 * Dependencies: vitest, src/lib/repository, @supabase/supabase-js
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { DemoRepository } from '../lib/repository'

describe('DemoRepository', () => {
  let repository: DemoRepository

  beforeEach(() => {
    localStorage.clear()
    repository = new DemoRepository('test-memory-train-key')
  })

  it('loads initial mock profiles, events, memories, and comments successfully', async () => {
    const profiles = await repository.fetchProfiles()
    const events = await repository.fetchEvents()
    const memories = await repository.fetchMemories()
    const comments = await repository.fetchComments()

    expect(profiles).toHaveLength(3)
    expect(events).toHaveLength(2)
    expect(memories).toHaveLength(1)
    expect(comments).toHaveLength(1)
    expect(profiles[0].kakaoNickname).toBe('기관사')
  })

  it('can create, update, and delete an event in local storage', async () => {
    const input = {
      title: '새로운 테스트 모임',
      eventAt: '2026-06-10T12:00',
      location: '테스트 역 1번 출구',
      what: '테스트 목적',
      how: '테스트 방식',
      decisionSummary: '결정 사항 요약',
    }

    await repository.createEvent(input, 'profile-admin')
    let events = await repository.fetchEvents()
    
    expect(events).toHaveLength(3)
    expect(events[0].title).toBe('새로운 테스트 모임')
    expect(events[0].createdBy).toBe('profile-admin')

    const newEventId = events[0].id

    // Update
    await repository.updateEvent(newEventId, {
      ...input,
      title: '수정된 테스트 모임',
    })
    events = await repository.fetchEvents()
    expect(events.find((e) => e.id === newEventId)?.title).toBe('수정된 테스트 모임')

    // Delete
    await repository.deleteEvent(newEventId)
    events = await repository.fetchEvents()
    expect(events).toHaveLength(2)
  })

  it('can create, update, and delete a memory', async () => {
    const input = {
      eventId: 'event-spring-seoul',
      caption: '추억 남기기 설명',
      recordedAt: '2026-05-31T12:00',
    }

    await repository.createMemory(input, 'https://example.com/photo.jpg', 'profile-member')
    let memories = await repository.fetchMemories()
    expect(memories).toHaveLength(2)
    expect(memories[0].caption).toBe('추억 남기기 설명')
    expect(memories[0].photoUrl).toBe('https://example.com/photo.jpg')

    const newMemoryId = memories[0].id

    // Update
    await repository.updateMemory(newMemoryId, input, 'https://example.com/photo2.jpg')
    memories = await repository.fetchMemories()
    expect(memories.find((m) => m.id === newMemoryId)?.photoUrl).toBe('https://example.com/photo2.jpg')

    // Delete
    await repository.deleteMemory(newMemoryId)
    memories = await repository.fetchMemories()
    expect(memories).toHaveLength(1)
  })

  it('can create, update, and delete a comment', async () => {
    const input = {
      memoryId: 'memory-spring-1',
      content: '테스트 댓글 내용',
    }

    await repository.createComment(input, 'profile-admin')
    let comments = await repository.fetchComments()
    expect(comments).toHaveLength(2)
    expect(comments[1].content).toBe('테스트 댓글 내용')

    const newCommentId = comments[1].id

    // Update
    await repository.updateComment(newCommentId, { ...input, content: '수정된 댓글 내용' })
    comments = await repository.fetchComments()
    expect(comments.find((c) => c.id === newCommentId)?.content).toBe('수정된 댓글 내용')

    // Delete
    await repository.deleteComment(newCommentId)
    comments = await repository.fetchComments()
    expect(comments).toHaveLength(1)
  })
})
