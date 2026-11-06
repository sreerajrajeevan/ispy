// CameraScreen — LIVE CAMERA ONLY. expo-camera, never the photo library.
// If the camera is unavailable (denied permission, or web/mock), a clearly
// labelled demo fallback lets the flow stay testable with a sample photo.
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors, fonts, radii, spacing } from '../theme';
import { getTodayClue } from '../services/data';

const DEMO_PHOTO_URI = 'https://picsum.photos/seed/ispy-live/800/1000';

export default function CameraScreen({ navigation, route }: any) {
  const routeClueId: string = route?.params?.clueId ?? '';
  const routeClueText: string = route?.params?.clueText ?? '';
  const isDaily: boolean = route?.params?.isDaily ?? true;
  // The floating camera tab opens this screen with no clue — fall back to
  // today's daily clue so the overlay is never blank.
  const [todayClue, setTodayClue] = useState<{ id: string; text: string } | null>(null);
  useEffect(() => {
    if (!routeClueId) getTodayClue().then((c) => setTodayClue({ id: c.id, text: c.text })).catch(() => undefined);
  }, [routeClueId]);
  const clueId: string = routeClueId || todayClue?.id || '';
  const clueText: string = routeClueText || todayClue?.text || 'Today’s clue';

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<React.ComponentRef<typeof CameraView>>(null);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [taking, setTaking] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const goToPreview = (photoUri: string): void => {
    navigation.navigate('Preview', { photoUri, clueId, clueText, isDaily });
  };

  const takePhoto = async (): Promise<void> => {
    if (!cameraRef.current || taking) return;
    setTaking(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (!photo) throw new Error('Could not take the photo. Try again.');
      setCapturedUri(photo.uri);
    } catch (e) {
      setCameraError(e instanceof Error ? e.message : 'Could not take the photo. Try again.');
    } finally {
      setTaking(false);
    }
  };

  // Permission still loading.
  if (!permission) {
    return (
      <View style={styles.centerWrap}>
        <ActivityIndicator size="large" color={colors.pinkDeep} />
        <Text style={styles.centerText}>Warming up the camera…</Text>
      </View>
    );
  }

  // Permission denied (or not yet granted) — friendly message + retry + demo fallback.
  if (!permission.granted) {
    return (
      <View style={styles.centerWrap}>
        <Text style={styles.centerEmoji}>📷</Text>
        <Text style={styles.centerTitle}>We need your camera</Text>
        <Text style={styles.centerText}>
          ispy photos are taken live, right now — that&apos;s what makes the game fun. Please allow camera access to play.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={requestPermission} activeOpacity={0.85}>
          <Text style={styles.primaryButtonText}>Allow camera access</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ghostButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Text style={styles.ghostButtonText}>Not now</Text>
        </TouchableOpacity>
        <Text style={styles.demoNote}>Demo fallback — camera unavailable on this device:</Text>
        <TouchableOpacity style={styles.demoButton} onPress={() => goToPreview(DEMO_PHOTO_URI)} activeOpacity={0.85}>
          <Text style={styles.demoButtonText}>Use a sample photo (demo)</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Photo taken — review it, retake, or continue to Preview.
  if (capturedUri) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: capturedUri }} style={styles.capturedImage} resizeMode="cover" />
        <View style={styles.reviewBar}>
          <TouchableOpacity style={styles.ghostButton} onPress={() => setCapturedUri(null)} activeOpacity={0.85}>
            <Text style={styles.ghostButtonText}>↺  Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={() => goToPreview(capturedUri)} activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>Use this photo →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        onCameraReady={() => setCameraError(null)}
      >
        {/* Clue overlay on top */}
        <View style={styles.clueOverlay}>
          <Text style={styles.clueEyebrow}>🔍 Today&apos;s clue</Text>
          <Text style={styles.clueText}>{clueText}</Text>
          <Text style={styles.clueHint}>Find it, frame it, snap it — live!</Text>
        </View>

        {/* Capture controls at the bottom */}
        <View style={styles.controls}>
          {cameraError ? <Text style={styles.errorText}>{cameraError}</Text> : null}
          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.captureButton, taking ? styles.captureButtonBusy : null]}
              onPress={takePhoto}
              disabled={taking}
              activeOpacity={0.8}
            >
              {taking ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <View style={styles.captureInner} />
              )}
            </TouchableOpacity>
            <View style={styles.controlsSpacer} />
          </View>
          <TouchableOpacity onPress={() => goToPreview(DEMO_PHOTO_URI)} activeOpacity={0.7}>
            <Text style={styles.demoLink}>Camera not working? Use a sample photo (demo)</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.plum },
  camera: { flex: 1 },
  centerWrap: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  centerEmoji: { fontSize: 48 },
  centerTitle: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 22, color: colors.ink, textAlign: 'center' },
  centerText: { fontFamily: fonts.body, fontSize: 15, color: colors.muted, textAlign: 'center', lineHeight: 22 },
  primaryButton: { backgroundColor: colors.pinkDeep, borderRadius: radii.pill, paddingHorizontal: 24, paddingVertical: 14, marginTop: spacing.md },
  primaryButtonText: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 16, color: colors.white },
  ghostButton: { backgroundColor: colors.surface, borderRadius: radii.pill, paddingHorizontal: 24, paddingVertical: 14, marginTop: spacing.sm },
  ghostButtonText: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 16, color: colors.ink },
  demoNote: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: spacing.lg, textAlign: 'center' },
  demoButton: { backgroundColor: colors.lavenderLight, borderRadius: radii.pill, paddingHorizontal: 20, paddingVertical: 12 },
  demoButtonText: { fontFamily: fonts.heading, fontWeight: '700', fontSize: 14, color: colors.plum },
  demoLink: { fontFamily: fonts.body, fontSize: 13, color: colors.white, textAlign: 'center', opacity: 0.85, marginTop: spacing.md },
  clueOverlay: { backgroundColor: 'rgba(43, 33, 64, 0.72)', borderRadius: radii.lg, margin: spacing.lg, marginTop: spacing.xl, padding: spacing.md },
  clueEyebrow: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 12, color: colors.butter, letterSpacing: 1 },
  clueText: { fontFamily: fonts.heading, fontWeight: '800', fontSize: 22, color: colors.white, marginTop: spacing.xs },
  clueHint: { fontFamily: fonts.body, fontSize: 13, color: colors.lavenderLight, marginTop: spacing.xs },
  controls: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cancelButton: { backgroundColor: 'rgba(43, 33, 64, 0.72)', borderRadius: radii.pill, paddingHorizontal: 18, paddingVertical: 12 },
  cancelText: { fontFamily: fonts.heading, fontWeight: '700', fontSize: 14, color: colors.white },
  controlsSpacer: { width: 92 },
  captureButton: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.pinkDeep, borderWidth: 5, borderColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  captureButtonBusy: { opacity: 0.7 },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.white },
  errorText: { fontFamily: fonts.body, fontSize: 13, color: colors.blush, textAlign: 'center', marginBottom: spacing.sm },
  capturedImage: { flex: 1, width: '100%' },
  reviewBar: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'space-between' },
});
