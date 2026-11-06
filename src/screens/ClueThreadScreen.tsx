import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, fonts, pastelLights, radii, spacing } from '../theme';
import type { CommentItem, Profile } from '../types';
import { getComments, getTodayClue, getUserClues, addTextComment } from '../services/data';
import { Avatar, PastelChip, PhotoCardImage } from '../components/ui';

interface ClueDisplay {
  id: string;
  text: string;
  hint: string;
  category: string;
  author: Profile | null;
  isDaily: boolean;
  answersCount: number;
}

function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function ClueThreadScreen({ navigation, route }: any) {
  const clueId: string = route?.params?.clueId ?? '';
  const [clue, setClue] = useState<ClueDisplay | null>(null);
  const [answers, setAnswers] = useState<CommentItem[]>([]);
  const [textComments, setTextComments] = useState<CommentItem[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const clues = await getUserClues();
      const found = clues.find((c) => c.id === clueId);
      let display: ClueDisplay;
      if (found) {
        display = {
          id: found.id, text: found.text, hint: found.hint, category: found.category,
          author: found.author, isDaily: false, answersCount: found.answersCount,
        };
      } else {
        const daily = await getTodayClue();
        display = {
          id: daily.id, text: daily.text, hint: daily.hint, category: daily.category,
          author: null, isDaily: true, answersCount: 0,
        };
      }
      setClue(display);
      const all = await getComments(display.id);
      setAnswers(all.filter((c) => c.isPhotoAnswer));
      setTextComments(all.filter((c) => !c.isPhotoAnswer));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clueId]);

  useEffect(() => { load(); }, [load]);

  const toggleAnswerLike = (id: string) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const sendComment = async () => {
    const text = commentText.trim();
    if (!text || !clue) return;
    setPosting(true);
    try {
      const created = await addTextComment(clue.id, text);
      setTextComments((prev) => [...prev, created]);
      setCommentText('');
    } finally {
      setPosting(false);
    }
  };

  if (loading || !clue) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.plum} />
        <Text style={styles.loadingText}>Finding that clue…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.plum} />}
    >
      <View style={styles.clueCard}>
        <PastelChip label={clue.isDaily ? 'Daily clue' : clue.category} pastel={clue.isDaily ? 'lavender' : 'butter'} />
        <Text style={styles.clueText}>{clue.text}</Text>
        {clue.hint ? <Text style={styles.hint}>💡 {clue.hint}</Text> : null}
        {clue.author ? (
          <View style={styles.authorRow}>
            <Avatar profile={clue.author} size={32} />
            <Text style={styles.authorText}>Posted by {clue.author.displayName} · @{clue.author.username}</Text>
          </View>
        ) : (
          <Text style={styles.authorText}>Today&apos;s clue — same for everyone, until midnight 🌙</Text>
        )}
        <Text style={styles.answersMeta}>
          {answers.length} photo answer{answers.length === 1 ? '' : 's'} so far
        </Text>
      </View>

      <TouchableOpacity
        style={styles.answerButton}
        onPress={() => navigation.navigate('Camera', { clueId: clue.id, clueText: clue.text, isDaily: clue.isDaily })}
      >
        <Text style={styles.answerButtonText}>📷  Answer with a photo</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Photo answers</Text>
      {answers.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyTitle}>No answers yet — be the first!</Text>
          <Text style={styles.emptyBody}>Spot it out in the wild, snap it live in the app, and show everyone what you found.</Text>
        </View>
      ) : (
        answers.map((answer, i) => (
          <View key={answer.id} style={[styles.answerCard, { backgroundColor: pastelLights[['lavender', 'butter', 'babyBlue', 'blush', 'mint'][i % 5] as 'lavender' | 'butter' | 'babyBlue' | 'blush' | 'mint'] }]}>
            <View style={styles.answerHeader}>
              <Avatar profile={answer.author} size={36} />
              <View style={styles.answerHeaderText}>
                <Text style={styles.answerAuthor}>{answer.author.displayName}</Text>
                <Text style={styles.answerTime}>{timeAgo(answer.createdAt)}</Text>
              </View>
              <TouchableOpacity
                style={[styles.likeButton, likedIds.has(answer.id) && styles.likeButtonActive]}
                onPress={() => toggleAnswerLike(answer.id)}
              >
                <Text style={styles.likeText}>
                  {likedIds.has(answer.id) ? '♥' : '♡'} {answer.likes + (likedIds.has(answer.id) ? 1 : 0)}
                </Text>
              </TouchableOpacity>
            </View>
            {answer.photoUri ? <PhotoCardImage uri={answer.photoUri} height={280} /> : null}
            {answer.text ? <Text style={styles.answerCaption}>{answer.text}</Text> : null}
          </View>
        ))
      )}

      {textComments.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Chatter</Text>
          {textComments.map((c) => (
            <View key={c.id} style={styles.commentRow}>
              <Avatar profile={c.author} size={32} />
              <View style={styles.commentBody}>
                <Text style={styles.commentAuthor}>{c.author.displayName} <Text style={styles.commentTime}>· {timeAgo(c.createdAt)}</Text></Text>
                <Text style={styles.commentText}>{c.text}</Text>
              </View>
            </View>
          ))}
        </>
      ) : null}

      <View style={styles.commentBar}>
        <TextInput
          style={styles.commentInput}
          placeholder="Say something sweet…"
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
  center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontFamily: fonts.body, color: colors.muted, marginTop: spacing.sm },
  clueCard: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, marginBottom: spacing.md, shadowColor: colors.plum, shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  clueText: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 24, color: colors.ink, marginTop: spacing.sm, lineHeight: 30 },
  hint: { fontFamily: fonts.body, fontSize: 15, color: colors.muted, marginTop: spacing.sm, lineHeight: 21 },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: spacing.sm },
  authorText: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  answersMeta: { fontFamily: fonts.body, fontWeight: '700', fontSize: 13, color: colors.plum, marginTop: spacing.sm },
  answerButton: { backgroundColor: colors.plum, borderRadius: radii.pill, paddingVertical: 15, alignItems: 'center', marginBottom: spacing.lg },
  answerButtonText: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 16, color: colors.white },
  sectionTitle: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 18, color: colors.ink, marginBottom: spacing.sm },
  emptyCard: { backgroundColor: colors.butterLight, borderRadius: radii.lg, padding: spacing.lg, alignItems: 'center', marginBottom: spacing.md },
  emptyEmoji: { fontSize: 32 },
  emptyTitle: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 17, color: colors.ink, marginTop: spacing.sm },
  emptyBody: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: spacing.xs, lineHeight: 20 },
  answerCard: { borderRadius: radii.lg, padding: spacing.sm, marginBottom: spacing.md },
  answerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
  answerHeaderText: { flex: 1 },
  answerAuthor: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 15, color: colors.ink },
  answerTime: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  likeButton: { backgroundColor: colors.surface, borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 6 },
  likeButtonActive: { backgroundColor: colors.blush },
  likeText: { fontFamily: fonts.body, fontWeight: '800', fontSize: 13, color: colors.ink },
  answerCaption: { fontFamily: fonts.body, fontSize: 14, color: colors.ink, marginTop: spacing.sm },
  commentRow: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.sm, marginBottom: spacing.sm },
  commentBody: { flex: 1 },
  commentAuthor: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 14, color: colors.ink },
  commentTime: { fontFamily: fonts.body, fontWeight: '400', fontSize: 12, color: colors.muted },
  commentText: { fontFamily: fonts.body, fontSize: 14, color: colors.ink, marginTop: 2, lineHeight: 20 },
  commentBar: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, alignItems: 'flex-end' },
  commentInput: { flex: 1, backgroundColor: colors.surface, borderRadius: radii.md, paddingHorizontal: spacing.md, paddingVertical: 12, fontFamily: fonts.body, fontSize: 15, color: colors.ink, minHeight: 48, maxHeight: 110 },
  sendButton: { backgroundColor: colors.plum, borderRadius: radii.pill, paddingHorizontal: 18, paddingVertical: 13 },
  sendButtonDisabled: { opacity: 0.45 },
  sendButtonText: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 15, color: colors.white },
});
