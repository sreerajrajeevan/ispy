import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, fonts, pastelLights, radii, spacing } from '../theme';
import type { PhotoPost, Profile } from '../types';
import { getMe, getMyPhotos } from '../services/data';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/ui';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const GRID_GAP = spacing.sm;
const GRID_WIDTH = (Dimensions.get('window').width - spacing.md * 2 - GRID_GAP) / 2;

interface StreakDay {
  key: string;
  letter: string;
  active: boolean;
  isToday: boolean;
}

function buildStreakWeek(streak: number): StreakDay[] {
  const days: StreakDay[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push({
      key: d.toISOString().slice(0, 10),
      letter: DAY_LETTERS[d.getDay()],
      // The streak counts back from today: the last `streak` days are active.
      active: i < streak,
      isToday: i === 0,
    });
  }
  return days;
}

export default function ProfileScreen({ navigation }: any) {
  const { isMock, signOut } = useAuth();
  const [me, setMe] = useState<Profile | null>(null);
  const [photos, setPhotos] = useState<PhotoPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [deleteNote, setDeleteNote] = useState(false);

  const load = useCallback(async () => {
    try {
      const [profile, mine] = await Promise.all([getMe(), getMyPhotos()]);
      setMe(profile);
      setPhotos(mine);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  if (loading || !me) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.plum} />
        <Text style={styles.loadingText}>Opening your profile…</Text>
      </View>
    );
  }

  const streakWeek = buildStreakWeek(me.streak);
  const stats: { label: string; value: number }[] = [
    { label: 'Photos', value: me.photosCount },
    { label: 'Followers', value: me.followers },
    { label: 'Following', value: me.following },
    { label: 'Likes', value: me.totalLikes },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <Avatar profile={me} size={84} />
        <Text style={styles.displayName}>{me.displayName}</Text>
        <Text style={styles.username}>@{me.username}</Text>
        {me.bio ? <Text style={styles.bio}>{me.bio}</Text> : null}
        <View style={styles.statsRow}>
          {stats.map((s) => (
            <View key={s.label} style={styles.stat}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.streakCard}>
        <View style={styles.streakHeader}>
          <Text style={styles.streakTitle}>🔥 {me.streak}-day streak</Text>
          <Text style={styles.streakSub}>Snap the daily clue to keep it alive</Text>
        </View>
        <View style={styles.weekRow}>
          {streakWeek.map((day, i) => (
            <View key={day.key} style={styles.dayCell}>
              <View
                style={[
                  styles.dayDot,
                  { backgroundColor: day.active ? pastelLights[['mint', 'butter', 'babyBlue', 'blush', 'lavender', 'peach', 'mint'][i % 7] as 'mint' | 'butter' | 'babyBlue' | 'blush' | 'lavender' | 'peach'] : colors.border },
                  day.isToday && styles.todayDot,
                ]}
              >
                <Text style={styles.dayDotText}>{day.active ? '✓' : ''}</Text>
              </View>
              <Text style={[styles.dayLetter, day.isToday && styles.todayLetter]}>{day.letter}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.sectionTitle}>My photos</Text>
      {photos.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>📷</Text>
          <Text style={styles.emptyTitle}>No photos yet</Text>
          <Text style={styles.emptyBody}>Your live snaps will live here. Go answer today&apos;s clue!</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {photos.map((photo) => (
            <TouchableOpacity
              key={photo.id}
              style={styles.gridItem}
              onPress={() => navigation.navigate('PostDetail', { postId: photo.id })}
            >
              <Image source={{ uri: photo.image }} style={styles.gridImage} resizeMode="cover" />
              <View style={styles.gridOverlay}>
                <Text style={styles.gridLikes}>♥ {photo.likes}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Settings</Text>
      <View style={styles.settingsCard}>
        {isMock ? (
          <View style={styles.mockNote}>
            <Text style={styles.mockNoteTitle}>🧪 Mock mode</Text>
            <Text style={styles.mockNoteBody}>You&apos;re exploring with sample data — no account or backend is connected yet.</Text>
          </View>
        ) : null}
        <TouchableOpacity style={styles.signOutButton} onPress={onSignOut} disabled={signingOut}>
          <Text style={styles.signOutText}>{signingOut ? 'Signing out…' : 'Sign out'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => setDeleteNote(true)}>
          <Text style={styles.deleteText}>Delete account</Text>
        </TouchableOpacity>
        {deleteNote ? (
          <Text style={styles.deleteNote}>
            Account deletion is available in Settings on the web — contact support for now.
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontFamily: fonts.body, color: colors.muted, marginTop: spacing.sm },
  headerCard: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, alignItems: 'center' },
  displayName: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 24, color: colors.ink, marginTop: spacing.sm },
  username: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, marginTop: 2 },
  bio: { fontFamily: fonts.body, fontSize: 14, color: colors.ink, textAlign: 'center', lineHeight: 20, marginTop: spacing.sm },
  statsRow: { flexDirection: 'row', marginTop: spacing.md, width: '100%' },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 18, color: colors.ink },
  statLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  streakCard: { backgroundColor: colors.butterLight, borderRadius: radii.lg, padding: spacing.lg, marginTop: spacing.md },
  streakHeader: { marginBottom: spacing.sm },
  streakTitle: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 18, color: colors.ink },
  streakSub: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 2 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCell: { alignItems: 'center', gap: 6 },
  dayDot: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  todayDot: { borderWidth: 2.5, borderColor: colors.plum },
  dayDotText: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 15, color: colors.plum },
  dayLetter: { fontFamily: fonts.body, fontWeight: '700', fontSize: 12, color: colors.muted },
  todayLetter: { color: colors.plum },
  sectionTitle: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 18, color: colors.ink, marginTop: spacing.lg, marginBottom: spacing.sm },
  emptyCard: { backgroundColor: colors.lavenderLight, borderRadius: radii.lg, padding: spacing.lg, alignItems: 'center' },
  emptyEmoji: { fontSize: 32 },
  emptyTitle: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 17, color: colors.ink, marginTop: spacing.sm },
  emptyBody: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: spacing.xs, lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  gridItem: { width: GRID_WIDTH, height: GRID_WIDTH, borderRadius: radii.md, overflow: 'hidden' },
  gridImage: { width: '100%', height: '100%' },
  gridOverlay: { position: 'absolute', right: 8, bottom: 8, backgroundColor: 'rgba(43,33,64,0.65)', borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 4 },
  gridLikes: { fontFamily: fonts.body, fontWeight: '800', fontSize: 12, color: colors.white },
  settingsCard: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.md },
  mockNote: { backgroundColor: colors.babyBlueLight, borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.sm },
  mockNoteTitle: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 14, color: colors.ink },
  mockNoteBody: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 4, lineHeight: 18 },
  signOutButton: { backgroundColor: colors.lavenderLight, borderRadius: radii.pill, paddingVertical: 13, alignItems: 'center' },
  signOutText: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 15, color: colors.plum },
  deleteButton: { borderRadius: radii.pill, paddingVertical: 13, alignItems: 'center', marginTop: spacing.sm },
  deleteText: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 15, color: colors.danger },
  deleteNote: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 19, marginTop: spacing.xs, backgroundColor: colors.background, borderRadius: radii.md, padding: spacing.sm },
});
