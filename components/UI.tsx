import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, getCategoryMeta } from '../constants/Colors';
import { VideoStatus } from '../types';

// ─── StatusBadge ──────────────────────────────────────────────────────────────
interface StatusBadgeProps { status: VideoStatus }
export function StatusBadge({ status }: StatusBadgeProps) {
  const map: Record<VideoStatus, { label: string; color: string; bg: string }> = {
    uploaded:   { label: 'Uploaded',   color: Colors.textSecondary, bg: Colors.borderSubtle },
    processing: { label: 'Processing', color: Colors.processing,    bg: Colors.processingBg },
    processed:  { label: 'Done',       color: Colors.success,       bg: Colors.successBg },
    error:      { label: 'Error',      color: Colors.error,         bg: Colors.errorBg },
  };
  const { label, color, bg } = map[status] ?? map.error;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      {status === 'processing' && (
        <ActivityIndicator size={8} color={color} style={{ marginRight: 4 }} />
      )}
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

// ─── CategoryTag ─────────────────────────────────────────────────────────────
interface CategoryTagProps { category: string; small?: boolean }
export function CategoryTag({ category, small }: CategoryTagProps) {
  const meta = getCategoryMeta(category);
  return (
    <View style={[styles.catTag, { backgroundColor: meta.bg }, small && styles.catTagSmall]}>
      <Text style={[styles.catTagText, { color: meta.color }, small && styles.catTagTextSmall]}>
        {meta.emoji} {category}
      </Text>
    </View>
  );
}

// ─── ConfidenceBar ────────────────────────────────────────────────────────────
interface ConfidenceBarProps { value: number }
export function ConfidenceBar({ value }: ConfidenceBarProps) {
  const pct = Math.round(value * 100);
  const color = pct >= 95 ? Colors.success : pct >= 85 ? Colors.accent : Colors.warning;
  return (
    <View style={styles.confRow}>
      <View style={styles.confTrack}>
        <View style={[styles.confFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[styles.confLabel, { color }]}>{pct}%</Text>
    </View>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
}
export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <View style={styles.empty}>
      {icon && <Text style={styles.emptyIcon}>{icon}</Text>}
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySub}>{subtitle}</Text>}
      {action && (
        <TouchableOpacity style={styles.emptyBtn} onPress={action.onPress}>
          <Text style={styles.emptyBtnText}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── ErrorBanner ─────────────────────────────────────────────────────────────
interface ErrorBannerProps { message: string; onRetry?: () => void }
export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <View style={styles.errBanner}>
      <Text style={styles.errIcon}>⚠️</Text>
      <Text style={styles.errText} numberOfLines={2}>{message}</Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry} style={styles.errRetry}>
          <Text style={styles.errRetryText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── DemoBanner ──────────────────────────────────────────────────────────────
export function DemoBanner() {
  return (
    <View style={styles.demoBanner}>
      <Text style={styles.demoBannerText}>
        🔮 Demo Mode — connect your backend to analyze real footage
      </Text>
    </View>
  );
}

// ─── SectionHeader ───────────────────────────────────────────────────────────
interface SectionHeaderProps { label: string; count?: number; style?: ViewStyle }
export function SectionHeader({ label, count, style }: SectionHeaderProps) {
  return (
    <View style={[styles.secHeader, style]}>
      <Text style={styles.secLabel}>{label}</Text>
      {count !== undefined && (
        <View style={styles.secCount}>
          <Text style={styles.secCountText}>{count}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Pill ─────────────────────────────────────────────────────────────────────
interface PillProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}
export function Pill({ label, active, onPress, style }: PillProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.pill, active && styles.pillActive, style]}
      activeOpacity={0.7}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },

  catTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  catTagSmall: { paddingHorizontal: 8, paddingVertical: 3 },
  catTagText: { fontSize: 12, fontWeight: '600' },
  catTagTextSmall: { fontSize: 11 },

  confRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  confTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  confFill: { height: '100%', borderRadius: 2 },
  confLabel: { fontSize: 12, fontWeight: '700', width: 32, textAlign: 'right' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.accentGlow,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  emptyBtnText: { color: Colors.accent, fontWeight: '700', fontSize: 14 },

  errBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.errorBg,
    borderColor: Colors.error,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  errIcon: { fontSize: 16 },
  errText: { flex: 1, color: Colors.error, fontSize: 13 },
  errRetry: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: Colors.errorBg,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  errRetryText: { color: Colors.error, fontSize: 12, fontWeight: '700' },

  demoBanner: {
    backgroundColor: Colors.accentGlow,
    borderColor: Colors.accentDim,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 10,
  },
  demoBannerText: { color: Colors.accent, fontSize: 12, textAlign: 'center' },

  secHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  secLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  secCount: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 10,
  },
  secCountText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },

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
});
