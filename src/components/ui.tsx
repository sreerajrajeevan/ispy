import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, fonts, pastelLights, radii } from '../theme';
import type { PastelKey, Profile } from '../types';

export function Avatar({ profile, size = 44 }: { profile: Profile; size?: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: pastelLights[profile.avatarColor] }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.42 }]}>{profile.avatarInitial}</Text>
    </View>
  );
}

export function PastelChip({ label, pastel, onPress }: { label: string; pastel: PastelKey; onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} style={[styles.chip, { backgroundColor: pastelLights[pastel] }]}>
      <Text style={styles.chipText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function PhotoCardImage({ uri, height = 260 }: { uri: string; height?: number }) {
  return <Image source={{ uri }} style={[styles.photo, { height }]} resizeMode="cover" />;
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.heading, fontWeight: '800', color: colors.ink },
  chip: { borderRadius: radii.pill, paddingHorizontal: 14, paddingVertical: 7 },
  chipText: { fontFamily: fonts.body, fontWeight: '700', fontSize: 13, color: colors.ink },
  photo: { width: '100%', borderRadius: radii.lg },
});
