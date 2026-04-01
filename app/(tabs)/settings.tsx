import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { checkHealth } from '../../services/api';

const API_BASE = process.env.EXPO_PUBLIC_SCENE_API_BASE_URL ?? '';
const IS_DEMO = process.env.EXPO_PUBLIC_ENABLE_DEMO_FALLBACK !== 'false';
const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '1';

type HealthState = 'idle' | 'checking' | 'ok' | 'error';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [healthState, setHealthState] = useState<HealthState>('idle');
  const [healthMsg, setHealthMsg] = useState('');

  const runHealthCheck = async () => {
    setHealthState('checking');
    setHealthMsg('');
    try {
      const result = await checkHealth();
      if (result.ok && result.databaseConnected) {
        setHealthState('ok');
        setHealthMsg('Backend and database are healthy.');
      } else {
        setHealthState('error');
        setHealthMsg(
          result.databaseConnected
            ? 'Backend is up but database is not connected.'
            : 'Backend responded but something is wrong.',
        );
      }
    } catch (e: any) {
      setHealthState('error');
      setHealthMsg(e?.message ?? 'Could not reach backend.');
    }
  };

  const openPrivacy = () => Linking.openURL('https://luma.hensolutions.com/privacy.html');
  const openSupport = () => Linking.openURL('https://luma.hensolutions.com/support.html');
  const openEmail   = () => Linking.openURL('mailto:support@hensolutions.com');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Backend Config */}
        <SectionLabel label="Backend" />
        <View style={styles.card}>
          <Row
            icon="🌐"
            label="API Endpoint"
            value={API_BASE || 'Not configured'}
            valueColor={API_BASE ? Colors.textSecondary : Colors.error}
          />
          <Divider />
          <Row
            icon="🔮"
            label="Demo Mode"
            value={IS_DEMO && !API_BASE ? 'Active' : 'Off'}
            valueColor={IS_DEMO && !API_BASE ? Colors.accent : Colors.textMuted}
          />
          <Divider />

          {/* Health Check */}
          <View style={styles.healthRow}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowIcon}>❤️</Text>
              <View>
                <Text style={styles.rowLabel}>Backend Health</Text>
                {healthMsg ? (
                  <Text style={[
                    styles.rowValue,
                    { color: healthState === 'ok' ? Colors.success : Colors.error },
                  ]}>
                    {healthMsg}
                  </Text>
                ) : null}
              </View>
            </View>
            <TouchableOpacity
              style={[styles.checkBtn, healthState === 'checking' && styles.checkBtnDisabled]}
              onPress={runHealthCheck}
              disabled={healthState === 'checking'}
              activeOpacity={0.75}
            >
              {healthState === 'checking'
                ? <ActivityIndicator size="small" color={Colors.accent} />
                : <Text style={styles.checkBtnText}>
                    {healthState === 'ok' ? '✅ OK' : healthState === 'error' ? '🔴 Retry' : 'Check'}
                  </Text>
              }
            </TouchableOpacity>
          </View>
        </View>

        {/* Configuration Info */}
        <SectionLabel label="Environment" />
        <View style={styles.card}>
          <View style={styles.envBox}>
            <Text style={styles.envTitle}>Configure via Expo env variables:</Text>
            <View style={styles.envLine}>
              <Text style={styles.envKey}>EXPO_PUBLIC_SCENE_API_BASE_URL</Text>
            </View>
            <View style={styles.envLine}>
              <Text style={styles.envKey}>EXPO_PUBLIC_ENABLE_DEMO_FALLBACK</Text>
            </View>
            <Text style={styles.envHint}>
              Set these in your EAS build profile or local .env file. For production, disable demo fallback and set the production API URL.
            </Text>
          </View>
        </View>

        {/* Support */}
        <SectionLabel label="Support" />
        <View style={styles.card}>
          <TouchableRow icon="🌐" label="Support Center" onPress={openSupport} />
          <Divider />
          <TouchableRow icon="✉️" label="Email Support" onPress={openEmail} />
          <Divider />
          <TouchableRow icon="🔒" label="Privacy Policy" onPress={openPrivacy} />
        </View>

        {/* About */}
        <SectionLabel label="About" />
        <View style={styles.card}>
          <Row icon="📱" label="App Version" value={`${APP_VERSION} (${BUILD_NUMBER})`} />
          <Divider />
          <Row icon="🏢" label="Company" value="Hen Solutions LLC" />
          <Divider />
          <Row icon="🆔" label="Bundle ID" value="com.hensolutions.luma" />
          <Divider />
          <Row icon="☁️" label="EAS Project" value="udbean125" />
        </View>

        {/* Legal */}
        <View style={styles.legalBox}>
          <Text style={styles.legalText}>
            Luma · Scene Intelligence{'\n'}
            © {new Date().getFullYear()} Hen Solutions LLC{'\n'}
            Your footage is processed securely and never sold or used to train public models.
          </Text>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return <Text style={sectionStyles.label}>{label}</Text>;
}

function Divider() {
  return <View style={sectionStyles.divider} />;
}

function Row({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.rowItem}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowIcon}>{icon}</Text>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text
        style={[styles.rowValue, valueColor ? { color: valueColor } : null]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function TouchableRow({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.rowItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowIcon}>{icon}</Text>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={styles.rowChevron}>›</Text>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },

  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    marginBottom: 8,
    overflow: 'hidden',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  rowIcon: { fontSize: 18, width: 26 },
  rowLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  rowValue: { fontSize: 13, color: Colors.textSecondary, maxWidth: '40%', textAlign: 'right' },
  rowChevron: { fontSize: 20, color: Colors.textMuted },

  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    justifyContent: 'space-between',
  },
  checkBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: Colors.accentGlow,
    borderWidth: 1,
    borderColor: Colors.accent,
    minWidth: 70,
    alignItems: 'center',
  },
  checkBtnDisabled: { opacity: 0.5 },
  checkBtnText: { color: Colors.accent, fontWeight: '700', fontSize: 13 },

  envBox: { padding: 16, gap: 8 },
  envTitle: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600', marginBottom: 4 },
  envLine: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  envKey: { fontSize: 11, color: Colors.accent, fontFamily: 'monospace' },
  envHint: { fontSize: 11, color: Colors.textMuted, lineHeight: 16, marginTop: 4 },

  legalBox: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  legalText: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});

const sectionStyles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 16,
    paddingHorizontal: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginHorizontal: 16,
  },
});
