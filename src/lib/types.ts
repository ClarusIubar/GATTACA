export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type UserRole = 'admin' | 'member'
export type DemoPersona = 'guest' | 'pending' | 'approved' | 'admin'
export type AuthMode = 'demo' | 'supabase'

export interface UserProfile {
  id: string
  authUserId: string
  kakaoNickname: string
  avatarUrl: string
  approvalStatus: ApprovalStatus
  role: UserRole
}

export interface EventRecord {
  id: string
  title: string
  eventAt: string
  location: string
  what: string
  how: string
  decisionSummary: string
  createdBy: string
}

export interface MemoryRecord {
  id: string
  eventId: string
  authorId: string
  photoUrl: string
  caption: string
  recordedAt: string
}

export interface CommentRecord {
  id: string
  memoryId: string
  authorId: string
  content: string
  createdAt: string
}

export interface EventInput {
  title: string
  eventAt: string
  location: string
  what: string
  how: string
  decisionSummary: string
}

export interface MemoryInput {
  eventId: string
  caption: string
  recordedAt: string
}

export interface CommentInput {
  memoryId: string
  content: string
}

export interface AppDataSnapshot {
  profiles: UserProfile[]
  events: EventRecord[]
  memories: MemoryRecord[]
  comments: CommentRecord[]
}
