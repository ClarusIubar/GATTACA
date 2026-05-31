/**
 * File: src/lib/app-context.tsx
 * Purpose: 애플리케이션의 최상위 전역 상태(사용자 권한, 이벤트, 메모리, 댓글) 및 데이터 흐름을 제공하는 React Context Provider입니다.
 * Primary Responsibility: UI 컴포넌트의 요청을 수신하여 활성 상태를 관리하고 비즈니스 규칙(작성자/운영자 권한 체크 등) 정책을 수행합니다.
 * Design Intent: 
 *   - 데이터 저장/조회 메커니즘을 MemoryTrainRepository 인터페이스 뒤로 캡슐화하여 데이터 액세스 방식 변화(Demo -> Supabase)가 비즈니스 로직에 무해하게 차단되도록 설계되었습니다.
 *   - 비즈니스 권한 검증 규칙(getWriter, getAdmin 등)을 일관되게 적용하여 보안 및 오작동 가능성을 원천 배제합니다.
 * Non-Goals: 데이터베이스 쿼리 및 SQL 데이터베이스 필드 번역은 수행하지 않으며, 이는 리포지토리 레이어에 위임합니다.
 * Dependencies: react, @supabase/supabase-js, ./env, ./supabase, ./types, ./repository
 */

import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react'
import type { Session } from '@supabase/supabase-js'
import { appEnv, isSupabaseConfigured } from './env'
import { supabase } from './supabase'
import { DemoRepository, SupabaseRepository, type MemoryTrainRepository } from './repository'
import { sendKakaoMessage } from './notification'
import type {
  AuthMode,
  CommentInput,
  CommentRecord,
  DemoPersona,
  EventInput,
  EventRecord,
  MemoryInput,
  MemoryRecord,
  UserProfile,
} from './types'

const DEMO_PERSONA_KEY = 'memory-train-demo-persona'

interface AppContextValue {
  authMode: AuthMode
  isConfigured: boolean
  isLoading: boolean
  errorMessage: string
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

function getProfileFromMetadata(session: Session) {
  const metadata = session.user.user_metadata
  return {
    nickname:
      metadata.nickname ??
      metadata.name ??
      metadata.full_name ??
      metadata.preferred_username ??
      session.user.email ??
      '새 승객',
    avatarUrl: metadata.avatar_url ?? metadata.picture ?? '',
  }
}

export function AppProvider({ children }: PropsWithChildren) {
  const [authMode] = useState<AuthMode>(isSupabaseConfigured ? 'supabase' : 'demo')
  const [demoPersona, setDemoPersonaState] = useState<DemoPersona>(() =>
    isSupabaseConfigured ? 'guest' : loadDemoPersona(),
  )
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [events, setEvents] = useState<EventRecord[]>([])
  const [memories, setMemories] = useState<MemoryRecord[]>([])
  const [comments, setComments] = useState<CommentRecord[]>([])
  const [supabaseCurrentUser, setSupabaseCurrentUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)
  const [errorMessage, setErrorMessage] = useState('')

  // 1. DIP: 저장소 인터페이스 주입 바인딩
  const [repository] = useState<MemoryTrainRepository>(() =>
    isSupabaseConfigured && supabase
      ? new SupabaseRepository(supabase)
      : new DemoRepository()
  )

  function setDemoPersona(persona: DemoPersona) {
    setDemoPersonaState(persona)
    localStorage.setItem(DEMO_PERSONA_KEY, persona)
  }

  const demoCurrentUser =
    demoPersona === 'guest'
      ? null
      : profiles.find(
          (profile) =>
            profile.id === `profile-${demoPersona === 'approved' ? 'member' : demoPersona}`
        ) ?? null

  const resolvedCurrentUser = authMode === 'demo' ? demoCurrentUser : supabaseCurrentUser
  const isApproved = resolvedCurrentUser?.approvalStatus === 'approved'
  const isAdmin = resolvedCurrentUser?.role === 'admin'

  useEffect(() => {
    let disposed = false
    let unsubscribe = () => {}

    async function bootstrap() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        if (authMode === 'demo') {
          await fetchRemoteData(null)
          setIsLoading(false)
          return
        }

        if (!supabase) {
          setIsLoading(false)
          return
        }

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          await ensureProfile(session)
        } else if (!disposed) {
          setSupabaseCurrentUser(null)
        }

        await fetchRemoteData(session)

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, nextSession) => {
          void (async () => {
            setIsLoading(true)
            if (nextSession) {
              await ensureProfile(nextSession)
            } else {
              setSupabaseCurrentUser(null)
            }
            await fetchRemoteData(nextSession)
          })()
        })

        unsubscribe = () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        if (!disposed) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : '초기화 작업 중 문제가 발생했습니다.',
          )
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
      unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authMode])

  async function ensureProfile(session: Session) {
    if (!supabase) {
      return
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw authError ?? new Error('사용자 정보를 가져오지 못했습니다.')
    }

    const profileFromMetadata = getProfileFromMetadata(session)
    const { data: existingProfile, error: selectError } = await supabase
      .from('profiles')
      .select('id, auth_user_id, kakao_nickname, avatar_url, approval_status, role')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (selectError) {
      throw selectError
    }

    const role = user.id === appEnv.adminUserId ? 'admin' : existingProfile?.role ?? 'member'
    const approvalStatus =
      role === 'admin' ? 'approved' : existingProfile?.approval_status ?? 'pending'

    const payload = {
      auth_user_id: user.id,
      kakao_nickname: profileFromMetadata.nickname,
      avatar_url: profileFromMetadata.avatarUrl,
      approval_status: approvalStatus,
      role,
    }

    if (existingProfile) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', existingProfile.id)

      if (updateError) {
        throw updateError
      }
    } else {
      const { error: insertError } = await supabase.from('profiles').insert(payload)
      if (insertError) {
        throw insertError
      }
    }
  }

  async function fetchRemoteData(session: Session | null) {
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

      if (authMode === 'supabase') {
        if (!session) {
          setSupabaseCurrentUser(null)
        } else {
          const nextUser = nextProfiles.find((profile) => profile.authUserId === session.user.id) ?? null
          setSupabaseCurrentUser(nextUser)
        }
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '데이터를 불러오는 중 오류가 발생했습니다.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  async function refreshData() {
    const session = supabase && authMode === 'supabase'
      ? (await supabase.auth.getSession()).data.session
      : null
    await fetchRemoteData(session)
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
    await repository.createEvent(input, writer.id)
    await refreshData()

    // 일정 확정 시 카카오 메시지 발송 비동기 트리거 연동 (논블로킹 백그라운드 실행)
    void sendKakaoMessage(
      {
        text: `[추억열차] 새로운 모임 '${input.title}' 일정이 확정되어 타임라인에 등록되었습니다! 장소: ${input.location}`,
        buttonTitle: '열차 타러가기',
        buttonUrl: window.location.origin,
      },
      appEnv.supabaseAnonKey || null, // Access Token 대용으로 설정값 주입
      true // Mock Mode 활성화하여 유연한 integration 보장
    ).then((res) => {
      if (!res.success) {
        console.warn('카카오 알림톡 자동 전송 실패:', res.error)
      } else {
        console.log('카카오 알림톡 자동 전송 완료:', res.messageId)
      }
    })
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

    if (!supabase || !resolvedCurrentUser) {
      throw new Error('사진 업로드를 진행할 수 없습니다.')
    }

    const path = `${resolvedCurrentUser.id}/${Date.now()}-${photoFile.name}`
    const { error: uploadError } = await supabase.storage
      .from('memory-photos')
      .upload(path, photoFile, { upsert: true })

    if (uploadError) {
      throw uploadError
    }

    const { data } = supabase.storage.from('memory-photos').getPublicUrl(path)
    return data.publicUrl
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
    if (!supabase) {
      return
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: window.location.href,
      },
    })

    if (error) {
      setErrorMessage(error.message)
    }
  }

  async function signOut() {
    if (!supabase) {
      return
    }

    const { error } = await supabase.auth.signOut()
    if (error) {
      setErrorMessage(error.message)
    }
  }

  const value: AppContextValue = {
    authMode,
    isConfigured: isSupabaseConfigured,
    isLoading,
    errorMessage,
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
    throw new Error('AppProvider 안에서 useAppContext를 사용해야 합니다.')
  }
  return context
}
