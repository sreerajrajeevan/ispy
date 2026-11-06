// FeedScreen — the public feed: user clues strip on top, sort toggle,
// and a pull-to-refresh list of live photo posts with likes + comments.
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, fonts, pastelCycle, pastelLights, radii, spacing } from '../theme';
import { getFeed, getUserClues, toggleLike } from '../services/data';
import { Avatar, PastelChip, PhotoCardImage } from '../components/ui';
import type { PhotoPost, UserClue } from '../types';

type SortMode = 'newest' | 'liked';

function timeAgo(iso: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function FeedScreen({ navigation }: any) {
  const [sort, setSort] = useState<SortMode>('newest');
  const [posts, setPosts] = useState<PhotoPost[]>([]);
  const [clues, setClues] = useState<UserClue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (mode: SortMode, isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [feed, userClues] = await Promise.all([getFeed(mode), getUserClues()]);
      setPosts(feed);
      setClues(userClues);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the feed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(sort, false);
  }, [load, sort]);

  const onRefresh = (): void => {
    load(sort, true);
  };

  const onLike = async (post: PhotoPost): Promise<void> => {
    const wasLiked = post.likedByMe;
    // Optimistic local update; the server call runs underneath.
    setPosts((current) =>
      current.map((item) =>
        item.id === post.id
          ? { ...item, likedByMe: !wasLiked, likes: item.likes + (wasLiked ? -1 : 1) }
          : item,
      ),
    );
    try {
      await toggleLike(post.id, wasLiked);
    } catch {
      // Roll back if the toggle failed.
      setPosts((current) =>
        current.map((item) =>
          item.id === post.id
            ? { ...item, likedByMe: wasLiked, likes: item.likes + (wasLiked ? 1 : -1) }
            : item,
        ),
      );
    }
  };

  const renderPost = ({ item }: { item: PhotoPost }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Avatar profile={item.author} size={44} />
        <View style={styles.authorBlock}>
          <Text style={styles.authorName}>{item.author.displayName}</Text>
          <Text style={styles.timeText}>
            {timeAgo(item.takenAt)}{item.livePhoto ? ' · 📸 live' : ''}
          </Text>
        </View>
        {item.isDaily ? <PastelChip label="Daily clue" pastel="lavender" /> : null}
      </View>

      <PhotoCardImage uri={item.image} height={300} />

      <View style={styles.clueRow}>
        <PastelChip label={`🔍 ${item.clueText}`} pastel="butter" />
      </View>
      {item.caption ? <Text style={styles.caption}>{item.caption}</Text> : null}

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionButton} onPress={() => onLike(item)} activeOpacity={0.7}>
          <Text style={[styles.actionText, item.likedByMe ? styles.actionTextLiked : null]}>
            {item.likedByMe ? '❤️' : '🤍'} {item.likes}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
          activeOpacity={0.7}
        >
          <Text style={styles.actionText}>💬 {item.commentsCount}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const listHeader = (
    <View>
      {/* User clues strip */}
      <View style={styles.cluesHeaderRow}>
        <Text style={styles.sectionTitle}>Clues from friends</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateClue')}>
          <Text style={styles.addClue}>+ New clue</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cluesRow}>
        {clues.map((clue, index) => (
          <TouchableOpacity
            key={clue.id}
            style={[styles.clueCard, { backgroundColor: pastelLights[pastelCycle[index % pastelCycle.length]] }]}
            onPress={() => navigation.navigate('ClueThread', { clueId: clue.id })}
            activeOpacity={0.85}
          >
            <Text style={styles.clueCardText} numberOfLines={3}>
              {clue.text}
            </Text>
            <Text style={styles.clueCardMeta}>
              {clue.author.displayName} · {clue.answersCount} answers
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort toggle */}
      <View style={styles.sortRow}>
        <Text style={styles.sectionTitle}>Everyone&apos;s photos</Text>
        <View style={styles.sortToggle}>
          <TouchableOpacity
            style={[styles.sortButton, sort === 'newest' ? styles.sortButtonActive : null]}
            onPress={() => setSort('newest')}
            activeOpacity={0.8}
          >
            <Text style={[styles.sortText, sort === 'newest' ? styles.sortTextActive : null]}>Newest</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sort === 'liked' ? styles.sortButtonActive : null]}
            onPress={() => setSort('liked')}
            activeOpacity={0.8}
          >
            <Text style={[styles.sortText, sort === 'liked' ? styles.sortTextActive : null]}>Most liked</Text>
          </TouchableOpacity>
        </View>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.pinkDeep} />
        <Text style={styles.loadingText}>Loading the feed…</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={renderPost}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={<Text style={styles.emptyText}>No photos yet — be the first to spot something! 🌼</Text>}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.pinkDeep} />}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  loadingWrap: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText: { fontFamily: fonts.body, fontSize: 15, color: colors.muted },
  sectionTitle: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 19, color: colors.ink },
  cluesHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  addClue: { fontFamily: fonts.heading, fontWeight: '700', fontSize: 14, color: colors.pinkDeep },
  cluesRow: { gap: spacing.sm, paddingTop: spacing.sm, paddingRight: spacing.sm },
  clueCard: { width: 190, borderRadius: radii.lg, padding: spacing.md, minHeight: 104, justifyContent: 'space-between' },
  clueCardText: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 16, color: colors.ink, lineHeight: 21 },
  clueCardMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: spacing.sm },
  sortRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.sm },
  sortToggle: { flexDirection: 'row', backgroundColor: colors.lavenderLight, borderRadius: radii.pill, padding: 4 },
  sortButton: { borderRadius: radii.pill, paddingHorizontal: 14, paddingVertical: 7 },
  sortButtonActive: { backgroundColor: colors.plum },
  sortText: { fontFamily: fonts.heading, fontWeight: '700', fontSize: 13, color: colors.plum },
  sortTextActive: { color: colors.white },
  errorText: { fontFamily: fonts.body, fontSize: 14, color: colors.danger, marginBottom: spacing.sm },
  emptyText: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  authorBlock: { flex: 1 },
  authorName: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 15, color: colors.ink },
  timeText: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  clueRow: { flexDirection: 'row', marginTop: spacing.sm, flexWrap: 'wrap' },
  caption: { fontFamily: fonts.body, fontSize: 15, color: colors.ink, marginTop: spacing.sm, lineHeight: 21 },
  actionsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  actionButton: { backgroundColor: colors.background, borderRadius: radii.pill, paddingHorizontal: 14, paddingVertical: 8 },
  actionText: { fontFamily: fonts.heading, fontWeight: '700', fontSize: 14, color: colors.ink },
  actionTextLiked: { color: colors.pinkDeep },
});
