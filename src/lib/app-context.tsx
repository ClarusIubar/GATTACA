import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react'
import type { Session } from '@supabase/supabase-js'
import { appEnv, isSupabaseConfigured } from './env'
import { initialDemoData } from './mock-data'
import { supabase } from './supabase'
import type {
  AppDataSnapshot,
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

const DEMO_DATA_KEY = 'memory-train-demo-data'
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

function loadDemoData() {
  const raw = localStorage.getItem(DEMO_DATA_KEY)
  if (!raw) {
    return initialDemoData
  }

  try {
    return JSON.parse(raw) as AppDataSnapshot
  } catch {
    return initialDemoData
  }
}

function saveDemoData(snapshot: AppDataSnapshot) {
  localStorage.setItem(DEMO_DATA_KEY, JSON.stringify(snapshot))
}

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

function makeId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

export function AppProvider({ children }: PropsWithChildren) {
  const [authMode] = useState<AuthMode>(isSupabaseConfigured ? 'supabase' : 'demo')
  const [demoPersona, setDemoPersonaState] = useState<DemoPersona>(() =>
    isSupabaseConfigured ? 'guest' : loadDemoPersona(),
  )
  const [demoData, setDemoData] = useState<AppDataSnapshot>(() =>
    isSupabaseConfigured ? initialDemoData : loadDemoData(),
  )
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [events, setEvents] = useState<EventRecord[]>([])
  const [memories, setMemories] = useState<MemoryRecord[]>([])
  const [comments, setComments] = useState<CommentRecord[]>([])
  const [supabaseCurrentUser, setSupabaseCurrentUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)
  const [errorMessage, setErrorMessage] = useState('')

  function setDemoPersona(persona: DemoPersona) {
    setDemoPersonaState(persona)
    localStorage.setItem(DEMO_PERSONA_KEY, persona)
  }

  function persistDemo(nextSnapshot: AppDataSnapshot) {
    setDemoData(nextSnapshot)
    saveDemoData(nextSnapshot)
  }

  const demoProfiles = demoData.profiles
  const demoEvents = [...demoData.events].sort((left, right) => right.eventAt.localeCompare(left.eventAt))
  const demoMemories = [...demoData.memories].sort((left, right) =>
    right.recordedAt.localeCompare(left.recordedAt),
  )
  const demoComments = [...demoData.comments].sort((left, right) =>
    left.createdAt.localeCompare(right.createdAt),
  )
  const demoCurrentUser =
    demoPersona === 'guest'
      ? null
      : demoProfiles.find((profile) => profile.id === `profile-${demoPersona}`) ?? null

  const resolvedProfiles = authMode === 'demo' ? demoProfiles : profiles
  const resolvedEvents = authMode === 'demo' ? demoEvents : events
  const resolvedMemories = authMode === 'demo' ? demoMemories : memories
  const resolvedComments = authMode === 'demo' ? demoComments : comments
  const resolvedCurrentUser = authMode === 'demo' ? demoCurrentUser : supabaseCurrentUser
  const isApproved = resolvedCurrentUser?.approvalStatus === 'approved'
  const isAdmin = resolvedCurrentUser?.role === 'admin'

  useEffect(() => {
    if (authMode === 'demo') {
      return
    }

    let disposed = false
    let unsubscribe = () => {}

    async function bootstrapSupabase() {
      if (!supabase) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setErrorMessage('')

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
    }

    void bootstrapSupabase()

    return () => {
      disposed = true
      unsubscribe()
    }
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
    if (!supabase) {
      return
    }

    try {
      const [profilesResult, eventsResult, memoriesResult, commentsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, auth_user_id, kakao_nickname, avatar_url, approval_status, role')
          .order('kakao_nickname'),
        supabase.from('events').select('*').order('event_at', { ascending: false }),
        supabase.from('memories').select('*').order('recorded_at', { ascending: false }),
        supabase.from('comments').select('*').order('created_at', { ascending: true }),
      ])

      if (profilesResult.error || eventsResult.error || memoriesResult.error || commentsResult.error) {
        throw (
          profilesResult.error ??
          eventsResult.error ??
          memoriesResult.error ??
          commentsResult.error
        )
      }

      const nextProfiles = (profilesResult.data ?? []).map((profile) => ({
        id: profile.id as string,
        authUserId: profile.auth_user_id as string,
        kakaoNickname: profile.kakao_nickname as string,
        avatarUrl: (profile.avatar_url as string | null) ?? '',
        approvalStatus: profile.approval_status as UserProfile['approvalStatus'],
        role: profile.role as UserProfile['role'],
      }))

      setProfiles(nextProfiles)
      setEvents(
        (eventsResult.data ?? []).map((event) => ({
          id: event.id as string,
          title: event.title as string,
          eventAt: event.event_at as string,
          location: event.location as string,
          what: event.what as string,
          how: event.how as string,
          decisionSummary: event.decision_summary as string,
          createdBy: event.created_by as string,
        })),
      )
      setMemories(
        (memoriesResult.data ?? []).map((memory) => ({
          id: memory.id as string,
          eventId: memory.event_id as string,
          authorId: memory.author_id as string,
          photoUrl: memory.photo_url as string,
          caption: memory.caption as string,
          recordedAt: memory.recorded_at as string,
        })),
      )
      setComments(
        (commentsResult.data ?? []).map((comment) => ({
          id: comment.id as string,
          memoryId: comment.memory_id as string,
          authorId: comment.author_id as string,
          content: comment.content as string,
          createdAt: comment.created_at as string,
        })),
      )

      if (!session) {
        setSupabaseCurrentUser(null)
      } else {
        const nextUser = nextProfiles.find((profile) => profile.authUserId === session.user.id) ?? null
        setSupabaseCurrentUser(nextUser)
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Supabase 데이터를 불러오는 중 오류가 발생했습니다.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  async function refreshData() {
    if (authMode === 'demo') {
      return
    }

    if (supabase) {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      await fetchRemoteData(session)
    }
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

    if (authMode === 'demo') {
      persistDemo({
        ...demoData,
        events: [{ id: makeId('event'), createdBy: writer.id, ...input }, ...demoData.events],
      })
      return
    }

    if (!supabase) {
      return
    }

    const { error } = await supabase.from('events').insert({
      title: input.title,
      event_at: input.eventAt,
      location: input.location,
      what: input.what,
      how: input.how,
      decision_summary: input.decisionSummary,
      created_by: writer.id,
    })

    if (error) {
      throw error
    }

    await refreshData()
  }

  async function updateEvent(eventId: string, input: EventInput) {
    const writer = getWriter()
    const target = resolvedEvents.find((event) => event.id === eventId)
    if (!target) {
      return
    }

    if (!isAdmin && target.createdBy !== writer.id) {
      throw new Error('작성자 또는 운영자만 수정할 수 있습니다.')
    }

    if (authMode === 'demo') {
      persistDemo({
        ...demoData,
        events: demoData.events.map((event) => (event.id === eventId ? { ...event, ...input } : event)),
      })
      return
    }

    if (!supabase) {
      return
    }

    const { error } = await supabase
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

    await refreshData()
  }

  async function deleteEvent(eventId: string) {
    getAdmin()

    if (authMode === 'demo') {
      const memoryIds = demoData.memories
        .filter((memory) => memory.eventId === eventId)
        .map((memory) => memory.id)

      persistDemo({
        profiles: demoData.profiles,
        events: demoData.events.filter((event) => event.id !== eventId),
        memories: demoData.memories.filter((memory) => memory.eventId !== eventId),
        comments: demoData.comments.filter((comment) => !memoryIds.includes(comment.memoryId)),
      })
      return
    }

    if (!supabase) {
      return
    }

    const { error } = await supabase.from('events').delete().eq('id', eventId)
    if (error) {
      throw error
    }

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

    if (authMode === 'demo') {
      persistDemo({
        ...demoData,
        memories: [
          { id: makeId('memory'), authorId: writer.id, photoUrl: resolvedPhotoUrl, ...input },
          ...demoData.memories,
        ],
      })
      return
    }

    if (!supabase) {
      return
    }

    const { error } = await supabase.from('memories').insert({
      event_id: input.eventId,
      author_id: writer.id,
      photo_url: resolvedPhotoUrl,
      caption: input.caption,
      recorded_at: input.recordedAt,
    })

    if (error) {
      throw error
    }

    await refreshData()
  }

  async function updateMemory(
    memoryId: string,
    input: MemoryInput,
    photoFile: File | null,
    photoUrl: string,
  ) {
    const writer = getWriter()
    const target = resolvedMemories.find((memory) => memory.id === memoryId)
    if (!target) {
      return
    }

    if (!isAdmin && target.authorId !== writer.id) {
      throw new Error('작성자 또는 운영자만 수정할 수 있습니다.')
    }

    const resolvedPhotoUrl = await resolvePhotoUrl(photoFile, photoUrl || target.photoUrl)

    if (authMode === 'demo') {
      persistDemo({
        ...demoData,
        memories: demoData.memories.map((memory) =>
          memory.id === memoryId ? { ...memory, ...input, photoUrl: resolvedPhotoUrl } : memory,
        ),
      })
      return
    }

    if (!supabase) {
      return
    }

    const { error } = await supabase
      .from('memories')
      .update({
        event_id: input.eventId,
        caption: input.caption,
        recorded_at: input.recordedAt,
        photo_url: resolvedPhotoUrl,
      })
      .eq('id', memoryId)

    if (error) {
      throw error
    }

    await refreshData()
  }

  async function deleteMemory(memoryId: string) {
    getAdmin()

    if (authMode === 'demo') {
      persistDemo({
        profiles: demoData.profiles,
        events: demoData.events,
        memories: demoData.memories.filter((memory) => memory.id !== memoryId),
        comments: demoData.comments.filter((comment) => comment.memoryId !== memoryId),
      })
      return
    }

    if (!supabase) {
      return
    }

    const { error } = await supabase.from('memories').delete().eq('id', memoryId)
    if (error) {
      throw error
    }

    await refreshData()
  }

  async function createComment(input: CommentInput) {
    const writer = getWriter()

    if (authMode === 'demo') {
      persistDemo({
        ...demoData,
        comments: [
          ...demoData.comments,
          {
            id: makeId('comment'),
            memoryId: input.memoryId,
            authorId: writer.id,
            content: input.content,
            createdAt: new Date().toISOString().slice(0, 16),
          },
        ],
      })
      return
    }

    if (!supabase) {
      return
    }

    const { error } = await supabase.from('comments').insert({
      memory_id: input.memoryId,
      author_id: writer.id,
      content: input.content,
    })

    if (error) {
      throw error
    }

    await refreshData()
  }

  async function updateComment(commentId: string, input: CommentInput) {
    const writer = getWriter()
    const target = resolvedComments.find((comment) => comment.id === commentId)
    if (!target) {
      return
    }

    if (!isAdmin && target.authorId !== writer.id) {
      throw new Error('작성자 또는 운영자만 수정할 수 있습니다.')
    }

    if (authMode === 'demo') {
      persistDemo({
        ...demoData,
        comments: demoData.comments.map((comment) =>
          comment.id === commentId ? { ...comment, content: input.content } : comment,
        ),
      })
      return
    }

    if (!supabase) {
      return
    }

    const { error } = await supabase
      .from('comments')
      .update({ content: input.content })
      .eq('id', commentId)

    if (error) {
      throw error
    }

    await refreshData()
  }

  async function deleteComment(commentId: string) {
    getAdmin()

    if (authMode === 'demo') {
      persistDemo({
        ...demoData,
        comments: demoData.comments.filter((comment) => comment.id !== commentId),
      })
      return
    }

    if (!supabase) {
      return
    }

    const { error } = await supabase.from('comments').delete().eq('id', commentId)
    if (error) {
      throw error
    }

    await refreshData()
  }

  async function updateProfileApproval(profileId: string, status: UserProfile['approvalStatus']) {
    getAdmin()

    if (authMode === 'demo') {
      persistDemo({
        ...demoData,
        profiles: demoData.profiles.map((profile) =>
          profile.id === profileId ? { ...profile, approvalStatus: status } : profile,
        ),
      })
      return
    }

    if (!supabase) {
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({ approval_status: status })
      .eq('id', profileId)

    if (error) {
      throw error
    }

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
    events: resolvedEvents,
    memories: resolvedMemories,
    comments: resolvedComments,
    profiles: resolvedProfiles,
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
