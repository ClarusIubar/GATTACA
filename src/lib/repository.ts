import { initialDemoData } from './mock-data'
import type {
  ApprovalStatus,
  AppDataSnapshot,
  CommentInput,
  CommentRecord,
  EventInput,
  EventRecord,
  MemoryInput,
  MemoryRecord,
  UserProfile,
} from './types'

export interface MemoryTrainRepository {
  fetchProfiles(): Promise<UserProfile[]>
  fetchEvents(): Promise<EventRecord[]>
  fetchMemories(): Promise<MemoryRecord[]>
  fetchComments(): Promise<CommentRecord[]>
  createEvent(input: EventInput, creatorId: string): Promise<EventRecord>
  updateEvent(eventId: string, input: EventInput): Promise<void>
  deleteEvent(eventId: string): Promise<void>
  createMemory(input: MemoryInput, photoUrl: string, authorId: string): Promise<void>
  updateMemory(memoryId: string, input: MemoryInput, photoUrl: string): Promise<void>
  deleteMemory(memoryId: string): Promise<void>
  createComment(input: CommentInput, authorId: string): Promise<void>
  updateComment(commentId: string, input: CommentInput): Promise<void>
  deleteComment(commentId: string): Promise<void>
  updateProfileApproval(profileId: string, status: ApprovalStatus): Promise<void>
}

function createSetupError(): Error {
  return new Error('Cloudflare API 설정이 없어 실사용 모드로 실행할 수 없습니다.')
}

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

  async createEvent(input: EventInput, creatorId: string): Promise<EventRecord> {
    const data = this.loadData()
    const newEvent: EventRecord = {
      id: this.makeId('event'),
      createdBy: creatorId,
      ...input,
    }
    data.events.unshift(newEvent)
    this.saveData(data)
    return newEvent
  }

  async updateEvent(eventId: string, input: EventInput): Promise<void> {
    const data = this.loadData()
    data.events = data.events.map((event) => (event.id === eventId ? { ...event, ...input } : event))
    this.saveData(data)
  }

  async deleteEvent(eventId: string): Promise<void> {
    const data = this.loadData()
    const memoriesToDelete = data.memories.filter((memory) => memory.eventId === eventId).map((memory) => memory.id)

    data.events = data.events.filter((event) => event.id !== eventId)
    data.memories = data.memories.filter((memory) => memory.eventId !== eventId)
    data.comments = data.comments.filter((comment) => !memoriesToDelete.includes(comment.memoryId))

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
      memory.id === memoryId ? { ...memory, ...input, photoUrl } : memory,
    )
    this.saveData(data)
  }

  async deleteMemory(memoryId: string): Promise<void> {
    const data = this.loadData()
    data.memories = data.memories.filter((memory) => memory.id !== memoryId)
    data.comments = data.comments.filter((comment) => comment.memoryId !== memoryId)
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
      comment.id === commentId ? { ...comment, content: input.content } : comment,
    )
    this.saveData(data)
  }

  async deleteComment(commentId: string): Promise<void> {
    const data = this.loadData()
    data.comments = data.comments.filter((comment) => comment.id !== commentId)
    this.saveData(data)
  }

  async updateProfileApproval(profileId: string, status: ApprovalStatus): Promise<void> {
    const data = this.loadData()
    data.profiles = data.profiles.map((profile) =>
      profile.id === profileId ? { ...profile, approvalStatus: status } : profile,
    )
    this.saveData(data)
  }
}

export class UnconfiguredRepository implements MemoryTrainRepository {
  async fetchProfiles(): Promise<UserProfile[]> {
    return []
  }

  async fetchEvents(): Promise<EventRecord[]> {
    return []
  }

  async fetchMemories(): Promise<MemoryRecord[]> {
    return []
  }

  async fetchComments(): Promise<CommentRecord[]> {
    return []
  }

  async createEvent(_input: EventInput, _creatorId: string): Promise<EventRecord> {
    void _input
    void _creatorId
    throw createSetupError()
  }

  async updateEvent(_eventId: string, _input: EventInput): Promise<void> {
    void _eventId
    void _input
    throw createSetupError()
  }

  async deleteEvent(_eventId: string): Promise<void> {
    void _eventId
    throw createSetupError()
  }

  async createMemory(_input: MemoryInput, _photoUrl: string, _authorId: string): Promise<void> {
    void _input
    void _photoUrl
    void _authorId
    throw createSetupError()
  }

  async updateMemory(_memoryId: string, _input: MemoryInput, _photoUrl: string): Promise<void> {
    void _memoryId
    void _input
    void _photoUrl
    throw createSetupError()
  }

  async deleteMemory(_memoryId: string): Promise<void> {
    void _memoryId
    throw createSetupError()
  }

  async createComment(_input: CommentInput, _authorId: string): Promise<void> {
    void _input
    void _authorId
    throw createSetupError()
  }

  async updateComment(_commentId: string, _input: CommentInput): Promise<void> {
    void _commentId
    void _input
    throw createSetupError()
  }

  async deleteComment(_commentId: string): Promise<void> {
    void _commentId
    throw createSetupError()
  }

  async updateProfileApproval(_profileId: string, _status: ApprovalStatus): Promise<void> {
    void _profileId
    void _status
    throw createSetupError()
  }
}

export class CloudflareRepository implements MemoryTrainRepository {
  private readonly apiUrl: string

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.apiUrl}${path}`, {
      credentials: 'include',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers ?? {}),
      },
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Cloudflare API 오류 (${response.status}): ${errText}`)
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

  async createEvent(input: EventInput, _creatorId: string): Promise<EventRecord> {
    void _creatorId
    const response = await this.request<{ ok: true; event: EventRecord }>('/api/events', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return response.event
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

  async createMemory(input: MemoryInput, photoUrl: string, _authorId: string): Promise<void> {
    void _authorId
    await this.request<void>('/api/memories', {
      method: 'POST',
      body: JSON.stringify({ ...input, photoUrl }),
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

  async createComment(input: CommentInput, _authorId: string): Promise<void> {
    void _authorId
    await this.request<void>('/api/comments', {
      method: 'POST',
      body: JSON.stringify(input),
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
