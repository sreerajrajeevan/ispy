export type PastelKey = 'lavender' | 'butter' | 'babyBlue' | 'blush' | 'mint' | 'peach';

export interface Profile {
  id: string;
  username: string;
  displayName: string;
  avatarColor: PastelKey;
  avatarInitial: string;
  bio: string;
  streak: number;
  totalLikes: number;
  photosCount: number;
  followers: number;
  following: number;
}

export interface DailyClue {
  id: string;
  date: string; // YYYY-MM-DD (IST)
  text: string;
  hint: string;
  category: string;
  expiresAt: string; // ISO, midnight IST
}

export interface UserClue {
  id: string;
  author: Profile;
  text: string;
  hint: string;
  category: string;
  createdAt: string;
  answersCount: number;
  likes: number;
}

export interface PhotoPost {
  id: string;
  author: Profile;
  clueId: string;
  clueText: string;
  isDaily: boolean;
  image: string; // remote URL in production, picsum seed in mock
  caption: string;
  takenAt: string;
  livePhoto: boolean;
  likes: number;
  likedByMe: boolean;
  commentsCount: number;
}

export interface CommentItem {
  id: string;
  author: Profile;
  text: string;
  photoUri?: string | null; // photo comment (answer to a clue)
  isPhotoAnswer: boolean;
  likes: number;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  kind: 'like' | 'answer' | 'clue' | 'follow' | 'streak';
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  pastel: PastelKey;
}

export interface Friend {
  id: string;
  profile: Profile;
  isFollowing: boolean;
  lastClue?: string;
}

export type RootStackParamList = {
  MainTabs: undefined;
  Camera: { clueId: string; clueText: string; isDaily: boolean };
  Preview: { photoUri: string; clueId: string; clueText: string; isDaily: boolean };
  PostDetail: { postId: string };
  ClueThread: { clueId: string };
  CreateClue: undefined;
  Auth: undefined;
};
