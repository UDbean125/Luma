import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { EmptyState, ErrorBanner, SectionHeader, StatusBadge, DemoBanner } from '../../components/UI';
import { VideoCard } from '../../components/VideoCard';
import { DetectionRow } from '../../components/DetectionRow';
import { fetchVideos, deleteVideo } from '../../services/api';
import { Video, Detection } from '../../types';

const IS_DEMO = process.env.EXPO_PUBLIC_ENABLE_DEMO_FALLBACK !== 'false';
const API_BASE = process.env.EXPO_PUBLIC_SCENE_API_BASE_URL ?? '';

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Video | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError(null);
    try {
      const data = await fetchVideos();
      setVideos(data);
    } catch (e: any) {
      setError(e?.message ?? 'Could not load library');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(true); };

  const handleSelect = (v: Video) => {
    setSelected(v);
    setDetailOpen(true);
  };

  const handleDelete = (v: Video) => {
    Alert.alert(
      'Delete Video',
      `Remove "${v.displayName}" and all its scene data? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVideo(v.id);
              setVideos(prev => prev.filter(x => x.id !== v.id));
              if (selected?.id === v.id) setDetailOpen(false);
            } catch (e: any) {
              Alert.alert('Error', e?.message ?? 'Could not delete video');
            }
          },
        },
      ],
    );
  };

  const filtered = videos.filter(v => {
    const q = search.toLowerCase();
    if (!q) return true;
    if (v.displayName.toLowerCase().includes(q)) return true;
    if (v.filename.toLowerCase().includes(q)) return true;
    if (v.analysis?.detections.some(d =>
      d.label.toLowerCase().includes(q) || d.category.toLowerCase().includes(q)
    )) return true;
    return false;
  });

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.accent} size="large" />
        <Text style={styles.loadText}>Loading library…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Library</Text>
        <Text style={styles.sub}>{videos.length} video{videos.length !== 1 ? 's' : ''}</Text>
      </View>

      {IS_DEMO && !API_BASE && <DemoBanner />}
      {error && <ErrorBanner message={error} onRetry={() => load()} />}

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search videos or products…"
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {filtered.length === 0 && !loading && !error ? (
        <EmptyState
          icon={search ? '🔍' : '🎬'}
          title={search ? 'No matches found' : 'No videos yet'}
          subtitle={search ? `No videos or products match "${search}"` : 'Upload your first video from the Analyze tab.'}
          action={search ? { label: 'Clear Search', onPress: () => setSearch('') } : undefined}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={v => v.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.accent}
              colors={[Colors.accent]}
            />
          }
          renderItem={({ item }) => (
            <VideoCard
              video={item}
              selected={selected?.id === item.id}
              onPress={() => handleSelect(item)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListFooterComponent={<View style={{ height: 40 }} />}
        />
      )}

      {/* Detail Modal */}
      <Modal
        visible={detailOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDetailOpen(false)}
      >
        {selected && (
          <VideoDetailSheet
            video={selected}
            onClose={() => setDetailOpen(false)}
            onDelete={() => handleDelete(selected)}
          />
        )}
      </Modal>
    </View>
  );
}

// ─── Video Detail Sheet ───────────────────────────────────────────────────────
function VideoDetailSheet({
  video,
  onClose,
  onDelete,
}: {
  video: Video;
  onClose: () => void;
  onDelete: () => void;
}) {
  const insets = useSafeAreaInsets();
  const detections: Detection[] = video.analysis?.detections ?? [];
  const [filterCat, setFilterCat] = useState('All');

  const categories = ['All', ...Array.from(new Set(detections.map(d => d.category)))];
  const filtered = filterCat === 'All' ? detections : detections.filter(d => d.category === filterCat);

  return (
    <View style={[sheetStyles.container, { paddingBottom: insets.bottom }]}>
      {/* Handle */}
      <View style={sheetStyles.handle} />

      {/* Header */}
      <View style={sheetStyles.header}>
        <View style={{ flex: 1 }}>
          <Text style={sheetStyles.title} numberOfLines={1}>{video.displayName}</Text>
          <View style={sheetStyles.metaRow}>
            <StatusBadge status={video.status} />
            {video.analysis && (
              <Text style={sheetStyles.meta}>{detections.length} products</Text>
            )}
          </View>
        </View>
        <TouchableOpacity onPress={onClose} style={sheetStyles.closeBtn}>
          <Text style={sheetStyles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Video info */}
      <View style={sheetStyles.infoCard}>
        <InfoRow label="File" value={video.filename} />
        <InfoRow label="Uploaded" value={new Date(video.uploadedAt).toLocaleString()} />
        {video.processedAt && (
          <InfoRow label="Analyzed" value={new Date(video.processedAt).toLocaleString()} />
        )}
        {video.duration && (
          <InfoRow
            label="Duration"
            value={`${Math.floor(video.duration / 60)}m ${video.duration % 60}s`}
          />
        )}
      </View>

      {/* Delete button */}
      <TouchableOpacity
        style={sheetStyles.deleteBtn}
        onPress={onDelete}
        activeOpacity={0.75}
      >
        <Text style={sheetStyles.deleteText}>🗑 Delete Video & Data</Text>
      </TouchableOpacity>

      {/* Detections */}
      {video.status === 'processed' && detections.length > 0 && (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={sheetStyles.pillRow}
          >
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[sheetStyles.pill, filterCat === cat && sheetStyles.pillActive]}
                onPress={() => setFilterCat(cat)}
                activeOpacity={0.7}
              >
                <Text style={[sheetStyles.pillText, filterCat === cat && sheetStyles.pillTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <SectionHeader
            label="Detections"
            count={filtered.length}
            style={sheetStyles.sectionHeader}
          />
        </>
      )}

      {video.status === 'processing' && (
        <View style={sheetStyles.processingBox}>
          <ActivityIndicator color={Colors.processing} />
          <Text style={sheetStyles.processingText}>Analysis in progress…</Text>
        </View>
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={sheetStyles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {filtered.map((det, i) => (
          <DetectionRow key={det.id} detection={det} index={i + 1} />
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={sheetStyles.infoRow}>
      <Text style={sheetStyles.infoLabel}>{label}</Text>
      <Text style={sheetStyles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadText: { color: Colors.textSecondary, fontSize: 14 },

  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  sub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },

  searchRow: { paddingHorizontal: 16, paddingVertical: 10 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchIcon: { fontSize: 15 },
  searchInput: {
    flex: 1,
    height: 42,
    color: Colors.textPrimary,
    fontSize: 14,
  },

  list: { paddingHorizontal: 16, paddingTop: 4 },
  sep: { height: 8 },
});

const sheetStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 12,
  },
  title: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  meta: { fontSize: 12, color: Colors.textSecondary },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },

  infoCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    gap: 12,
  },
  infoLabel: { fontSize: 12, color: Colors.textMuted, width: 80, fontWeight: '600' },
  infoValue: { flex: 1, fontSize: 12, color: Colors.textSecondary },

  deleteBtn: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.error,
    backgroundColor: Colors.errorBg,
    alignItems: 'center',
  },
  deleteText: { color: Colors.error, fontWeight: '700', fontSize: 14 },

  pillRow: { paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  pillActive: { borderColor: Colors.accent, backgroundColor: Colors.accentGlow },
  pillText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  pillTextActive: { color: Colors.accent },

  sectionHeader: { paddingHorizontal: 16, marginBottom: 4 },

  processingBox: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    margin: 16,
    padding: 14,
    backgroundColor: Colors.processingBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.processing,
  },
  processingText: { color: Colors.processing, fontWeight: '600', fontSize: 14 },

  scroll: { paddingHorizontal: 16, paddingTop: 4 },
});
