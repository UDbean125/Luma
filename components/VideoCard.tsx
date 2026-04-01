import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { Video } from '../types';
import { StatusBadge } from './UI';
import { formatTs } from '../services/api';

interface VideoCardProps {
  video: Video;
  selected?: boolean;
  onPress: () => void;
}

export function VideoCard({ video, selected, onPress }: VideoCardProps) {
  const detectionCount = video.analysis?.totalDetections ?? 0;
  const dur = video.duration ? formatTs(video.duration) : null;

  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Thumbnail placeholder */}
      <View style={styles.thumb}>
        <Text style={styles.thumbIcon}>🎬</Text>
        {dur && (
          <View style={styles.durBadge}>
            <Text style={styles.durText}>{dur}</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{video.displayName}</Text>
        <View style={styles.meta}>
          <StatusBadge status={video.status} />
          {video.status === 'processed' && detectionCount > 0 && (
            <Text style={styles.detCount}>{detectionCount} products</Text>
          )}
        </View>
        <Text style={styles.date}>
          {new Date(video.uploadedAt).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
          })}
        </Text>
      </View>

      {/* Selection indicator */}
      {selected && <View style={styles.selDot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cardSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentGlow,
  },

  thumb: {
    width: 64,
    height: 52,
    borderRadius: 8,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  thumbIcon: { fontSize: 22 },
  durBadge: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  durText: { color: Colors.textPrimary, fontSize: 9, fontWeight: '700' },

  info: { flex: 1, gap: 5 },
  name: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detCount: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  date: { fontSize: 11, color: Colors.textMuted },

  selDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
});
