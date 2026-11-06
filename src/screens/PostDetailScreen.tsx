import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, fonts, radii, spacing } from '../theme';
import type { CommentItem, PhotoPost } from '../types';
import { addTextComment, getComments, getFeed, toggleLike } from '../services/data';
import { mockFeed } from '../mock';
import { Avatar, PastelChip, PhotoCardImage } from '../components/ui';

function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function PostDetailScreen({ navigation, route }: any) {
  const postId: string = route?.params?.postId ?? '';
  const [post, setPost] = useState<PhotoPost | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const feed = await getFeed();
      const found = feed.find((p) => p.id === postId) ?? mockFeed.find((p) => p.id === postId) ?? null;
      setPost(found);
      if (found) {
        setLiked(found.likedByMe);
        setLikeCount(found.likes);
        setComments(await getComments(found.id));
      }
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => { load(); }, [load]);

  const onToggleLike = async () => {
    if (!post) return;
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    try {
      await toggleLike(post.id, liked);
    } catch {
      setLiked(liked);
      setLikeCount((c) => c + (liked ? 1 : -1));
    }
  };

  const sendComment = async () => {
    const text = commentText.trim();
    if (!text || !post) return;
    setPosting(true);
    try {
      const created = await addTextComment(post.id, text);
      setComments((prev) => [...prev, created]);
      setCommentText('');
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.plum} />
        <Text style={styles.loadingText}>Opening that photo…</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyEmoji}>🫥</Text>
        <Text style={styles.emptyTitle}>That photo is gone</Text>
        <Text style={styles.emptyBody}>It may have been deleted. Head back to the feed to keep spotting.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Back to feed</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.authorRow}>
        <Avatar profile={post.author} size={44} />
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{post.author.displayName}</Text>
          <Text style={styles.authorMeta}>@{post.author.username} · {timeAgo(post.takenAt)}{post.livePhoto ? ' · 📷 live photo' : ''}</Text>
        </View>
      </View>

      <PhotoCardImage uri={post.image} height={380} />

      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.likeButton, liked && styles.likeButtonActive]} onPress={onToggleLike}>
          <Text style={styles.likeText}>{liked ? '♥' : '♡'} {likeCount}</Text>
        </TouchableOpacity>
        <Text style={styles.commentsMeta}>💬 {comments.length} comment{comments.length === 1 ? '' : 's'}</Text>
        <View style={styles.spacer} />
        <PastelChip label={post.isDaily ? `Daily: ${post.clueText}` : post.clueText} pastel={post.isDaily ? 'lavender' : 'butter'} />
      </View>

      {post.caption ? <Text style={styles.caption}>{post.caption}</Text> : null}

      <TouchableOpacity
        style={styles.answerButton}
        onPress={() => navigation.navigate('Camera', { clueId: post.clueId, clueText: post.clueText, isDaily: post.isDaily })}
      >
        <Text style={styles.answerButtonText}>📷  Answer this clue with a photo</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Comments</Text>
      {comments.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={styles.emptyTitle}>No comments yet</Text>
          <Text style={styles.emptyBody}>Be the first to say something kind — or answer the clue with your own photo.</Text>
        </View>
      ) : (
        comments.map((c) => (
          <View key={c.id} style={styles.commentRow}>
            <Avatar profile={c.author} size={36} />
            <View style={styles.commentBody}>
              <Text style={styles.commentAuthor}>{c.author.displayName} <Text style={styles.commentTime}>· {timeAgo(c.createdAt)}</Text></Text>
              {c.isPhotoAnswer && c.photoUri ? (
                <>
                  <Image source={{ uri: c.photoUri }} style={styles.photoAnswer} resizeMode="cover" />
                  <Text style={styles.photoAnswerLabel}>📷 answered with a photo</Text>
                </>
              ) : null}
              {c.text ? <Text style={styles.commentText}>{c.text}</Text> : null}
              {c.likes > 0 ? <Text style={styles.commentLikes}>♥ {c.likes}</Text> : null}
            </View>
          </View>
        ))
      )}

      <View style={styles.commentBar}>
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment…"
          placeholderTextColor={colors.mutedLight}
          value={commentText}
          onChangeText={setCommentText}
          multiline
        />
        <TouchableOpacity style={[styles.sendButton, (!commentText.trim() || posting) && styles.sendButtonDisabled]} onPress={sendComment} disabled={!commentText.trim() || posting}>
          <Text style={styles.sendButtonText}>{posting ? '…' : 'Send'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  loadingText: { fontFamily: fonts.body, color: colors.muted, marginTop: spacing.sm },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  authorInfo: { flex: 1 },
  authorName: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 16, color: colors.ink },
  authorMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' },
  likeButton: { backgroundColor: colors.surface, borderRadius: radii.pill, paddingHorizontal: 14, paddingVertical: 8 },
  likeButtonActive: { backgroundColor: colors.blush },
  likeText: { fontFamily: fonts.body, fontWeight: '800', fontSize: 14, color: colors.ink },
  commentsMeta: { fontFamily: fonts.body, fontWeight: '700', fontSize: 13, color: colors.muted },
  spacer: { flex: 1 },
  caption: { fontFamily: fonts.body, fontSize: 15, color: colors.ink, lineHeight: 22, marginTop: spacing.sm },
  answerButton: { backgroundColor: colors.plum, borderRadius: radii.pill, paddingVertical: 13, alignItems: 'center', marginTop: spacing.md },
  answerButtonText: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 15, color: colors.white },
  sectionTitle: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 18, color: colors.ink, marginTop: spacing.lg, marginBottom: spacing.sm },
  emptyCard: { backgroundColor: colors.babyBlueLight, borderRadius: radii.lg, padding: spacing.lg, alignItems: 'center' },
  emptyEmoji: { fontSize: 32 },
  emptyTitle: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 17, color: colors.ink, marginTop: spacing.sm },
  emptyBody: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: spacing.xs, lineHeight: 20 },
  backButton: { backgroundColor: colors.plum, borderRadius: radii.pill, paddingHorizontal: 22, paddingVertical: 12, marginTop: spacing.md },
  backButtonText: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 15, color: colors.white },
  commentRow: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.sm, marginBottom: spacing.sm },
  commentBody: { flex: 1 },
  commentAuthor: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 14, color: colors.ink },
  commentTime: { fontFamily: fonts.body, fontWeight: '400', fontSize: 12, color: colors.muted },
  commentText: { fontFamily: fonts.body, fontSize: 14, color: colors.ink, marginTop: 2, lineHeight: 20 },
  commentLikes: { fontFamily: fonts.body, fontSize: 12, color: colors.pinkDeep, marginTop: 4 },
  photoAnswer: { width: '100%', height: 200, borderRadius: radii.md, marginTop: spacing.xs },
  photoAnswerLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 4 },
  commentBar: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, alignItems: 'flex-end' },
  commentInput: { flex: 1, backgroundColor: colors.surface, borderRadius: radii.md, paddingHorizontal: spacing.md, paddingVertical: 12, fontFamily: fonts.body, fontSize: 15, color: colors.ink, minHeight: 48, maxHeight: 110 },
  sendButton: { backgroundColor: colors.plum, borderRadius: radii.pill, paddingHorizontal: 18, paddingVertical: 13 },
  sendButtonDisabled: { opacity: 0.45 },
  sendButtonText: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 15, color: colors.white },
});
