/**
 * File: src/lib/repository.ts
 * Purpose: 추억열차 서비스의 데이터 스토리지 액세스 레이어를 추상화하고, 로컬 데모와 Supabase 백엔드 처리를 분할 구현합니다.
 * Primary Responsibility: 의존성 역전 원칙(DIP)을 실현하여 UI 및 상태 로직(Policy)과 물리 데이터베이스 통신(Mechanism)을 격리합니다.
 * Design Intent: 
 *   - MemoryTrainRepository 인터페이스를 통해 UI 계층이 로컬 데모와 원격 데이터베이스 모드를 알 필요 없이 통일된 비즈니스 요청을 보낼 수 있게 합니다.
 *   - SupabaseRepository는 데이터베이스의 snake_case와 프론트엔드의 camelCase 데이터 규격을 번역하는 번역 Seam 역할을 담당합니다.
 *   - DemoRepository는 LocalStorage 및 초기 모의 데이터를 활용해 라이브 연동 없이도 신속하게 작동하는 검증 심(Seam)을 제공합니다.
 * Non-Goals: 카카오 OAuth 로그인 인증 상태 및 실시간 사용자 세션 관리는 이 파일의 비범위이며, Supabase Auth 혹은 컨텍스트에서 수행합니다.
 * Dependencies: ./types, ./supabase, ./mock-data
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { initialDemoData } from './mock-data'
import type {
  ApprovalStatus,
  CommentInput,
  CommentRecord,
  EventInput,
  EventRecord,
  MemoryInput,
  MemoryRecord,
  UserProfile,
  AppDataSnapshot,
} from './types'

/**
 * MemoryTrainRepository
 * @description 추억열차 데이터 액세스를 담당하는 최상위 공통 인터페이스입니다.
 */
export interface MemoryTrainRepository {
  /**
   * 사용자 프로필 전체 목록을 가져옵니다.
   */
  fetchProfiles(): Promise<UserProfile[]>
  
  /**
   * 등록된 모든 이벤트 목록을 정렬해 가져옵니다.
   */
  fetchEvents(): Promise<EventRecord[]>
  
  /**
   * 등록된 모든 추억(사진/설명) 목록을 가져옵니다.
   */
  fetchMemories(): Promise<MemoryRecord[]>
  
  /**
   * 등록된 모든 댓글 목록을 가져옵니다.
   */
  fetchComments(): Promise<CommentRecord[]>

  /**
   * 신규 이벤트를 개설합니다.
   * @param input 이벤트 입력값
   * @param creatorId 등록자 프로필 고유 ID
   */
  createEvent(input: EventInput, creatorId: string): Promise<void>
  
  /**
   * 이벤트를 수정합니다.
   * @param eventId 이벤트 ID
   * @param input 수정 대상 입력값
   */
  updateEvent(eventId: string, input: EventInput): Promise<void>
  
  /**
   * 이벤트를 삭제합니다.
   * @param eventId 이벤트 ID
   */
  deleteEvent(eventId: string): Promise<void>

  /**
   * 신규 추억 사진을 등록합니다.
   * @param input 추억 입력값
   * @param photoUrl 완성된 사진 URL
   * @param authorId 등록자 프로필 고유 ID
   */
  createMemory(input: MemoryInput, photoUrl: string, authorId: string): Promise<void>
  
  /**
   * 추억 사진과 설명을 수정합니다.
   * @param memoryId 메모리 ID
   * @param input 수정 대상 입력값
   * @param photoUrl 새 사진 URL 혹은 기존 URL
   */
  updateMemory(memoryId: string, input: MemoryInput, photoUrl: string): Promise<void>
  
  /**
   * 추억 사진 데이터를 삭제합니다.
   * @param memoryId 메모리 ID
   */
  deleteMemory(memoryId: string): Promise<void>

  /**
   * 댓글을 작성합니다.
   * @param input 댓글 입력값
   * @param authorId 작성자 프로필 고유 ID
   */
  createComment(input: CommentInput, authorId: string): Promise<void>
  
  /**
   * 댓글을 수정합니다.
   * @param commentId 댓글 ID
   * @param input 수정 대상 입력값
   */
  updateComment(commentId: string, input: CommentInput): Promise<void>
  
  /**
   * 댓글을 삭제합니다.
   * @param commentId 댓글 ID
   */
  deleteComment(commentId: string): Promise<void>

  /**
   * 가입 신청한 프로필의 승인 상태를 업데이트합니다.
   * @param profileId 프로필 ID
   * @param status 승인/대기/반려 상태
   */
  updateProfileApproval(profileId: string, status: ApprovalStatus): Promise<void>
}

/**
 * DemoRepository
 * @description LocalStorage와 Mock 데이터를 사용해 데이터를 조회 및 변경하는 테스트/시뮬레이션 전용 로컬 리포지토리입니다.
 */
export class DemoRepository implements MemoryTrainRepository {
  private readonly storageKey: string

  constructor(storageKey = 'memory-train-demo-data') {
    this.storageKey = storageKey
  }

  private loadData(): AppDataSnapshot {
    const raw = localStorage.getItem(this.storageKey)
    if (!raw) {
      return JSON.parse(JSON.stringify(initialDemoData)) as AppDataSnapshot
    }
    try {
      return JSON.parse(raw) as AppDataSnapshot
    } catch {
      return JSON.parse(JSON.stringify(initialDemoData)) as AppDataSnapshot
    }
  }

  private saveData(data: AppDataSnapshot): void {
    localStorage.setItem(this.storageKey, JSON.stringify(data))
  }

  private makeId(prefix: string): string {
    return `${prefix}-${crypto.randomUUID()}`
  }

  async fetchProfiles(): Promise<UserProfile[]> {
    return this.loadData().profiles
  }

  async fetchEvents(): Promise<EventRecord[]> {
    const data = this.loadData()
    return [...data.events].sort((a, b) => b.eventAt.localeCompare(a.eventAt))
  }

  async fetchMemories(): Promise<MemoryRecord[]> {
    const data = this.loadData()
    return [...data.memories].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
  }

  async fetchComments(): Promise<CommentRecord[]> {
    const data = this.loadData()
    return [...data.comments].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  async createEvent(input: EventInput, creatorId: string): Promise<void> {
    const data = this.loadData()
    const newEvent: EventRecord = {
      id: this.makeId('event'),
      createdBy: creatorId,
      ...input,
    }
    data.events.unshift(newEvent)
    this.saveData(data)
  }

  async updateEvent(eventId: string, input: EventInput): Promise<void> {
    const data = this.loadData()
    data.events = data.events.map((event) =>
      event.id === eventId ? { ...event, ...input } : event
    )
    this.saveData(data)
  }

  async deleteEvent(eventId: string): Promise<void> {
    const data = this.loadData()
    const memoriesToDelete = data.memories.filter((m) => m.eventId === eventId).map((m) => m.id)
    
    data.events = data.events.filter((e) => e.id !== eventId)
    data.memories = data.memories.filter((m) => m.eventId !== eventId)
    data.comments = data.comments.filter((c) => !memoriesToDelete.includes(c.memoryId))
    
    this.saveData(data)
  }

  async createMemory(input: MemoryInput, photoUrl: string, authorId: string): Promise<void> {
    const data = this.loadData()
    const newMemory: MemoryRecord = {
      id: this.makeId('memory'),
      authorId,
      photoUrl,
      ...input,
    }
    data.memories.unshift(newMemory)
    this.saveData(data)
  }

  async updateMemory(memoryId: string, input: MemoryInput, photoUrl: string): Promise<void> {
    const data = this.loadData()
    data.memories = data.memories.map((memory) =>
      memory.id === memoryId ? { ...memory, ...input, photoUrl } : memory
    )
    this.saveData(data)
  }

  async deleteMemory(memoryId: string): Promise<void> {
    const data = this.loadData()
    data.memories = data.memories.filter((m) => m.id !== memoryId)
    data.comments = data.comments.filter((c) => c.memoryId !== memoryId)
    this.saveData(data)
  }

  async createComment(input: CommentInput, authorId: string): Promise<void> {
    const data = this.loadData()
    const newComment: CommentRecord = {
      id: this.makeId('comment'),
      authorId,
      createdAt: new Date().toISOString().slice(0, 16),
      ...input,
    }
    data.comments.push(newComment)
    this.saveData(data)
  }

  async updateComment(commentId: string, input: CommentInput): Promise<void> {
    const data = this.loadData()
    data.comments = data.comments.map((comment) =>
      comment.id === commentId ? { ...comment, content: input.content } : comment
    )
    this.saveData(data)
  }

  async deleteComment(commentId: string): Promise<void> {
    const data = this.loadData()
    data.comments = data.comments.filter((c) => c.id !== commentId)
    this.saveData(data)
  }

  async updateProfileApproval(profileId: string, status: ApprovalStatus): Promise<void> {
    const data = this.loadData()
    data.profiles = data.profiles.map((profile) =>
      profile.id === profileId ? { ...profile, approvalStatus: status } : profile
    )
    this.saveData(data)
  }
}

/**
 * SupabaseRepository
 * @description Supabase Client를 주입받아 데이터베이스의 원격 실시간 동기화를 담당하는 프로덕션용 리포지토리입니다.
 */
export class SupabaseRepository implements MemoryTrainRepository {
  private readonly client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  async fetchProfiles(): Promise<UserProfile[]> {
    const { data, error } = await this.client
      .from('profiles')
      .select('id, auth_user_id, kakao_nickname, avatar_url, approval_status, role')
      .order('kakao_nickname')

    if (error) {
      throw error
    }

    return (data ?? []).map((row) => ({
      id: row.id as string,
      authUserId: row.auth_user_id as string,
      kakaoNickname: row.kakao_nickname as string,
      avatarUrl: (row.avatar_url as string | null) ?? '',
      approvalStatus: row.approval_status as ApprovalStatus,
      role: row.role as UserProfile['role'],
    }))
  }

  async fetchEvents(): Promise<EventRecord[]> {
    const { data, error } = await this.client
      .from('events')
      .select('*')
      .order('event_at', { ascending: false })

    if (error) {
      throw error
    }

    return (data ?? []).map((row) => ({
      id: row.id as string,
      title: row.title as string,
      eventAt: row.event_at as string,
      location: row.location as string,
      what: row.what as string,
      how: row.how as string,
      decisionSummary: row.decision_summary as string,
      createdBy: row.created_by as string,
    }))
  }

  async fetchMemories(): Promise<MemoryRecord[]> {
    const { data, error } = await this.client
      .from('memories')
      .select('*')
      .order('recorded_at', { ascending: false })

    if (error) {
      throw error
    }

    return (data ?? []).map((row) => ({
      id: row.id as string,
      eventId: row.event_id as string,
      authorId: row.author_id as string,
      photoUrl: row.photo_url as string,
      caption: row.caption as string,
      recordedAt: row.recorded_at as string,
    }))
  }

  async fetchComments(): Promise<CommentRecord[]> {
    const { data, error } = await this.client
      .from('comments')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    return (data ?? []).map((row) => ({
      id: row.id as string,
      memoryId: row.memory_id as string,
      authorId: row.author_id as string,
      content: row.content as string,
      createdAt: row.created_at as string,
    }))
  }

  async createEvent(input: EventInput, creatorId: string): Promise<void> {
    const { error } = await this.client.from('events').insert({
      title: input.title,
      event_at: input.eventAt,
      location: input.location,
      what: input.what,
      how: input.how,
      decision_summary: input.decisionSummary,
      created_by: creatorId,
    })

    if (error) {
      throw error
    }
  }

  async updateEvent(eventId: string, input: EventInput): Promise<void> {
    const { error } = await this.client
      .from('events')
      .update({
        title: input.title,
        event_at: input.eventAt,
        location: input.location,
        what: input.what,
        how: input.how,
        decision_summary: input.decisionSummary,
      })
      .eq('id', eventId)

    if (error) {
      throw error
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    const { error } = await this.client.from('events').delete().eq('id', eventId)
    if (error) {
      throw error
    }
  }

  async createMemory(input: MemoryInput, photoUrl: string, authorId: string): Promise<void> {
    const { error } = await this.client.from('memories').insert({
      event_id: input.eventId,
      author_id: authorId,
      photo_url: photoUrl,
      caption: input.caption,
      recorded_at: input.recordedAt,
    })

    if (error) {
      throw error
    }
  }

  async updateMemory(memoryId: string, input: MemoryInput, photoUrl: string): Promise<void> {
    const { error } = await this.client
      .from('memories')
      .update({
        event_id: input.eventId,
        caption: input.caption,
        recorded_at: input.recordedAt,
        photo_url: photoUrl,
      })
      .eq('id', memoryId)

    if (error) {
      throw error
    }
  }

  async deleteMemory(memoryId: string): Promise<void> {
    const { error } = await this.client.from('memories').delete().eq('id', memoryId)
    if (error) {
      throw error
    }
  }

  async createComment(input: CommentInput, authorId: string): Promise<void> {
    const { error } = await this.client.from('comments').insert({
      memory_id: input.memoryId,
      author_id: authorId,
      content: input.content,
    })

    if (error) {
      throw error
    }
  }

  async updateComment(commentId: string, input: CommentInput): Promise<void> {
    const { error } = await this.client
      .from('comments')
      .update({ content: input.content })
      .eq('id', commentId)

    if (error) {
      throw error
    }
  }

  async deleteComment(commentId: string): Promise<void> {
    const { error } = await this.client.from('comments').delete().eq('id', commentId)
    if (error) {
      throw error
    }
  }

  async updateProfileApproval(profileId: string, status: ApprovalStatus): Promise<void> {
    const { error } = await this.client
      .from('profiles')
      .update({ approval_status: status })
      .eq('id', profileId)

    if (error) {
      throw error
    }
  }
}

/**
 * CloudflareRepository
 * @description Cloudflare D1/R2/KV 기반 REST API 엔드포인트와 통신을 제어하는 에지 통합 리포지토리입니다.
 */
export class CloudflareRepository implements MemoryTrainRepository {
  private readonly apiUrl: string

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.apiUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers ?? {}),
      },
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Cloudflare API 에러 (${response.status}): ${errText}`)
    }

    return response.json() as Promise<T>
  }

  async fetchProfiles(): Promise<UserProfile[]> {
    return this.request<UserProfile[]>('/api/profiles')
  }

  async fetchEvents(): Promise<EventRecord[]> {
    return this.request<EventRecord[]>('/api/events')
  }

  async fetchMemories(): Promise<MemoryRecord[]> {
    return this.request<MemoryRecord[]>('/api/memories')
  }

  async fetchComments(): Promise<CommentRecord[]> {
    return this.request<CommentRecord[]>('/api/comments')
  }

  async createEvent(input: EventInput, creatorId: string): Promise<void> {
    await this.request<void>('/api/events', {
      method: 'POST',
      body: JSON.stringify({ ...input, createdBy: creatorId }),
    })
  }

  async updateEvent(eventId: string, input: EventInput): Promise<void> {
    await this.request<void>(`/api/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  }

  async deleteEvent(eventId: string): Promise<void> {
    await this.request<void>(`/api/events/${eventId}`, {
      method: 'DELETE',
    })
  }

  async createMemory(input: MemoryInput, photoUrl: string, authorId: string): Promise<void> {
    await this.request<void>('/api/memories', {
      method: 'POST',
      body: JSON.stringify({ ...input, photoUrl, authorId }),
    })
  }

  async updateMemory(memoryId: string, input: MemoryInput, photoUrl: string): Promise<void> {
    await this.request<void>(`/api/memories/${memoryId}`, {
      method: 'PUT',
      body: JSON.stringify({ ...input, photoUrl }),
    })
  }

  async deleteMemory(memoryId: string): Promise<void> {
    await this.request<void>(`/api/memories/${memoryId}`, {
      method: 'DELETE',
    })
  }

  async createComment(input: CommentInput, authorId: string): Promise<void> {
    await this.request<void>('/api/comments', {
      method: 'POST',
      body: JSON.stringify({ ...input, authorId }),
    })
  }

  async updateComment(commentId: string, input: CommentInput): Promise<void> {
    await this.request<void>(`/api/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  }

  async deleteComment(commentId: string): Promise<void> {
    await this.request<void>(`/api/comments/${commentId}`, {
      method: 'DELETE',
    })
  }

  async updateProfileApproval(profileId: string, status: ApprovalStatus): Promise<void> {
    await this.request<void>(`/api/profiles/${profileId}/approval`, {
      method: 'PUT',
      body: JSON.stringify({ approvalStatus: status }),
    })
  }
}
