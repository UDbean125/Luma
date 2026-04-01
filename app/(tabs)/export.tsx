import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  ActivityIndicator,
  Clipboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, getCategoryMeta } from '../../constants/Colors';
import { EmptyState, ErrorBanner, SectionHeader, DemoBanner } from '../../components/UI';
import { fetchVideos, formatTs } from '../../services/api';
import { Video, Detection } from '../../types';

const IS_DEMO = process.env.EXPO_PUBLIC_ENABLE_DEMO_FALLBACK !== 'false';
const API_BASE = process.env.EXPO_PUBLIC_SCENE_API_BASE_URL ?? '';

type ExportFormat = 'plain' | 'csv' | 'youtube' | 'affiliate';

const FORMAT_OPTIONS: { key: ExportFormat; label: string; emoji: string; desc: string }[] = [
  { key: 'plain',     label: 'Plain List',    emoji: '📋', desc: 'Simple timestamped product list' },
  { key: 'youtube',   label: 'YouTube Desc',  emoji: '▶️',  desc: 'Ready to paste into your description' },
  { key: 'csv',       label: 'CSV',           emoji: '📊', desc: 'Import into spreadsheets & dashboards' },
  { key: 'affiliate', label: 'Affiliate',     emoji: '🔗', desc: 'Placeholder links for your affiliate IDs' },
];

function buildExport(video: Video, format: ExportFormat): string {
  const dets = video.analysis?.detections ?? [];
  if (dets.length === 0) return '';

  const title = video.displayName;
  const date = new Date(video.processedAt ?? video.uploadedAt).toLocaleDateString();

  switch (format) {
    case 'plain':
      return [
        `📹 ${title} — Product List`,
        `Analyzed by Luma · ${date}`,
        '',
        ...dets.map(d => `[${formatTs(d.timestamp)}] ${d.label}  (${d.category} · ${Math.round(d.confidence * 100)}%)`),
      ].join('\n');

    case 'youtube':
      return [
        `🛍️ PRODUCTS IN THIS VIDEO`,
        '',
        ...dets.map(d => `${formatTs(d.timestamp)} — ${d.label}`),
        '',
        `📌 Affiliate links (add yours below):`,
        ...dets.map(d => `${d.label}: [YOUR LINK HERE]`),
      ].join('\n');

    case 'csv':
      return [
        'Timestamp,Product,Category,Confidence',
        ...dets.map(d =>
          `"${formatTs(d.timestamp)}","${d.label}","${d.category}","${Math.round(d.confidence * 100)}%"`
        ),
      ].join('\n');

    case 'affiliate':
      return [
        `# ${title} — Affiliate Link Sheet`,
        `Generated: ${date}`,
        '',
        ...dets.map(d =>
          `${formatTs(d.timestamp)} | ${d.label} | ${d.category} | https://your-affiliate-link.com?q=${encodeURIComponent(d.label)}`
        ),
      ].join('\n');

    default:
      return '';
  }
}

export default function ExportScreen() {
  const insets = useSafeAreaInsets();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [format, setFormat] = useState<ExportFormat>('plain');
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchVideos();
      const processed = data.filter(v => v.status === 'processed');
      setVideos(processed);
      setSelectedVideo(processed[0] ?? null);
    } catch (e: any) {
      setError(e?.message ?? 'Could not load videos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const exportText = selectedVideo ? buildExport(selectedVideo, format) : '';

  const handleCopy = async () => {
    if (!exportText) return;
    Clipboard.setString(exportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!exportText) return;
    try {
      await Share.share({
        message: exportText,
        title: `${selectedVideo?.displayName ?? 'Luma'} — Product Export`,
      });
    } catch (e: any) {
      if (e?.message !== 'The user did not share') {
        Alert.alert('Share failed', e?.message ?? 'Could not share');
      }
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.accent} size="large" />
        <Text style={styles.loadText}>Loading exports…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Export</Text>
        <Text style={styles.sub}>Turn detections into affiliate-ready content</Text>
      </View>

      {IS_DEMO && !API_BASE && <DemoBanner />}
      {error && <ErrorBanner message={error} onRetry={load} />}

      {videos.length === 0 && !loading ? (
        <EmptyState
          icon="📤"
          title="Nothing to export yet"
          subtitle="Process a video first. Once Luma analyzes your footage, export your product list here."
        />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Video selector */}
          <SectionHeader label="Select Video" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.videoScroll}
          >
            {videos.map(v => (
              <TouchableOpacity
                key={v.id}
                style={[
                  styles.videoChip,
                  selectedVideo?.id === v.id && styles.videoChipActive,
                ]}
                onPress={() => setSelectedVideo(v)}
                activeOpacity={0.75}
              >
                <Text style={styles.videoChipEmoji}>🎬</Text>
                <Text
                  style={[
                    styles.videoChipText,
                    selectedVideo?.id === v.id && styles.videoChipTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {v.displayName}
                </Text>
                <Text style={styles.videoChipCount}>
                  {v.analysis?.totalDetections ?? 0}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Format selector */}
          <SectionHeader label="Export Format" style={{ marginTop: 20 }} />
          <View style={styles.formatGrid}>
            {FORMAT_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.formatCard, format === opt.key && styles.formatCardActive]}
                onPress={() => setFormat(opt.key)}
                activeOpacity={0.75}
              >
                <Text style={styles.formatEmoji}>{opt.emoji}</Text>
                <Text style={[styles.formatLabel, format === opt.key && styles.formatLabelActive]}>
                  {opt.label}
                </Text>
                <Text style={styles.formatDesc}>{opt.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Preview */}
          {selectedVideo && exportText ? (
            <>
              <SectionHeader label="Preview" style={{ marginTop: 20 }} />
              <View style={styles.previewCard}>
                <Text style={styles.previewText} selectable>
                  {exportText.split('\n').slice(0, 15).join('\n')}
                  {exportText.split('\n').length > 15 && '\n…'}
                </Text>
              </View>

              {/* Stats */}
              <View style={styles.statsRow}>
                <StatChip
                  label="Products"
                  value={String(selectedVideo.analysis?.totalDetections ?? 0)}
                />
                <StatChip
                  label="Lines"
                  value={String(exportText.split('\n').length)}
                />
                <StatChip
                  label="Format"
                  value={FORMAT_OPTIONS.find(f => f.key === format)?.label ?? ''}
                />
              </View>

              {/* Actions */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnPrimary]}
                  onPress={handleCopy}
                  activeOpacity={0.75}
                >
                  <Text style={styles.actionBtnPrimaryText}>
                    {copied ? '✅ Copied!' : '📋 Copy to Clipboard'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnSecondary]}
                  onPress={handleShare}
                  activeOpacity={0.75}
                >
                  <Text style={styles.actionBtnSecondaryText}>📤 Share</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}

          {/* Category breakdown */}
          {selectedVideo?.analysis && (
            <>
              <SectionHeader label="Category Breakdown" style={{ marginTop: 24 }} />
              <CategoryBreakdown detections={selectedVideo.analysis.detections} />
            </>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      )}
    </View>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={chipStyles.chip}>
      <Text style={chipStyles.value}>{value}</Text>
      <Text style={chipStyles.label}>{label}</Text>
    </View>
  );
}

function CategoryBreakdown({ detections }: { detections: Detection[] }) {
  const byCategory = detections.reduce<Record<string, number>>((acc, d) => {
    acc[d.category] = (acc[d.category] ?? 0) + 1;
    return acc;
  }, {});
  const total = detections.length;
  const sorted = Object.entries(byCategory).sort(([, a], [, b]) => b - a);

  return (
    <View style={breakdownStyles.container}>
      {sorted.map(([cat, count]) => {
        const meta = getCategoryMeta(cat);
        const pct = Math.round((count / total) * 100);
        return (
          <View key={cat} style={breakdownStyles.row}>
            <Text style={breakdownStyles.emoji}>{meta.emoji}</Text>
            <Text style={[breakdownStyles.cat, { color: meta.color }]}>{cat}</Text>
            <View style={breakdownStyles.barTrack}>
              <View
                style={[
                  breakdownStyles.barFill,
                  { width: `${pct}%` as any, backgroundColor: meta.color },
                ]}
              />
            </View>
            <Text style={breakdownStyles.count}>{count}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadText: { color: Colors.textSecondary, fontSize: 14 },

  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  sub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 12 },

  videoScroll: { paddingBottom: 12, gap: 10 },
  videoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    maxWidth: 220,
  },
  videoChipActive: { borderColor: Colors.accent, backgroundColor: Colors.accentGlow },
  videoChipEmoji: { fontSize: 16 },
  videoChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, flex: 1 },
  videoChipTextActive: { color: Colors.accent },
  videoChipCount: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },

  formatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  formatCard: {
    width: '47.5%',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  formatCardActive: { borderColor: Colors.accent, backgroundColor: Colors.accentGlow },
  formatEmoji: { fontSize: 22, marginBottom: 2 },
  formatLabel: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  formatLabelActive: { color: Colors.accent },
  formatDesc: { fontSize: 11, color: Colors.textMuted, lineHeight: 16 },

  previewCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  previewText: { fontSize: 12, color: Colors.textSecondary, fontFamily: 'monospace', lineHeight: 18 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },

  actionRow: { gap: 10, marginBottom: 4 },
  actionBtn: { padding: 16, borderRadius: 12, alignItems: 'center' },
  actionBtnPrimary: { backgroundColor: Colors.accent },
  actionBtnPrimaryText: { color: Colors.background, fontWeight: '800', fontSize: 15 },
  actionBtnSecondary: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  actionBtnSecondaryText: { color: Colors.textPrimary, fontWeight: '700', fontSize: 15 },
});

const chipStyles = StyleSheet.create({
  chip: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    gap: 2,
  },
  value: { fontSize: 18, fontWeight: '800', color: Colors.accent },
  label: { fontSize: 11, color: Colors.textMuted, fontWeight: '500' },
});

const breakdownStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emoji: { fontSize: 16, width: 24 },
  cat: { fontSize: 13, fontWeight: '600', width: 90, textTransform: 'capitalize' },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3 },
  count: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, width: 20, textAlign: 'right' },
});
