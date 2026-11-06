// Data layer. Mock mode (no Supabase env) returns local sample data so every
// screen works offline. With Supabase configured, the same functions hit the
// real tables created by supabase/migrations/00001_ispy_schema.sql.
import { isMockMode, supabase } from './supabase';
import {
  mockComments, mockFeed, mockFriends, mockMe, mockMyPhotos,
  mockNotifications, mockTodayClue, mockUserClues,
} from '../mock';
import type { CommentItem, DailyClue, Friend, NotificationItem, PhotoPost, Profile, UserClue } from '../types';

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

export async function getTodayClue(): Promise<DailyClue> {
  if (isMockMode || !supabase) { await delay(); return mockTodayClue; }
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const { data } = await supabase.from('daily_clues').select('*').eq('date', today).maybeSingle();
  if (!data) return mockTodayClue;
  return { id: data.id, date: data.date, text: data.text, hint: data.hint ?? '', category: data.category ?? 'Daily', expiresAt: data.expires_at };
}

export async function getFeed(sort: 'newest' | 'liked' = 'newest'): Promise<PhotoPost[]> {
  if (isMockMode || !supabase) {
    await delay();
    const list = [...mockFeed];
    return sort === 'liked' ? list.sort((a, b) => b.likes - a.likes) : list;
  }
  const { data } = await supabase.from('photos').select('*, profiles!photos_author_id_fkey(*)').order('created_at', { ascending: false }).limit(50);
  return (data ?? []).map((row: Record<string, unknown>) => mapPhoto(row));
}

export async function getUserClues(): Promise<UserClue[]> {
  if (isMockMode || !supabase) { await delay(); return mockUserClues; }
  const { data } = await supabase.from('clues').select('*, profiles!clues_author_id_fkey(*)').order('created_at', { ascending: false }).limit(50);
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id), author: mapProfile(row.profiles as Record<string, unknown>),
    text: String(row.text), hint: String(row.hint ?? ''), category: String(row.category ?? 'Clue'),
    createdAt: String(row.created_at), answersCount: 0, likes: 0,
  }));
}

export async function getComments(targetId: string): Promise<CommentItem[]> {
  if (isMockMode || !supabase) { await delay(); return mockComments[targetId] ?? []; }
  const { data } = await supabase.from('comments').select('*, profiles!comments_author_id_fkey(*)').eq('target_id', targetId).order('created_at', { ascending: true });
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id), author: mapProfile(row.profiles as Record<string, unknown>),
    text: String(row.text ?? ''), photoUri: (row.photo_path as string | null) ?? null,
    isPhotoAnswer: Boolean(row.photo_path), likes: 0, createdAt: String(row.created_at),
  }));
}

export async function getNotifications(): Promise<NotificationItem[]> {
  if (isMockMode || !supabase) { await delay(); return mockNotifications; }
  const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50);
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id), kind: 'like', title: String(row.title), body: String(row.body ?? ''),
    createdAt: String(row.created_at), read: Boolean(row.read), pastel: 'lavender',
  }));
}

export async function getFriends(): Promise<Friend[]> {
  if (isMockMode || !supabase) { await delay(); return mockFriends; }
  return mockFriends;
}

export async function getMyPhotos(): Promise<PhotoPost[]> {
  if (isMockMode || !supabase) { await delay(); return mockMyPhotos; }
  return mockMyPhotos;
}

export async function getMe(): Promise<Profile> {
  if (isMockMode || !supabase) { await delay(); return mockMe; }
  return mockMe;
}

/** Toggle a like. In mock mode this is local-only; with Supabase it writes the likes table. */
export async function toggleLike(postId: string, liked: boolean): Promise<void> {
  if (isMockMode || !supabase) { await delay(120); return; }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  if (liked) await supabase.from('likes').delete().eq('photo_id', postId).eq('user_id', user.id);
  else await supabase.from('likes').insert({ photo_id: postId, user_id: user.id });
}

export async function addTextComment(targetId: string, text: string): Promise<CommentItem> {
  if (isMockMode || !supabase) {
    await delay();
    return { id: `c-${Date.now()}`, author: mockMe, text, photoUri: null, isPhotoAnswer: false, likes: 0, createdAt: new Date().toISOString() };
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in to comment');
  const { data, error } = await supabase.from('comments').insert({ target_id: targetId, author_id: user.id, text }).select().single();
  if (error) throw error;
  return { id: String(data.id), author: mockMe, text, photoUri: null, isPhotoAnswer: false, likes: 0, createdAt: String(data.created_at) };
}

export async function postClue(text: string, hint: string, category: string): Promise<UserClue> {
  if (isMockMode || !supabase) {
    await delay();
    return { id: `clue-${Date.now()}`, author: mockMe, text, hint, category, createdAt: new Date().toISOString(), answersCount: 0, likes: 0 };
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in to post a clue');
  const { data, error } = await supabase.from('clues').insert({ author_id: user.id, text, hint, category }).select().single();
  if (error) throw error;
  return { id: String(data.id), author: mockMe, text, hint, category, createdAt: String(data.created_at), answersCount: 0, likes: 0 };
}

export async function uploadLivePhoto(localUri: string, clueId: string, caption: string): Promise<PhotoPost> {
  // Camera-only is enforced in the Camera screen (expo-camera, no library).
  // taken_at is set server-side on insert; the SQL has a recency note.
  if (isMockMode || !supabase) {
    await delay(400);
    return { id: `post-${Date.now()}`, author: mockMe, clueId, clueText: mockTodayClue.text, isDaily: true, image: localUri, caption, takenAt: new Date().toISOString(), livePhoto: true, likes: 0, likedByMe: false, commentsCount: 0 };
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in to post a photo');
  const path = `${user.id}/${Date.now()}.jpg`;
  const res = await fetch(localUri);
  const blob = await res.blob();
  const { error: upErr } = await supabase.storage.from('photos').upload(path, blob, { contentType: 'image/jpeg' });
  if (upErr) throw upErr;
  const { data, error } = await supabase.from('photos').insert({ author_id: user.id, clue_id: clueId, storage_path: path, caption, live_photo: true }).select().single();
  if (error) throw error;
  const { data: pub } = supabase.storage.from('photos').getPublicUrl(path);
  return { id: String(data.id), author: mockMe, clueId, clueText: mockTodayClue.text, isDaily: true, image: pub.publicUrl, caption, takenAt: String(data.created_at), livePhoto: true, likes: 0, likedByMe: false, commentsCount: 0 };
}

function mapProfile(row: Record<string, unknown>): Profile {
  return { id: String(row.id ?? ''), username: String(row.username ?? ''), displayName: String(row.display_name ?? row.username ?? ''), avatarColor: 'lavender', avatarInitial: String(row.display_name ?? '?')[0] ?? '?', bio: String(row.bio ?? ''), streak: 0, totalLikes: 0, photosCount: 0, followers: 0, following: 0 };
}
function mapPhoto(row: Record<string, unknown>): PhotoPost {
  return { id: String(row.id), author: mockMe, clueId: String(row.clue_id ?? ''), clueText: '', isDaily: true, image: String(row.storage_path ?? ''), caption: String(row.caption ?? ''), takenAt: String(row.created_at), livePhoto: Boolean(row.live_photo), likes: 0, likedByMe: false, commentsCount: 0 };
}
