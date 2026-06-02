import { createContext, useCallback, useContext, useEffect, useState, type PropsWithChildren } from 'react'
import { appEnv, isCloudflareConfigured, isDemoModeEnabled } from './env'
import { sendKakaoMessage } from './notification'
import {
  CloudflareRepository,
  DemoRepository,
  UnconfiguredRepository,
  type MemoryTrainRepository,
} from './repository'
import type {
  AuthMode,
  CommentInput,
  CommentRecord,
  DemoPersona,
  EventInput,
  EventRecord,
  MemoryInput,
  MemoryRecord,
  RuntimeStatus,
  UserProfile,
} from './types'

const DEMO_PERSONA_KEY = 'memory-train-demo-persona'

interface AppContextValue {
  authMode: AuthMode
  isConfigured: boolean
  isLoading: boolean
  errorMessage: string
  runtimeStatus: RuntimeStatus | null
  currentUser: UserProfile | null
  demoPersona: DemoPersona
  events: EventRecord[]
  memories: MemoryRecord[]
  comments: CommentRecord[]
  profiles: UserProfile[]
  isApproved: boolean
  isAdmin: boolean
  setDemoPersona: (persona: DemoPersona) => void
  signInWithKakao: () => Promise<void>
  signOut: () => Promise<void>
  createEvent: (input: EventInput) => Promise<void>
  updateEvent: (eventId: string, input: EventInput) => Promise<void>
  deleteEvent: (eventId: string) => Promise<void>
  createMemory: (input: MemoryInput, photoFile: File | null, photoUrl: string) => Promise<void>
  updateMemory: (
    memoryId: string,
    input: MemoryInput,
    photoFile: File | null,
    photoUrl: string,
  ) => Promise<void>
  deleteMemory: (memoryId: string) => Promise<void>
  createComment: (input: CommentInput) => Promise<void>
  updateComment: (commentId: string, input: CommentInput) => Promise<void>
  deleteComment: (commentId: string) => Promise<void>
  updateProfileApproval: (profileId: string, status: UserProfile['approvalStatus']) => Promise<void>
  refreshData: () => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

function loadDemoPersona(): DemoPersona {
  const raw = localStorage.getItem(DEMO_PERSONA_KEY)
  if (raw === 'guest' || raw === 'pending' || raw === 'approved' || raw === 'admin') {
    return raw
  }
  return 'guest'
}

function sessionProfileToUserProfile(
  session: {
    profile: {
      profileId: string
      authUserId: string
      role: UserProfile['role']
      approvalStatus: UserProfile['approvalStatus']
      kakaoNickname: string
      avatarUrl: string
    }
  } | null,
): UserProfile | null {
  if (!session) {
    return null
  }

  return {
    id: session.profile.profileId,
    authUserId: session.profile.authUserId,
    role: session.profile.role,
    approvalStatus: session.profile.approvalStatus,
    kakaoNickname: session.profile.kakaoNickname,
    avatarUrl: session.profile.avatarUrl,
  }
}

async function fetchCloudflareSession(apiUrl: string): Promise<UserProfile | null> {
  const response = await fetch(`${apiUrl}/api/session`, {
    credentials: 'include',
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`세션 조회 실패 (${response.status}): ${errText}`)
  }

  const payload = (await response.json()) as {
    authenticated: boolean
    session: {
      profile: {
        profileId: string
        authUserId: string
        role: UserProfile['role']
        approvalStatus: UserProfile['approvalStatus']
        kakaoNickname: string
        avatarUrl: string
      }
    } | null
  }

  if (!payload.authenticated || !payload.session) {
    return null
  }

  return sessionProfileToUserProfile(payload.session)
}

async function fetchCloudflareRuntimeStatus(apiUrl: string): Promise<RuntimeStatus> {
  const response = await fetch(`${apiUrl}/api/runtime-status`, {
    credentials: 'include',
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`런타임 상태 조회 실패 (${response.status}): ${errText}`)
  }

  return (await response.json()) as RuntimeStatus
}

function resolveAuthMode(): AuthMode {
  if (isCloudflareConfigured) {
    return 'cloudflare'
  }
  if (isDemoModeEnabled) {
    return 'demo'
  }
  return 'setup'
}

function createRepository(authMode: AuthMode): MemoryTrainRepository {
  if (authMode === 'cloudflare') {
    return new CloudflareRepository(appEnv.cloudflareApiUrl)
  }
  if (authMode === 'demo') {
    return new DemoRepository()
  }
  return new UnconfiguredRepository()
}

export function AppProvider({ children }: PropsWithChildren) {
  const [authMode] = useState<AuthMode>(resolveAuthMode)
  const [demoPersona, setDemoPersonaState] = useState<DemoPersona>(() =>
    authMode === 'demo' ? loadDemoPersona() : 'guest',
  )
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [events, setEvents] = useState<EventRecord[]>([])
  const [memories, setMemories] = useState<MemoryRecord[]>([])
  const [comments, setComments] = useState<CommentRecord[]>([])
  const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatus | null>(null)
  const [externalCurrentUser, setExternalCurrentUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(authMode === 'cloudflare')
  const [errorMessage, setErrorMessage] = useState('')
  const [repository] = useState<MemoryTrainRepository>(() => createRepository(authMode))

  function setDemoPersona(persona: DemoPersona) {
    if (authMode !== 'demo') {
      return
    }
    setDemoPersonaState(persona)
    localStorage.setItem(DEMO_PERSONA_KEY, persona)
  }

  const demoCurrentUser =
    demoPersona === 'guest'
      ? null
      : profiles.find(
          (profile) => profile.id === `profile-${demoPersona === 'approved' ? 'member' : demoPersona}`,
        ) ?? null

  const resolvedCurrentUser = authMode === 'demo' ? demoCurrentUser : externalCurrentUser
  const isApproved = resolvedCurrentUser?.approvalStatus === 'approved'
  const isAdmin = resolvedCurrentUser?.role === 'admin'

  const fetchRemoteData = useCallback(async () => {
    try {
      const [nextProfiles, nextEvents, nextMemories, nextComments] = await Promise.all([
        repository.fetchProfiles(),
        repository.fetchEvents(),
        repository.fetchMemories(),
        repository.fetchComments(),
      ])

      setProfiles(nextProfiles)
      setEvents(nextEvents)
      setMemories(nextMemories)
      setComments(nextComments)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [repository])

  useEffect(() => {
    let disposed = false

    async function bootstrap() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        if (authMode === 'cloudflare') {
          const [sessionUser, nextRuntimeStatus] = await Promise.all([
            fetchCloudflareSession(appEnv.cloudflareApiUrl),
            fetchCloudflareRuntimeStatus(appEnv.cloudflareApiUrl),
          ])
          if (!disposed) {
            setExternalCurrentUser(sessionUser)
            setRuntimeStatus(nextRuntimeStatus)
          }
        }

        await fetchRemoteData()
      } catch (error) {
        if (!disposed) {
          setErrorMessage(error instanceof Error ? error.message : '초기화 중 문제가 발생했습니다.')
        }
      } finally {
        if (!disposed) {
          setIsLoading(false)
        }
      }
    }

    void bootstrap()

    return () => {
      disposed = true
    }
  }, [authMode, fetchRemoteData])

  async function refreshData() {
    await fetchRemoteData()
  }

  function getWriter() {
    if (!resolvedCurrentUser || (!isApproved && !isAdmin)) {
      throw new Error('승인된 사용자만 작성할 수 있습니다.')
    }
    return resolvedCurrentUser
  }

  function getAdmin() {
    if (!resolvedCurrentUser || !isAdmin) {
      throw new Error('운영자만 수행할 수 있습니다.')
    }
    return resolvedCurrentUser
  }

  async function createEvent(input: EventInput) {
    const writer = getWriter()
    const createdEvent = await repository.createEvent(input, writer.id)
    await refreshData()

    const notificationPayload = {
      text: `[추억열차] 새 일정 '${input.title}'이 등록되었습니다. 장소: ${input.location}`,
      buttonTitle: '추억 보러가기',
      buttonUrl: `${window.location.origin}/events/${createdEvent.id}`,
    }

    if (authMode === 'demo') {
      void sendKakaoMessage(notificationPayload, { mode: 'mock' })
      return
    }

    if (authMode === 'cloudflare') {
      const result = await sendKakaoMessage(notificationPayload, {
        mode: 'worker-relay',
        apiUrl: appEnv.cloudflareApiUrl,
      })

      if (!result.success) {
        throw new Error(`일정은 저장됐지만 카카오 알림 전송은 실패했습니다. ${result.error ?? ''}`.trim())
      }
    }
  }

  async function updateEvent(eventId: string, input: EventInput) {
    const writer = getWriter()
    const target = events.find((event) => event.id === eventId)
    if (!target) {
      return
    }

    if (!isAdmin && target.createdBy !== writer.id) {
      throw new Error('작성자 또는 운영자만 수정할 수 있습니다.')
    }

    await repository.updateEvent(eventId, input)
    await refreshData()
  }

  async function deleteEvent(eventId: string) {
    getAdmin()
    await repository.deleteEvent(eventId)
    await refreshData()
  }

  async function resolvePhotoUrl(photoFile: File | null, fallbackPhotoUrl: string) {
    if (!photoFile) {
      return fallbackPhotoUrl
    }

    if (authMode === 'demo') {
      return URL.createObjectURL(photoFile)
    }

    if (authMode === 'cloudflare') {
      if (!resolvedCurrentUser) {
        throw new Error('사진 업로드를 진행할 수 없습니다.')
      }

      const formData = new FormData()
      formData.append('file', photoFile)

      const response = await fetch(`${appEnv.cloudflareApiUrl}/api/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`R2 업로드 실패: ${errText}`)
      }

      const result = (await response.json()) as { publicUrl: string }
      return result.publicUrl
    }

    throw new Error('사진 업로드를 진행할 수 없습니다.')
  }

  async function createMemory(input: MemoryInput, photoFile: File | null, photoUrl: string) {
    const writer = getWriter()
    const resolvedPhotoUrl = await resolvePhotoUrl(photoFile, photoUrl)
    await repository.createMemory(input, resolvedPhotoUrl, writer.id)
    await refreshData()
  }

  async function updateMemory(
    memoryId: string,
    input: MemoryInput,
    photoFile: File | null,
    photoUrl: string,
  ) {
    const writer = getWriter()
    const target = memories.find((memory) => memory.id === memoryId)
    if (!target) {
      return
    }

    if (!isAdmin && target.authorId !== writer.id) {
      throw new Error('작성자 또는 운영자만 수정할 수 있습니다.')
    }

    const resolvedPhotoUrl = await resolvePhotoUrl(photoFile, photoUrl || target.photoUrl)
    await repository.updateMemory(memoryId, input, resolvedPhotoUrl)
    await refreshData()
  }

  async function deleteMemory(memoryId: string) {
    getAdmin()
    await repository.deleteMemory(memoryId)
    await refreshData()
  }

  async function createComment(input: CommentInput) {
    const writer = getWriter()
    await repository.createComment(input, writer.id)
    await refreshData()
  }

  async function updateComment(commentId: string, input: CommentInput) {
    const writer = getWriter()
    const target = comments.find((comment) => comment.id === commentId)
    if (!target) {
      return
    }

    if (!isAdmin && target.authorId !== writer.id) {
      throw new Error('작성자 또는 운영자만 수정할 수 있습니다.')
    }

    await repository.updateComment(commentId, input)
    await refreshData()
  }

  async function deleteComment(commentId: string) {
    getAdmin()
    await repository.deleteComment(commentId)
    await refreshData()
  }

  async function updateProfileApproval(profileId: string, status: UserProfile['approvalStatus']) {
    getAdmin()
    await repository.updateProfileApproval(profileId, status)
    await refreshData()
  }

  async function signInWithKakao() {
    if (authMode === 'cloudflare') {
      if (runtimeStatus && !runtimeStatus.auth.kakaoOAuthConfigured) {
        throw new Error('Kakao OAuth 시크릿이 아직 Worker에 설정되지 않았습니다.')
      }
      window.location.href = `${appEnv.cloudflareApiUrl}/api/auth/kakao?redirect_uri=${encodeURIComponent(
        window.location.origin,
      )}`
    }
  }

  async function signOut() {
    if (authMode === 'cloudflare') {
      setExternalCurrentUser(null)
      try {
        await fetch(`${appEnv.cloudflareApiUrl}/api/auth/logout`, {
          method: 'POST',
          credentials: 'include',
        })
      } catch (error) {
        console.warn('Cloudflare logout API error:', error)
      }
    }
  }

  const value: AppContextValue = {
    authMode,
    isConfigured: authMode !== 'setup',
    isLoading,
    errorMessage,
    runtimeStatus,
    currentUser: resolvedCurrentUser,
    demoPersona,
    events,
    memories,
    comments,
    profiles,
    isApproved,
    isAdmin,
    setDemoPersona,
    signInWithKakao,
    signOut,
    createEvent,
    updateEvent,
    deleteEvent,
    createMemory,
    updateMemory,
    deleteMemory,
    createComment,
    updateComment,
    deleteComment,
    updateProfileApproval,
    refreshData,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('AppProvider 내부에서 useAppContext를 사용해야 합니다.')
  }
  return context
}
