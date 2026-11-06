// TodayScreen — today's daily clue, countdown to midnight, streak,
// friends who are playing, and a preview of today's photos so far.
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, fonts, pastelCycle, pastelLights, radii, spacing } from '../theme';
import { getFeed, getFriends, getMe, getTodayClue } from '../services/data';
import { Avatar, PastelChip, PhotoCardImage } from '../components/ui';
import type { DailyClue, Friend, PhotoPost, Profile } from '../types';

function formatCountdown(expiresAt: string, now: Date): string {
  const diff = Math.max(0, new Date(expiresAt).getTime() - now.getTime());
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export default function TodayScreen({ navigation }: any) {
  const [clue, setClue] = useState<DailyClue | null>(null);
  const [me, setMe] = useState<Profile | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [photos, setPhotos] = useState<PhotoPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    let alive = true;
    Promise.all([getTodayClue(), getMe(), getFriends(), getFeed('newest')])
      .then(([todayClue, myProfile, friendList, feed]) => {
        if (!alive) return;
        setClue(todayClue);
        setMe(myProfile);
        setFriends(friendList);
        setPhotos(feed.slice(0, 6));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Tick the midnight countdown every second.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading || !clue) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.pinkDeep} />
        <Text style={styles.loadingText}>Finding today&apos;s clue…</Text>
      </View>
    );
  }

  const goToCamera = (): void => {
    navigation.navigate('Camera', { clueId: clue.id, clueText: clue.text, isDaily: true });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.greeting}>Good day, {me?.displayName ?? 'friend'} 👋</Text>
      <Text style={styles.subheading}>Here&apos;s what everyone is looking for today.</Text>

      {/* Streak pill */}
      <View style={styles.streakRow}>
        <View style={styles.streakPill}>
          <Text style={styles.streakText}>🔥 {me?.streak ?? 0}-day streak</Text>
        </View>
        <View style={styles.countdownPill}>
          <Text style={styles.countdownLabel}>New clue in</Text>
          <Text style={styles.countdownText}>{formatCountdown(clue.expiresAt, now)}</Text>
        </View>
      </View>

      {/* Today's clue — lavender hero card */}
      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>✨ Today&apos;s clue</Text>
        <Text style={styles.heroClue}>{clue.text}</Text>
        <Text style={styles.heroHint}>{clue.hint}</Text>
        <View style={styles.chipRow}>
          <PastelChip label={clue.category} pastel="butter" />
          <PastelChip label="Same clue for everyone" pastel="babyBlue" />
        </View>
        <TouchableOpacity style={styles.ctaButton} onPress={goToCamera} activeOpacity={0.85}>
          <Text style={styles.ctaText}>📸  Take a photo</Text>
        </TouchableOpacity>
        <Text style={styles.liveNote}>Live camera only — no gallery, no old photos.</Text>
      </View>

      {/* Friends playing today */}
      <Text style={styles.sectionTitle}>Friends playing today</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.friendsRow}>
        {friends.map((friend) => (
          <View key={friend.id} style={styles.friendItem}>
            <Avatar profile={friend.profile} size={52} />
            <Text style={styles.friendName} numberOfLines={1}>
              {friend.profile.displayName}
            </Text>
            {friend.lastClue ? (
              <Text style={styles.friendClue} numberOfLines={1}>
                {friend.lastClue}
              </Text>
            ) : null}
          </View>
        ))}
      </ScrollView>

      {/* Today's photos so far */}
      <View style={styles.photosHeader}>
        <Text style={styles.sectionTitle}>Today&apos;s photos so far</Text>
        <TouchableOpacity onPress={() => navigation.navigate('MainTabs')}>
          <Text style={styles.seeAll}>See all →</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photosRow}>
        {photos.map((post, index) => (
          <TouchableOpacity
            key={post.id}
            style={styles.previewCard}
            onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
            activeOpacity={0.85}
          >
            <PhotoCardImage uri={post.image} height={150} />
            <View style={[styles.previewBadge, { backgroundColor: pastelLights[pastelCycle[index % pastelCycle.length]] }]}>
              <Text style={styles.previewBadgeText}>{post.author.displayName}</Text>
            </View>
            <Text style={styles.previewCaption} numberOfLines={2}>
              {post.caption}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {photos.length === 0 ? (
        <Text style={styles.emptyText}>No photos yet today — be the first! 🌼</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  loadingWrap: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText: { fontFamily: fonts.body, fontSize: 15, color: colors.muted },
  greeting: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 26, color: colors.ink },
  subheading: { fontFamily: fonts.body, fontSize: 15, color: colors.muted, marginTop: spacing.xs },
  streakRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  streakPill: { backgroundColor: colors.butterLight, borderRadius: radii.pill, paddingHorizontal: 16, paddingVertical: 9 },
  streakText: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 14, color: colors.ink },
  countdownPill: { backgroundColor: colors.lavenderLight, borderRadius: radii.pill, paddingHorizontal: 16, paddingVertical: 9, flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },
  countdownLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  countdownText: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 14, color: colors.ink, fontVariant: ['tabular-nums'] },
  heroCard: { backgroundColor: colors.lavender, borderRadius: radii.lg, padding: spacing.lg, marginTop: spacing.lg },
  heroEyebrow: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 13, color: colors.plum, letterSpacing: 1 },
  heroClue: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 30, color: colors.ink, marginTop: spacing.sm },
  heroHint: { fontFamily: fonts.body, fontSize: 15, color: colors.plumSoft, marginTop: spacing.sm, lineHeight: 22 },
  chipRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' },
  ctaButton: { backgroundColor: colors.pinkDeep, borderRadius: radii.pill, paddingVertical: 15, alignItems: 'center', marginTop: spacing.lg },
  ctaText: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 17, color: colors.white },
  liveNote: { fontFamily: fonts.body, fontSize: 12, color: colors.plumSoft, textAlign: 'center', marginTop: spacing.sm },
  sectionTitle: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 19, color: colors.ink, marginTop: spacing.lg },
  friendsRow: { gap: spacing.md, paddingTop: spacing.sm, paddingRight: spacing.sm },
  friendItem: { width: 72, alignItems: 'center' },
  friendName: { fontFamily: fonts.heading, fontWeight: '700', fontSize: 13, color: colors.ink, marginTop: spacing.xs },
  friendClue: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, textAlign: 'center' },
  photosHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  seeAll: { fontFamily: fonts.heading, fontWeight: '700', fontSize: 14, color: colors.pinkDeep },
  photosRow: { gap: spacing.md, paddingTop: spacing.sm, paddingRight: spacing.sm },
  previewCard: { width: 170, backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.sm },
  previewBadge: { alignSelf: 'flex-start', borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 4, marginTop: spacing.sm },
  previewBadgeText: { fontFamily: fonts.heading, fontWeight: '700', fontSize: 12, color: colors.ink },
  previewCaption: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: spacing.xs, lineHeight: 18 },
  emptyText: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, marginTop: spacing.sm },
});
