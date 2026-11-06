import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, fonts, pastelLights, radii, spacing } from '../theme';
import type { Friend, NotificationItem } from '../types';
import { getFriends, getNotifications } from '../services/data';
import { Avatar } from '../components/ui';

const KIND_ICON: Record<NotificationItem['kind'], string> = {
  like: '♥',
  answer: '📷',
  clue: '🔍',
  follow: '👋',
  streak: '🔥',
};

function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

type Tab = 'friends' | 'notifications';

export default function FriendsScreen() {
  const [tab, setTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [f, n] = await Promise.all([getFriends(), getNotifications()]);
      setFriends(f);
      setNotifications(n);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleFollow = (id: string) => {
    setFriends((prev) => prev.map((f) => (f.id === id ? { ...f, isFollowing: !f.isFollowing } : f)));
  };

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.plum} />
        <Text style={styles.loadingText}>Gathering your people…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, tab === 'friends' && styles.tabActive]}
          onPress={() => setTab('friends')}
        >
          <Text style={[styles.tabText, tab === 'friends' && styles.tabTextActive]}>Friends</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'notifications' && styles.tabActive]}
          onPress={() => setTab('notifications')}
        >
          <Text style={[styles.tabText, tab === 'notifications' && styles.tabTextActive]}>
            Notifications{unreadCount > 0 ? ` (${unreadCount})` : ''}
          </Text>
          {unreadCount > 0 ? <View style={styles.dot} /> : null}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.plum} />}
      >
        {tab === 'friends' ? (
          <>
            <Text style={styles.sectionTitle}>Your spotting crew 👀</Text>
            {friends.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>🌱</Text>
                <Text style={styles.emptyTitle}>No friends yet</Text>
                <Text style={styles.emptyBody}>When people follow you — or you find them in the feed — they&apos;ll show up here.</Text>
              </View>
            ) : (
              friends.map((friend) => (
                <View key={friend.id} style={styles.friendRow}>
                  <Avatar profile={friend.profile} size={48} />
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{friend.profile.displayName}</Text>
                    <Text style={styles.friendSub}>@{friend.profile.username}</Text>
                    {friend.lastClue ? (
                      <Text style={styles.friendClue} numberOfLines={1}>Last clue: “{friend.lastClue}”</Text>
                    ) : (
                      <Text style={styles.friendClue}>Hasn&apos;t posted a clue yet</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[styles.followButton, friend.isFollowing ? styles.followingButton : styles.notFollowingButton]}
                    onPress={() => toggleFollow(friend.id)}
                  >
                    <Text style={[styles.followText, friend.isFollowing ? styles.followingText : styles.notFollowingText]}>
                      {friend.isFollowing ? 'Following' : 'Follow'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        ) : (
          <>
            <View style={styles.notifHeader}>
              <Text style={styles.sectionTitle}>What&apos;s new 🔔</Text>
              {unreadCount > 0 ? (
                <TouchableOpacity onPress={markAllRead}>
                  <Text style={styles.markAll}>Mark all read</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            {notifications.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>💤</Text>
                <Text style={styles.emptyTitle}>All quiet here</Text>
                <Text style={styles.emptyBody}>Likes, answers and new clues will pop up here as they happen.</Text>
              </View>
            ) : (
              notifications.map((n) => (
                <TouchableOpacity
                  key={n.id}
                  style={[styles.notifRow, n.read ? styles.notifRead : styles.notifUnread]}
                  onPress={() => markRead(n.id)}
                >
                  <View style={[styles.kindIcon, { backgroundColor: pastelLights[n.pastel] }]}>
                    <Text style={styles.kindIconText}>{KIND_ICON[n.kind]}</Text>
                  </View>
                  <View style={styles.notifBody}>
                    <Text style={styles.notifTitle}>{n.title}</Text>
                    {n.body ? <Text style={styles.notifText}>{n.body}</Text> : null}
                    <Text style={styles.notifTime}>{timeAgo(n.createdAt)}</Text>
                  </View>
                  {!n.read ? <View style={styles.unreadDot} /> : null}
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontFamily: fonts.body, color: colors.muted, marginTop: spacing.sm },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  tabBar: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radii.pill, margin: spacing.md, marginBottom: 0, padding: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: radii.pill, gap: 6 },
  tabActive: { backgroundColor: colors.plum },
  tabText: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 15, color: colors.muted },
  tabTextActive: { color: colors.white },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.pinkDeep },
  sectionTitle: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 19, color: colors.ink, marginBottom: spacing.sm },
  emptyCard: { backgroundColor: colors.lavenderLight, borderRadius: radii.lg, padding: spacing.lg, alignItems: 'center' },
  emptyEmoji: { fontSize: 32 },
  emptyTitle: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 17, color: colors.ink, marginTop: spacing.sm },
  emptyBody: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: spacing.xs, lineHeight: 20 },
  friendRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.sm, marginBottom: spacing.sm, gap: spacing.sm },
  friendInfo: { flex: 1 },
  friendName: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 15, color: colors.ink },
  friendSub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  friendClue: { fontFamily: fonts.body, fontSize: 13, color: colors.plum, marginTop: 2 },
  followButton: { borderRadius: radii.pill, paddingHorizontal: 14, paddingVertical: 8 },
  followingButton: { backgroundColor: colors.lavenderLight },
  notFollowingButton: { backgroundColor: colors.plum },
  followText: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 13 },
  followingText: { color: colors.plum },
  notFollowingText: { color: colors.white },
  notifHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  markAll: { fontFamily: fonts.body, fontWeight: '700', fontSize: 13, color: colors.plum },
  notifRow: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: radii.md, padding: spacing.sm, marginBottom: spacing.sm, gap: spacing.sm },
  notifUnread: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.lavender },
  notifRead: { backgroundColor: colors.surface, opacity: 0.75 },
  kindIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  kindIconText: { fontSize: 18 },
  notifBody: { flex: 1 },
  notifTitle: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 14, color: colors.ink },
  notifText: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 2, lineHeight: 18 },
  notifTime: { fontFamily: fonts.body, fontSize: 12, color: colors.mutedLight, marginTop: 4 },
  unreadDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.pinkDeep, marginTop: 6 },
});
