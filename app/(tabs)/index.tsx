import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import {
  EmptyState,
  ErrorBanner,
  DemoBanner,
  SectionHeader,
  CategoryTag,
} from '../../components/UI';
import { DetectionRow } from '../../components/DetectionRow';
import { fetchVideos, uploadVideo, triggerProcessing, DEMO_VIDEOS } from '../../services/api';
import { Video, Detection } from '../../types';

const IS_DEMO = process.env.EXPO_PUBLIC_ENABLE_DEMO_FALLBACK !== 'false';
const API_BASE = process.env.EXPO_PUBLIC_SCENE_API_BASE_URL ?? '';

export default function AnalyzeScreen() {
  const insets = useSafeAreaInsets();
  const [videos, setVideos] = useState<Video[]>([]);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<string>('All');

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError(null);
    try {
      const data = await fetchVideos();
      setVideos(data);
      const latest = data.find(v => v.status === 'processed') ?? data[0] ?? null;
      setActiveVideo(latest);
    } catch (e: any) {
      setError(e?.message ?? 'Could not load videos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  const handleUpload = () => {
    Alert.alert(
      'Upload Video',
      'Select a video from your library to analyze.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Choose Video',
          onPress: async () => {
            setUploading(true);
            try {
              // In a real implementation, use expo-image-picker or expo-document-picker
              // For now we simulate upload with a mock
              if (IS_DEMO && !API_BASE) {
                Alert.alert(
                  'Demo Mode',
                  'Connect your backend to upload real footage. Demo videos are loaded automatically.',
                );
                return;
              }
              Alert.alert('Coming Soon', 'Video picker integration requires expo-image-picker. Add it to your dependencies and wire up the file picker here.');
            } finally {
              setUploading(false);
            }
          },
        },
      ],
    );
  };

  // Detections for active video
  const detections: Detection[] = activeVideo?.analysis?.detections ?? [];
  const categories = ['All', ...Array.from(new Set(detections.map(d => d.category)))];
  const filtered = filterCat === 'All' ? detections : detections.filter(d => d.category === filterCat);

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.accent} size="large" />
        <Text style={styles.loadText}>Loading Luma…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.wordmark}>Luma<Text style={styles.dot}>·</Text></Text>
          <Text style={styles.subhead}>Scene Intelligence</Text>
        </View>
        <TouchableOpacity
          style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]}
          onPress={handleUpload}
          disabled={uploading}
          activeOpacity={0.75}
        >
          {uploading
            ? <ActivityIndicator size="small" color={Colors.background} />
            : <Text style={styles.uploadBtnText}>+ Upload</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Demo banner */}
      {IS_DEMO && !API_BASE && <DemoBanner />}

      {/* Error */}
      {error && <ErrorBanner message={error} onRetry={() => load()} />}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
            colors={[Colors.accent]}
          />
        }
      >
        {/* Active Video Banner */}
        {activeVideo && (
          <View style={styles.videoBanner}>
            <View style={styles.videoBannerLeft}>
              <Text style={styles.videoBannerEmoji}>🎬</Text>
              <View style={styles.videoBannerInfo}>
                <Text style={styles.videoBannerName} numberOfLines={1}>
                  {activeVideo.displayName}
                </Text>
                <Text style={styles.videoBannerMeta}>
                  {activeVideo.status === 'processed'
                    ? `${detections.length} products detected`
                    : activeVideo.status === 'processing'
                    ? 'Analysis in progress…'
                    : 'Awaiting processing'}
                </Text>
              </View>
            </View>
            {activeVideo.status === 'processing' && (
              <ActivityIndicator size="small" color={Colors.processing} />
            )}
            {activeVideo.status === 'processed' && (
              <View style={styles.doneCheck}>
                <Text style={{ fontSize: 16 }}>✅</Text>
              </View>
            )}
          </View>
        )}

        {/* Stats row */}
        {activeVideo?.status === 'processed' && detections.length > 0 && (
          <View style={styles.statsRow}>
            {[
              { label: 'Products', value: String(detections.length) },
              {
                label: 'Avg Confidence',
                value:
                  Math.round(
                    (detections.reduce((a, d) => a + d.confidence, 0) / detections.length) * 100,
                  ) + '%',
              },
              {
                label: 'Categories',
                value: String(new Set(detections.map(d => d.category)).size),
              },
            ].map(s => (
              <View key={s.label} style={styles.statCard}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* No video state */}
        {!activeVideo && !error && (
          <EmptyState
            icon="🔮"
            title="No footage yet"
            subtitle="Upload a video and Luma will scan every frame for monetizable products."
            action={{ label: 'Upload Video', onPress: handleUpload }}
          />
        )}

        {/* Processing state */}
        {activeVideo?.status === 'processing' && (
          <View style={styles.processingCard}>
            <ActivityIndicator color={Colors.processing} size="large" />
            <Text style={styles.processingTitle}>Scanning Your Footage</Text>
            <Text style={styles.processingSub}>
              Luma's vision models are analyzing frame by frame. This usually takes 1–2 minutes.
            </Text>
          </View>
        )}

        {/* Detections */}
        {activeVideo?.status === 'processed' && detections.length > 0 && (
          <>
            {/* Category filter pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillRow}
            >
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.filterPill, filterCat === cat && styles.filterPillActive]}
                  onPress={() => setFilterCat(cat)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterPillText, filterCat === cat && styles.filterPillTextActive]}>
                    {cat === 'All' ? 'All' : cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <SectionHeader
              label="Detected Products"
              count={filtered.length}
              style={{ marginTop: 4 }}
            />

            {filtered.map((det, i) => (
              <DetectionRow key={det.id} detection={det} index={i + 1} />
            ))}

            <View style={styles.bottomPad} />
          </>
        )}

        {/* Processed but no detections */}
        {activeVideo?.status === 'processed' && detections.length === 0 && (
          <EmptyState
            icon="🤔"
            title="No products detected"
            subtitle="Luma didn't find any monetizable products in this video. Try a different clip."
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadText: { color: Colors.textSecondary, fontSize: 14 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  wordmark: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  dot: { color: Colors.accent },
  subhead: { fontSize: 12, color: Colors.textMuted, fontWeight: '500', marginTop: 1 },

  uploadBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.accent,
  },
  uploadBtnDisabled: { opacity: 0.5 },
  uploadBtnText: { color: Colors.background, fontWeight: '800', fontSize: 14 },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 8, flexGrow: 1 },

  videoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  videoBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  videoBannerEmoji: { fontSize: 28 },
  videoBannerInfo: { flex: 1 },
  videoBannerName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  videoBannerMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  doneCheck: {},

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    gap: 3,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.accent },
  statLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },

  processingCard: {
    backgroundColor: Colors.processingBg,
    borderWidth: 1,
    borderColor: Colors.processing,
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
    gap: 14,
    marginTop: 20,
  },
  processingTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  processingSub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  pillRow: {
    paddingBottom: 14,
    gap: 8,
    flexDirection: 'row',
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  filterPillActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentGlow,
  },
  filterPillText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  filterPillTextActive: { color: Colors.accent },

  bottomPad: { height: 40 },
});
