import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Button, Card, Screen } from '@/components';
import { useTheme } from '@/theme/theme';
import { useSettings } from '@/store/settings';
import { getLoad } from '@/db/queries/loads';
import { listEvents } from '@/db/queries/events';
import { listIncidents } from '@/db/queries/incidents';
import { listPhotosForLoad } from '@/db/queries/photos';
import { printReport, shareReport } from '@/lib/pdf';
import { computeDetention } from '@/lib/detention';
import { formatDuration } from '@/lib/format';

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
      if (mode === 'share') await shareReport(load.id, { premium: isPro });
      else await printReport(load.id, { premium: isPro });
      incrementReports();
    } catch (e) {
      Alert.alert('Could not generate report', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setBusy(null);
    }
  };

  const includes = [
    { icon: 'information-circle', label: 'Load details', ok: true },
    { icon: 'git-commit', label: `Timeline · ${events.length} events`, ok: events.length > 0 },
    { icon: 'navigate', label: 'GPS & arrival/departure records', ok: events.some((e) => e.latitude != null) },
    { icon: 'time', label: `Detention summary · ${formatDuration(detention.totalOnSiteMs)} on site`, ok: detention.totalOnSiteMs != null },
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
  proCard: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5 },
});
