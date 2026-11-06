import type { CommentItem, DailyClue, Friend, NotificationItem, PhotoPost, Profile, UserClue } from '../types';

// Mock mode: used whenever EXPO_PUBLIC_SUPABASE_URL / ANON_KEY are empty,
// so Sree can see every screen with no backend. All images are picsum
// seeds (stable, public placeholder photos) — never local user photos.
const pic = (seed: string, w = 800, h = 1000) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const mockMe: Profile = {
  id: 'me', username: 'sree', displayName: 'Sree', avatarColor: 'lavender',
  avatarInitial: 'S', bio: 'Spotting something new every day. 👀', streak: 6,
  totalLikes: 248, photosCount: 18, followers: 132, following: 87,
};

const p = (id: string, username: string, displayName: string, color: Profile['avatarColor']): Profile => ({
  id, username, displayName, avatarColor: color, avatarInitial: displayName[0],
  bio: '', streak: 0, totalLikes: 0, photosCount: 0, followers: 0, following: 0,
});

export const mockUsers: Record<string, Profile> = {
  anu: p('anu', 'anu', 'Anu', 'butter'),
  manu: p('manu', 'manu', 'Manu', 'mint'),
  meera: p('meera', 'meera', 'Meera', 'blush'),
  arjun: p('arjun', 'arjun', 'Arjun', 'babyBlue'),
  divya: p('divya', 'divya', 'Divya', 'peach'),
  kannan: p('kannan', 'kannan', 'Kannan', 'lavender'),
};

export const mockTodayClue: DailyClue = {
  id: 'daily-2026-11-06', date: '2026-11-06',
  text: 'Something yellow',
  hint: 'Look for a splash of sunshine — a flower, a wall, a bus, a smile.',
  category: 'Colour hunt',
  expiresAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
};

export const mockFeed: PhotoPost[] = [
  { id: 'post-1', author: mockUsers.anu, clueId: mockTodayClue.id, clueText: mockTodayClue.text, isDaily: true, image: pic('ispy-yellow-flower'), caption: 'Found it in the garden this morning 🌼', takenAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(), livePhoto: true, likes: 48, likedByMe: false, commentsCount: 6 },
  { id: 'post-2', author: mockUsers.manu, clueId: mockTodayClue.id, clueText: mockTodayClue.text, isDaily: true, image: pic('ispy-yellow-bus'), caption: 'The school bus, right on time', takenAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(), livePhoto: true, likes: 31, likedByMe: true, commentsCount: 3 },
  { id: 'post-3', author: mockUsers.meera, clueId: mockTodayClue.id, clueText: mockTodayClue.text, isDaily: true, image: pic('ispy-yellow-wall'), caption: 'This wall near my house — so bright!', takenAt: new Date(Date.now() - 1000 * 60 * 160).toISOString(), livePhoto: true, likes: 57, likedByMe: false, commentsCount: 9 },
  { id: 'post-4', author: mockUsers.arjun, clueId: mockTodayClue.id, clueText: mockTodayClue.text, isDaily: true, image: pic('ispy-yellow-mango'), caption: 'Mango season is almost here', takenAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(), livePhoto: true, likes: 22, likedByMe: false, commentsCount: 2 },
  { id: 'post-5', author: mockUsers.divya, clueId: mockTodayClue.id, clueText: mockTodayClue.text, isDaily: true, image: pic('ispy-yellow-umbrella'), caption: 'Rain + yellow umbrella = my favourite combo', takenAt: new Date(Date.now() - 1000 * 60 * 320).toISOString(), livePhoto: true, likes: 39, likedByMe: false, commentsCount: 4 },
];

export const mockUserClues: UserClue[] = [
  { id: 'clue-1', author: mockUsers.manu, text: 'Something that makes you smile', hint: 'It can be a person, a pet, or a place.', category: 'Feelings', createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(), answersCount: 4, likes: 18 },
  { id: 'clue-2', author: mockUsers.meera, text: 'A door that is not a door', hint: 'Think outside the house.', category: 'Tricky', createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(), answersCount: 2, likes: 12 },
  { id: 'clue-3', author: mockUsers.kannan, text: 'Something round and red', hint: 'In the kitchen, on the road, or in the sky.', category: 'Colour hunt', createdAt: new Date(Date.now() - 1000 * 60 * 400).toISOString(), answersCount: 7, likes: 25 },
];

export const mockComments: Record<string, CommentItem[]> = {
  'post-1': [
    { id: 'c1', author: mockUsers.meera, text: 'So pretty! Where is this?', photoUri: null, isPhotoAnswer: false, likes: 5, createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString() },
    { id: 'c2', author: mockUsers.manu, text: '', photoUri: pic('ispy-yellow-flower-2', 600, 600), isPhotoAnswer: true, likes: 9, createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString() },
  ],
  'clue-1': [
    { id: 'c3', author: mockUsers.anu, text: '', photoUri: pic('ispy-smile-cat', 600, 600), isPhotoAnswer: true, likes: 14, createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
    { id: 'c4', author: mockUsers.arjun, text: '', photoUri: pic('ispy-smile-kid', 600, 600), isPhotoAnswer: true, likes: 7, createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString() },
  ],
};

export const mockNotifications: NotificationItem[] = [
  { id: 'n1', kind: 'like', title: 'Anu liked your photo', body: '“Found it in the garden” — 48 likes now', createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), read: false, pastel: 'blush' },
  { id: 'n2', kind: 'answer', title: 'Meera answered your clue', body: 'She posted a photo for “Something round and red”', createdAt: new Date(Date.now() - 1000 * 60 * 70).toISOString(), read: false, pastel: 'mint' },
  { id: 'n3', kind: 'clue', title: 'New daily clue is here', body: 'Today: Something yellow. You have until midnight!', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), read: true, pastel: 'lavender' },
  { id: 'n4', kind: 'follow', title: 'Arjun started following you', body: '', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(), read: true, pastel: 'butter' },
];

export const mockFriends: Friend[] = [
  { id: 'f1', profile: mockUsers.anu, isFollowing: true, lastClue: 'Something yellow' },
  { id: 'f2', profile: mockUsers.manu, isFollowing: true, lastClue: 'Something that makes you smile' },
  { id: 'f3', profile: mockUsers.meera, isFollowing: true, lastClue: 'A door that is not a door' },
  { id: 'f4', profile: mockUsers.arjun, isFollowing: false, lastClue: 'Something round and red' },
  { id: 'f5', profile: mockUsers.divya, isFollowing: true },
  { id: 'f6', profile: mockUsers.kannan, isFollowing: false },
];

export const mockMyPhotos: PhotoPost[] = [
  { ...mockFeed[0], id: 'mine-1', author: mockMe, caption: 'My yellow find today', image: pic('ispy-mine-yellow') },
  { id: 'mine-2', author: mockMe, clueId: 'daily-2026-11-05', clueText: 'Something blue', isDaily: true, image: pic('ispy-mine-blue'), caption: 'Yesterday — the sky after rain', takenAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), livePhoto: true, likes: 34, likedByMe: false, commentsCount: 5 },
  { id: 'mine-3', author: mockMe, clueId: 'daily-2026-11-04', clueText: 'A tiny thing', isDaily: true, image: pic('ispy-mine-tiny'), caption: 'A tiny flower on the wall', takenAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(), livePhoto: true, likes: 21, likedByMe: false, commentsCount: 2 },
];
