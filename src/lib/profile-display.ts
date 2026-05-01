import type { UserProfile } from './types'

export function resolveProfileName(profileId: string, profiles: UserProfile[]) {
  return profiles.find((profile) => profile.id === profileId)?.kakaoNickname ?? `승객 ${profileId.slice(0, 6)}`
}

export function resolveProfileAvatar(profileId: string, profiles: UserProfile[]) {
  return (
    profiles.find((profile) => profile.id === profileId)?.avatarUrl ??
    `https://ui-avatars.com/api/?name=${encodeURIComponent(profileId.slice(0, 6))}&background=f4e7d2&color=6f3114`
  )
}
