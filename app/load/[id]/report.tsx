import React, { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Button, Card, Chip, Screen } from '@/components';
import { useTheme } from '@/theme/theme';
import { useSettings } from '@/store/settings';
import { getLoad } from '@/db/queries/loads';
import { listEvents } from '@/db/queries/events';
import { listIncidents } from '@/db/queries/incidents';
import { listPhotosForLoad } from '@/db/queries/photos';
import { printReport, shareReport, DEFAULT_REPORT_FIELDS, ReportFields, ReportStops } from '@/lib/pdf';
import { computeDetention } from '@/lib/detention';
import { formatDuration } from '@/lib/format';

const STOP_OPTIONS: { value: ReportStops; label: string }[] = [
  { value: 'both', label: 'Both' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'delivery', label: 'Delivery' },
];

const FIELD_OPTIONS: { key: keyof ReportFields; label: string }[] = [
  { key: 'broker', label: 'Broker name' },
  { key: 'customer', label: 'Customer name' },
  { key: 'reference', label: 'Reference number' },
  { key: 'trailer', label: 'Trailer number' },
  { key: 'status', label: 'Load status' },
  { key: 'notes', label: 'Driver notes' },
];

export default function ReportScreen() {
  const t = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isPro, incrementReports } = useSettings();

  const load = id ? getLoad(id) : null;
  const events = id ? listEvents(id) : [];
  const incidents = id ? listIncidents(id) : [];
  const photoCount = id ? listPhotosForLoad(id).length : 0;
  const detention = computeDetention(events);

  const [busy, setBusy] = useState<'share' | 'print' | null>(null);
  const [stops, setStops] = useState<ReportStops>('both');
  const [fields, setFields] = useState<ReportFields>({ ...DEFAULT_REPORT_FIELDS });

  if (!load) {
    return (
      <View style={{ flex: 1 }}>
        <AppHeader title="Report" />
        <Screen><Text style={[t.typography.body, { color: t.colors.textSecondary }]}>Load not found.</Text></Screen>
      </View>
    );
  }

  const run = async (mode: 'share' | 'print') => {
    setBusy(mode);
    try {
      const opts = { premium: isPro, stops, fields };
      if (mode === 'share') await shareReport(load.id, opts);
      else await printReport(load.id, opts);
      incrementReports();
    } catch (e) {
      Alert.alert('Could not generate report', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setBusy(null);
    }
  };

  const shownEvents = events.filter((e) => stops === 'both' || e.stop === stops);
  const onSiteMs =
    stops === 'pickup' ? detention.pickup.onSiteMs : stops === 'delivery' ? detention.delivery.onSiteMs : detention.totalOnSiteMs;

  const includes = [
    { icon: 'information-circle', label: 'Load details', ok: true },
    { icon: 'git-commit', label: `Timeline · ${shownEvents.length} events`, ok: shownEvents.length > 0 },
    { icon: 'navigate', label: 'GPS & arrival/departure records', ok: shownEvents.some((e) => e.latitude != null) },
    { icon: 'time', label: `Detention summary · ${formatDuration(onSiteMs)} on site`, ok: onSiteMs != null },
    { icon: 'warning', label: `Incident log · ${incidents.length}`, ok: incidents.length > 0 },
    { icon: 'images', label: `Photos · ${photoCount}${isPro ? ' (full gallery)' : ''}`, ok: photoCount > 0 },
  ] as const;

  return (
    <View style={{ flex: 1 }}>
      <AppHeader title="Generate Report" subtitle={load.loadNumber ? `Load ${load.loadNumber}` : undefined} />
      <Screen
        footer={
          <View style={{ gap: 10 }}>
            <Button label="Share / Email / Save PDF" icon="share-outline" size="lg" loading={busy === 'share'} disabled={busy !== null} onPress={() => run('share')} />
            <Button label="Print" icon="print" variant="secondary" loading={busy === 'print'} disabled={busy !== null} onPress={() => run('print')} />
          </View>
        }
      >
        <Card style={styles.hero}>
          <View style={[styles.badge, { backgroundColor: t.colors.navy }]}>
            <Text style={[t.typography.caption, { color: '#94A3B8' }]}>ORGANIZED FREIGHT</Text>
            <Text style={[t.typography.heading, { color: '#fff' }]}>LoadTimeline Report</Text>
            <Text style={[t.typography.caption, { color: '#60A5FA' }]}>If It Happened, Prove It.</Text>
          </View>
          <Text style={[t.typography.body, { color: t.colors.textSecondary, textAlign: 'center' }]}>
            {isPro ? 'Premium report template' : 'Standard report template'}
          </Text>
        </Card>

        {/* Which stops to include */}
        <Card style={{ marginTop: 16, gap: 10 }}>
          <Text style={[t.typography.label, { color: t.colors.textSecondary }]}>INCLUDE STOPS</Text>
          <View style={styles.chips}>
            {STOP_OPTIONS.map((o) => (
              <Chip key={o.value} label={o.label} selected={stops === o.value} onPress={() => setStops(o.value)} />
            ))}
          </View>
        </Card>

        {/* Which details to show */}
        <Card style={{ marginTop: 16, gap: 4 }}>
          <Text style={[t.typography.label, { color: t.colors.textSecondary, marginBottom: 6 }]}>LOAD DETAILS TO SHOW</Text>
          <View style={[styles.lockedRow, { borderBottomColor: t.colors.border }]}>
            <Ionicons name="lock-closed" size={16} color={t.colors.textSecondary} />
            <Text style={[t.typography.body, { color: t.colors.textSecondary, flex: 1 }]}>
              Load #, Pickup & Delivery — always included
            </Text>
          </View>
          {FIELD_OPTIONS.map((opt, idx) => (
            <View
              key={opt.key}
              style={[
                styles.toggleRow,
                idx < FIELD_OPTIONS.length - 1 ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.colors.border } : null,
              ]}
            >
              <Text style={[t.typography.body, { color: t.colors.text, flex: 1 }]}>{opt.label}</Text>
              <Switch
                value={fields[opt.key]}
                onValueChange={(v) => setFields((prev) => ({ ...prev, [opt.key]: v }))}
                trackColor={{ true: t.colors.accent, false: t.colors.border }}
                thumbColor="#FFFFFF"
              />
            </View>
          ))}
          <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginTop: 8 }]}>
            Turn off any detail you don't want on the shared PDF — e.g. hide the customer or broker.
          </Text>
        </Card>

        <Card style={{ marginTop: 16, gap: 12 }}>
          <Text style={[t.typography.label, { color: t.colors.textSecondary }]}>THIS REPORT INCLUDES</Text>
          {includes.map((row) => (
            <View key={row.label} style={styles.row}>
              <Ionicons
                name={row.ok ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={row.ok ? t.colors.success : t.colors.border}
              />
              <Text style={[t.typography.body, { color: row.ok ? t.colors.text : t.colors.textSecondary, flex: 1 }]}>
                {row.label}
              </Text>
            </View>
          ))}
        </Card>

        {!isPro ? (
          <Card onPress={() => router.push('/paywall')} style={[styles.proCard, { borderColor: t.colors.accent }]}>
            <Ionicons name="sparkles" size={20} color={t.colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={[t.typography.subtitle, { color: t.colors.text }]}>Unlock premium reports</Text>
              <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>
                Full photo gallery & premium template with Pro.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={t.colors.textSecondary} />
          </Card>
        ) : null}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 12, alignItems: 'stretch' },
  badge: { borderRadius: 16, padding: 16, gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chips: { flexDirection: 'row', gap: 8 },
  lockedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  proCard: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5 },
});
