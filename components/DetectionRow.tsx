import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { Colors, getCategoryMeta } from '../constants/Colors';
import { Detection } from '../types';
import { ConfidenceBar, CategoryTag } from './UI';
import { formatTs } from '../services/api';

interface DetectionRowProps {
  detection: Detection;
  index: number;
}

export function DetectionRow({ detection, index }: DetectionRowProps) {
  const meta = getCategoryMeta(detection.category);

  const handleCopy = () => {
    const text = `${detection.label} · ${formatTs(detection.timestamp)} · ${Math.round(detection.confidence * 100)}% confidence`;
    Share.share({ message: text }).catch(() => {});
  };

  return (
    <View style={[styles.row, { borderLeftColor: meta.color }]}>
      {/* Index + timestamp */}
      <View style={styles.left}>
        <Text style={styles.idx}>{String(index).padStart(2, '0')}</Text>
        <View style={[styles.tsBadge, { backgroundColor: meta.bg }]}>
          <Text style={[styles.ts, { color: meta.color }]}>{formatTs(detection.timestamp)}</Text>
        </View>
      </View>

      {/* Main content */}
      <View style={styles.content}>
        <Text style={styles.label}>{detection.label}</Text>
        <View style={styles.row2}>
          <CategoryTag category={detection.category} small />
        </View>
        <ConfidenceBar value={detection.confidence} />
      </View>

      {/* Copy action */}
      <TouchableOpacity onPress={handleCopy} style={styles.copyBtn} activeOpacity={0.6}>
        <Text style={styles.copyIcon}>📋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    paddingLeft: 12,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    marginBottom: 8,
  },

  left: { alignItems: 'center', gap: 4, width: 40 },
  idx: { fontSize: 10, fontWeight: '700', color: Colors.textMuted },
  tsBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  ts: { fontSize: 12, fontWeight: '700' },

  content: { flex: 1, gap: 6 },
  label: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  row2: { flexDirection: 'row', gap: 6 },

  copyBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: Colors.surfaceElevated,
  },
  copyIcon: { fontSize: 14 },
});
