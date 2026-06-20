import React, { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card, Chip, Field, Logo, Screen, ScreenHeading, SectionTitle } from '@/components';
import { useTheme } from '@/theme/theme';
import { useSettings, ThemeMode } from '@/store/settings';
import { exportBackup, importBackup } from '@/lib/backup';
import { setDemoMode as setDbDemoMode } from '@/db/client';
import { seedDemoData, resetDemoData } from '@/lib/demoData';
import { APP_INFO } from '@/lib/limits';

const THEME_OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: 'light', label: 'Light' },
  { mode: 'dark', label: 'Dark' },
  { mode: 'system', label: 'Automatic' },
];

export default function Settings() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { themeMode, setThemeMode, isPro, setPro, profile, setProfile, demoMode, setDemoMode } = useSettings();
  const [busy, setBusy] = useState(false);

  const onToggleDemo = (value: boolean) => {
    setDemoMode(value);
    setDbDemoMode(value);
    if (value) seedDemoData();
    router.replace('/');
  };

  const onResetDemo = () => {
    Alert.alert('Reset sample data?', 'This regenerates the demo loads. Your real data is not affected.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        onPress: () => {
          resetDemoData();
          router.replace('/');
        },
      },
    ]);
  };

  const onExport = async () => {
    setBusy(true);
    try {
      await exportBackup();
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  const onImport = async () => {
    setBusy(true);
    try {
      const res = await importBackup();
      if (res) {
        Alert.alert(
          'Import complete',
          `Added ${res.loads} loads, ${res.events} events, ${res.incidents} incidents, ${res.photos} photos. Existing records were kept.`,
        );
      }
    } catch (e) {
      Alert.alert('Import failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  const togglePro = () => {
    if (isPro) {
      Alert.alert('Reset Pro?', 'This turns off Pro on this device (for testing).', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => setPro(false) },
      ]);
    } else {
      router.push('/paywall');
    }
  };

  return (
    <Screen contentStyle={{ paddingTop: insets.top + 8 }}>
      <ScreenHeading title="Settings" icon="settings" />

      <SectionTitle title="Appearance" />
      <Card style={{ gap: 12 }}>
        <Text style={[t.typography.body, { color: t.colors.textSecondary }]}>Theme</Text>
        <View style={styles.chips}>
          {THEME_OPTIONS.map((opt) => (
            <Chip key={opt.mode} label={opt.label} selected={themeMode === opt.mode} onPress={() => setThemeMode(opt.mode)} />
          ))}
        </View>
        <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>
          Automatic matches your phone&apos;s Light / Dark setting.
        </Text>
      </Card>

      <SectionTitle title="Driver Profile" style={{ marginTop: 24 }} />
      <Card style={{ gap: 14 }}>
        <Field label="Driver Name" value={profile.driverName} onChangeText={(v) => setProfile({ driverName: v })} placeholder="Your name" autoCapitalize="words" />
        <Field label="Company" value={profile.company} onChangeText={(v) => setProfile({ company: v })} placeholder="Carrier / company name" autoCapitalize="words" />
        <Field label="Phone" value={profile.phone} onChangeText={(v) => setProfile({ phone: v })} placeholder="Contact number" keyboardType="numeric" />
        <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>
          Added to your reports for a clear audit trail. A load can override this on its own form.
        </Text>
      </Card>

      <SectionTitle title="Demo Mode" style={{ marginTop: 24 }} />
      <Card style={{ gap: 12 }}>
        <View style={styles.demoRow}>
          <View style={[styles.rowIcon, { backgroundColor: t.colors.warningSoft }]}>
            <Ionicons name="flask" size={18} color={t.colors.warning} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[t.typography.subtitle, { color: t.colors.text }]}>Explore sample loads</Text>
            <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>
              Load 19 example loads to try every feature.
            </Text>
          </View>
          <Switch value={demoMode} onValueChange={onToggleDemo} />
        </View>
        <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>
          Your real data is saved and untouched — turn this off anytime to return to it.
        </Text>
        {demoMode ? (
          <Pressable onPress={onResetDemo} hitSlop={6} style={styles.resetRow}>
            <Ionicons name="refresh" size={16} color={t.colors.accent} />
            <Text style={[t.typography.label, { color: t.colors.accent }]}>Reset sample data</Text>
          </Pressable>
        ) : null}
      </Card>

      <SectionTitle title="LoadTimeline Pro" style={{ marginTop: 24 }} />
      <Card onPress={togglePro} style={[styles.row, isPro ? null : { borderColor: t.colors.accent, borderWidth: 1.5 }]}>
        <Ionicons name={isPro ? 'checkmark-circle' : 'sparkles'} size={22} color={isPro ? t.colors.success : t.colors.accent} />
        <View style={{ flex: 1 }}>
          <Text style={[t.typography.subtitle, { color: t.colors.text }]}>
            {isPro ? 'Pro unlocked' : 'Upgrade to Pro'}
          </Text>
          <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>
            {isPro ? 'Unlimited loads — thanks for your support!' : 'Remove the 25-load limit. One-time purchase.'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={t.colors.textSecondary} />
      </Card>

      <SectionTitle title="Data" style={{ marginTop: 24 }} />
      <Card padded={false}>
        <Row icon="cloud-upload" label="Export Data" hint="Save a JSON backup" onPress={onExport} disabled={busy || demoMode} divider />
        <Row icon="cloud-download" label="Import Data" hint="Restore from a backup file" onPress={onImport} disabled={busy || demoMode} divider />
        <Row icon="shield-checkmark" label="Backup Device Data" hint="Share a full export" onPress={onExport} disabled={busy || demoMode} />
      </Card>
      {demoMode ? (
        <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginTop: 8 }]}>
          Turn off Demo Mode to manage your real data.
        </Text>
      ) : null}

      <SectionTitle title="Privacy" style={{ marginTop: 24 }} />
      <Card style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
        <Ionicons name="lock-closed" size={20} color={t.colors.success} />
        <Text style={[t.typography.body, { color: t.colors.textSecondary, flex: 1 }]}>
          All your data stays on this device. LoadTimeline works fully offline — no account, no cloud, no tracking. Photos are compressed and stored locally.
        </Text>
      </Card>

      <SectionTitle title="About" style={{ marginTop: 24 }} />
      <Card padded={false}>
        <Row icon="help-circle" label="Help & How-To" hint="Guide & FAQ" onPress={() => router.push('/help')} divider />
        <Row icon="globe" label="About Organized Freight" hint={APP_INFO.website} onPress={() => Linking.openURL(`https://${APP_INFO.website}`)} divider />
        <Row icon="information-circle" label="Version" hint={APP_INFO.version} />
      </Card>

      <View style={styles.footer}>
        <Logo size={40} />
        <Text style={[t.typography.subtitle, { color: t.colors.text, marginTop: 4 }]}>{APP_INFO.name}</Text>
        <Text style={[t.typography.caption, { color: t.colors.accent }]}>{APP_INFO.tagline}</Text>
        <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>
          A Product by {APP_INFO.brand}
        </Text>
      </View>
    </Screen>
  );
}

function Row({
  icon,
  label,
  hint,
  onPress,
  disabled,
  divider,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  hint?: string;
  onPress?: () => void;
  disabled?: boolean;
  divider?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.settingRow,
        divider ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.colors.border } : null,
        { opacity: disabled ? 0.5 : pressed && onPress ? 0.7 : 1 },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: t.colors.cardAlt }]}>
        <Ionicons name={icon} size={18} color={t.colors.accent} />
      </View>
      <Text style={[t.typography.body, { color: t.colors.text, flex: 1 }]}>{label}</Text>
      {hint ? <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>{hint}</Text> : null}
      {onPress ? <Ionicons name="chevron-forward" size={18} color={t.colors.textSecondary} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  rowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  demoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  resetRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 2 },
  footer: { alignItems: 'center', marginTop: 32, gap: 2 },
});
