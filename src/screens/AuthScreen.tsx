import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, fonts, radii, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';

type Step = 'email' | 'code';

export default function AuthScreen({ navigation }: any) {
  const { isMock, demoSignIn, signInWithGoogle, sendOtp, verifyOtp } = useAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<Step>('email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleGoogle = async () => {
    setError('');
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google sign-in failed — please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleSendCode = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('That email doesn’t look quite right — check it and try again.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await sendOtp(trimmed);
      setStep('code');
      setInfo(isMock ? 'Mock mode: any code works — try 123456.' : `We sent a 6-digit code to ${trimmed}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send the code — please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    const trimmedCode = code.trim();
    if (trimmedCode.length < 4) {
      setError('Enter the code we sent you.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await verifyOtp(email.trim().toLowerCase(), trimmedCode);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That code didn’t work — please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleDemo = async () => {
    setError('');
    setBusy(true);
    try {
      await demoSignIn();
      if (navigation && typeof navigation.replace === 'function') {
        navigation.replace('MainTabs');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Demo sign-in failed — please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.hero}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroEmoji}>🔍</Text>
        </View>
        <Text style={styles.appName}>ispy</Text>
        <Text style={styles.tagline}>Spot it. Snap it. Share it.</Text>
        <Text style={styles.heroCopy}>
          One clue a day, for everyone. See it, snap it live, and show the world what you found.
        </Text>
        <View style={styles.heroBlocks}>
          <View style={[styles.heroBlock, { backgroundColor: colors.butter }]}><Text style={styles.heroBlockText}>🌼</Text></View>
          <View style={[styles.heroBlock, { backgroundColor: colors.babyBlue }]}><Text style={styles.heroBlockText}>📷</Text></View>
          <View style={[styles.heroBlock, { backgroundColor: colors.blush }]}><Text style={styles.heroBlockText}>💛</Text></View>
          <View style={[styles.heroBlock, { backgroundColor: colors.mint }]}><Text style={styles.heroBlockText}>🌿</Text></View>
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {info ? <Text style={styles.info}>{info}</Text> : null}

      <TouchableOpacity style={[styles.googleButton, busy && styles.buttonDisabled]} onPress={handleGoogle} disabled={busy}>
        <Text style={styles.googleButtonText}>G  Continue with Google</Text>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or with email</Text>
        <View style={styles.dividerLine} />
      </View>

      {step === 'email' ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={colors.mutedLight}
            value={email}
            onChangeText={(v) => { setEmail(v); if (error) setError(''); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={[styles.primaryButton, busy && styles.buttonDisabled]} onPress={handleSendCode} disabled={busy}>
            <Text style={styles.primaryButtonText}>{busy ? 'Sending…' : 'Send code ✉️'}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.codeHint}>Code sent to {email.trim()}</Text>
          <TextInput
            style={styles.input}
            placeholder="6-digit code"
            placeholderTextColor={colors.mutedLight}
            value={code}
            onChangeText={(v) => { setCode(v.replace(/[^0-9]/g, '')); if (error) setError(''); }}
            keyboardType="number-pad"
            maxLength={6}
          />
          <TouchableOpacity style={[styles.primaryButton, busy && styles.buttonDisabled]} onPress={handleVerify} disabled={busy}>
            <Text style={styles.primaryButtonText}>{busy ? 'Checking…' : 'Verify & jump in ✨'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => { setStep('email'); setCode(''); setInfo(''); }}
          >
            <Text style={styles.linkText}>Use a different email</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity style={[styles.demoButton, busy && styles.buttonDisabled]} onPress={handleDemo} disabled={busy}>
        <Text style={styles.demoButtonText}>Continue as demo {isMock ? '(mock mode)' : ''}</Text>
      </TouchableOpacity>
      <Text style={styles.demoNote}>Demo mode lets you explore ispy with sample data — no account needed.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl, flexGrow: 1, justifyContent: 'center' },
  hero: { alignItems: 'center', marginBottom: spacing.lg },
  heroBadge: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.lavender, alignItems: 'center', justifyContent: 'center' },
  heroEmoji: { fontSize: 40 },
  appName: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 52, color: colors.plum, marginTop: spacing.sm, letterSpacing: 1 },
  tagline: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 18, color: colors.ink, marginTop: 2 },
  heroCopy: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 21, marginTop: spacing.sm, paddingHorizontal: spacing.md },
  heroBlocks: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  heroBlock: { width: 56, height: 56, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  heroBlockText: { fontSize: 26 },
  error: { fontFamily: fonts.body, fontWeight: '700', fontSize: 14, color: colors.danger, textAlign: 'center', marginBottom: spacing.sm },
  info: { fontFamily: fonts.body, fontWeight: '700', fontSize: 14, color: colors.plum, textAlign: 'center', marginBottom: spacing.sm },
  googleButton: { backgroundColor: colors.surface, borderRadius: radii.pill, paddingVertical: 15, alignItems: 'center', borderWidth: 1.5, borderColor: colors.border },
  googleButtonText: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 16, color: colors.ink },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg, gap: spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  input: { backgroundColor: colors.surface, borderRadius: radii.md, paddingHorizontal: spacing.md, paddingVertical: 14, fontFamily: fonts.body, fontSize: 16, color: colors.ink, marginBottom: spacing.sm },
  codeHint: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, textAlign: 'center', marginBottom: spacing.sm },
  primaryButton: { backgroundColor: colors.plum, borderRadius: radii.pill, paddingVertical: 15, alignItems: 'center' },
  primaryButtonText: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 16, color: colors.white },
  buttonDisabled: { opacity: 0.6 },
  linkButton: { alignItems: 'center', paddingVertical: spacing.sm },
  linkText: { fontFamily: fonts.body, fontWeight: '700', fontSize: 14, color: colors.plum },
  demoButton: { backgroundColor: colors.mintLight, borderRadius: radii.pill, paddingVertical: 14, alignItems: 'center', marginTop: spacing.lg },
  demoButtonText: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 15, color: colors.plum },
  demoNote: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: spacing.sm, lineHeight: 17 },
});
