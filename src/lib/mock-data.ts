import type { AppDataSnapshot } from './types'

export const initialDemoData: AppDataSnapshot = {
  profiles: [
    {
      id: 'profile-admin',
      authUserId: 'auth-admin',
      kakaoNickname: '기관사',
      avatarUrl:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      approvalStatus: 'approved',
      role: 'admin',
    },
    {
      id: 'profile-member',
      authUserId: 'auth-member',
      kakaoNickname: '차창풍경',
      avatarUrl:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      approvalStatus: 'approved',
      role: 'member',
    },
    {
      id: 'profile-pending',
      authUserId: 'auth-pending',
      kakaoNickname: '승인대기 승객',
      avatarUrl:
        'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80',
      approvalStatus: 'pending',
      role: 'member',
    },
  ],
  events: [
    {
      id: 'event-spring-seoul',
      title: '서울숲 봄 산책',
      eventAt: '2026-05-18T14:00',
      location: '서울숲 3번 출구 앞',
      what: '벚꽃이 지기 전 산책하고 사진 남기기',
      how: '단톡 투표로 시간 확정 후 각자 도시락 하나씩 준비',
      decisionSummary: '오후 2시 집합, 서울숲 산책 후 카페 기록 회고',
      createdBy: 'profile-admin',
    },
    {
      id: 'event-night-train',
      title: '밤기차 감성 모임',
      eventAt: '2026-06-02T19:30',
      location: '서울역 인근 루프탑 카페',
      what: '상반기 사진 정리와 음성메모 공유',
      how: '카카오톡 투표로 장소 선정, 비용은 각자 결제',
      decisionSummary: '카페 모임 후 인생네컷 촬영까지 진행',
      createdBy: 'profile-member',
    },
  ],
  memories: [
    {
      id: 'memory-spring-1',
      eventId: 'event-spring-seoul',
      authorId: 'profile-member',
      photoUrl:
        'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&q=80',
      caption: '햇빛이 길게 내려오던 산책길. 서로 별 얘기 아닌데도 오래 웃었어요.',
      recordedAt: '2026-05-18T16:20',
    },
  ],
  comments: [
    {
      id: 'comment-spring-1',
      memoryId: 'memory-spring-1',
      authorId: 'profile-admin',
      content: '이 날 사진 보니까 다음엔 노을 시간에 다시 가고 싶네요.',
      createdAt: '2026-05-18T18:10',
    },
  ],
}
