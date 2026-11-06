import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, fonts, pastelLights, radii, spacing } from '../theme';
import type { PastelKey } from '../types';
import { postClue } from '../services/data';
import { PastelChip } from '../components/ui';

const CATEGORIES: { label: string; pastel: PastelKey }[] = [
  { label: 'Colour hunt', pastel: 'lavender' },
  { label: 'Feelings', pastel: 'blush' },
  { label: 'Tricky', pastel: 'butter' },
  { label: 'Nature', pastel: 'mint' },
  { label: 'At home', pastel: 'peach' },
  { label: 'Out & about', pastel: 'babyBlue' },
];

const EXAMPLE_IDEAS = [
  '“Something that smells like rain”',
  '“A shadow that looks like an animal”',
  '“The tiniest thing in your kitchen”',
];

export default function CreateClueScreen({ navigation }: any) {
  const [text, setText] = useState('');
  const [hint, setHint] = useState('');
  const [category, setCategory] = useState<string>('Colour hunt');
  const [error, setError] = useState('');
  const [posting, setPosting] = useState(false);

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError('Give your clue some words first — even a tiny one works!');
      return;
    }
    setError('');
    setPosting(true);
    try {
      const newClue = await postClue(trimmed, hint.trim(), category);
      navigation.navigate('ClueThread', { clueId: newClue.id });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not post your clue — please try again.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>Post a clue 🔍</Text>
      <Text style={styles.subheading}>
        Dream up something for everyone to spot. Keep it playful — the best clues are the ones that make people look twice.
      </Text>

      <Text style={styles.label}>Your clue *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Something that makes you smile"
        placeholderTextColor={colors.mutedLight}
        value={text}
        onChangeText={(v) => { setText(v); if (error) setError(''); }}
        multiline
        maxLength={140}
      />
      <Text style={styles.counter}>{text.length}/140</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.label}>Hint (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="A gentle nudge — where should they look?"
        placeholderTextColor={colors.mutedLight}
        value={hint}
        onChangeText={setHint}
        multiline
        maxLength={140}
      />

      <Text style={styles.label}>Pick a flavour</Text>
      <View style={styles.chipRow}>
        {CATEGORIES.map((c) => {
          const selected = category === c.label;
          return (
            <TouchableOpacity
              key={c.label}
              onPress={() => setCategory(c.label)}
              style={[styles.chipWrap, selected && { backgroundColor: pastelLights[c.pastel], borderColor: colors.plum }]}
            >
              <PastelChip label={c.label} pastel={c.pastel} />
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={[styles.postButton, posting && styles.postButtonDisabled]} onPress={submit} disabled={posting}>
        <Text style={styles.postButtonText}>{posting ? 'Posting…' : 'Post my clue ✨'}</Text>
      </TouchableOpacity>

      <View style={styles.ideasCard}>
        <Text style={styles.ideasTitle}>Stuck for ideas?</Text>
        {EXAMPLE_IDEAS.map((idea) => (
          <TouchableOpacity key={idea} onPress={() => setText(idea.replace(/[“”]/g, ''))}>
            <Text style={styles.idea}>{idea} — tap to use</Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.ideasNote}>Anyone can answer your clue with a live photo. No gallery uploads, no old pictures — just what&apos;s in front of them right now.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  heading: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 26, color: colors.ink },
  subheading: { fontFamily: fonts.body, fontSize: 15, color: colors.muted, lineHeight: 22, marginTop: spacing.xs, marginBottom: spacing.lg },
  label: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 15, color: colors.ink, marginTop: spacing.md, marginBottom: spacing.sm },
  input: { backgroundColor: colors.surface, borderRadius: radii.md, paddingHorizontal: spacing.md, paddingVertical: 14, fontFamily: fonts.body, fontSize: 16, color: colors.ink, minHeight: 56, textAlignVertical: 'top' },
  counter: { fontFamily: fonts.body, fontSize: 12, color: colors.mutedLight, textAlign: 'right', marginTop: 4 },
  error: { fontFamily: fonts.body, fontWeight: '700', fontSize: 14, color: colors.danger, marginTop: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chipWrap: { borderRadius: radii.pill, borderWidth: 2, borderColor: 'transparent', padding: 2 },
  postButton: { backgroundColor: colors.plum, borderRadius: radii.pill, paddingVertical: 16, alignItems: 'center', marginTop: spacing.lg },
  postButtonDisabled: { opacity: 0.6 },
  postButtonText: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 17, color: colors.white },
  ideasCard: { backgroundColor: colors.mintLight, borderRadius: radii.lg, padding: spacing.lg, marginTop: spacing.lg },
  ideasTitle: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 16, color: colors.ink, marginBottom: spacing.sm },
  idea: { fontFamily: fonts.body, fontSize: 14, color: colors.plum, lineHeight: 24 },
  ideasNote: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, lineHeight: 19, marginTop: spacing.sm },
});
