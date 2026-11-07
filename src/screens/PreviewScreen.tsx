// PreviewScreen — review the live photo just taken, add a caption,
// then post it for the clue.
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, fonts, radii, spacing } from '../theme';
import { uploadLivePhoto } from '../services/data';
import { PastelChip } from '../components/ui';

export default function PreviewScreen({ navigation, route }: any) {
  const photoUri: string = route?.params?.photoUri ?? '';
  const clueId: string = route?.params?.clueId ?? '';
  const clueText: string = route?.params?.clueText ?? '';
  const isDaily: boolean = route?.params?.isDaily ?? true;

  const [caption, setCaption] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const postIt = async (): Promise<void> => {
    if (posting || !photoUri) return;
    setPosting(true);
    setError(null);
    try {
      await uploadLivePhoto(photoUri, clueId, caption.trim(), isDaily);
      navigation.navigate('MainTabs');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not post your photo. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const retake = (): void => {
    navigation.navigate('Camera', { clueId, clueText, isDaily });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Looking good! 👀</Text>
        <Text style={styles.subtitle}>Add a caption and share it with everyone.</Text>

        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={[styles.photo, styles.photoMissing]}>
            <Text style={styles.photoMissingText}>No photo to preview</Text>
          </View>
        )}

        <View style={styles.chipRow}>
          <PastelChip label={`🔍 ${clueText}`} pastel="lavender" />
          <PastelChip label="Taken live just now" pastel="mint" />
        </View>

        <Text style={styles.label}>Caption</Text>
        <TextInput
          style={styles.captionInput}
          value={caption}
          onChangeText={setCaption}
          placeholder="Where did you find it? Tell the story…"
          placeholderTextColor={colors.mutedLight}
          multiline
          maxLength={200}
        />
        <Text style={styles.charCount}>{caption.length}/200</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.postButton, posting ? styles.postButtonBusy : null]}
          onPress={postIt}
          disabled={posting}
          activeOpacity={0.85}
        >
          {posting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.postButtonText}>Post it 🎉</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.retakeButton} onPress={retake} activeOpacity={0.85}>
          <Text style={styles.retakeButtonText}>↺  Retake photo</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  title: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 26, color: colors.ink },
  subtitle: { fontFamily: fonts.body, fontSize: 15, color: colors.muted, marginTop: spacing.xs },
  photo: { width: '100%', height: 380, borderRadius: radii.lg, marginTop: spacing.lg, backgroundColor: colors.lavenderLight },
  photoMissing: { alignItems: 'center', justifyContent: 'center' },
  photoMissingText: { fontFamily: fonts.body, fontSize: 15, color: colors.muted },
  chipRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' },
  label: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 15, color: colors.ink, marginTop: spacing.lg },
  captionInput: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.sm,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
    minHeight: 84,
    textAlignVertical: 'top',
  },
  charCount: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, textAlign: 'right', marginTop: spacing.xs },
  errorText: { fontFamily: fonts.body, fontSize: 14, color: colors.danger, marginTop: spacing.sm, textAlign: 'center' },
  postButton: { backgroundColor: colors.pinkDeep, borderRadius: radii.pill, paddingVertical: 15, alignItems: 'center', marginTop: spacing.lg },
  postButtonBusy: { opacity: 0.7 },
  postButtonText: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 17, color: colors.white },
  retakeButton: { backgroundColor: colors.surface, borderRadius: radii.pill, paddingVertical: 14, alignItems: 'center', marginTop: spacing.sm },
  retakeButtonText: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 16, color: colors.ink },
});
