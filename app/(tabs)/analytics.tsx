import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card, EmptyState, Screen, SectionTitle, StatCard } from '@/components';
import { useTheme } from '@/theme/theme';
import { useSettings } from '@/store/settings';
import { computeAnalytics, AnalyticsSummary } from '@/lib/analytics';
import { countIncidentsByType } from '@/db/queries/incidents';
import { INCIDENT_META } from '@/types/catalog';
import { formatDuration, formatHours } from '@/lib/format';
import type { IncidentType } from '@/types';

export default function Analytics() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { reportsGenerated, isPro } = useSettings();

  const [stats, setStats] = useState<AnalyticsSummary>(() => computeAnalytics(reportsGenerated));
  const [byType, setByType] = useState<{ type: IncidentType; count: number }[]>([]);

  useFocusEffect(
    useCallback(() => {
      setStats(computeAnalytics(reportsGenerated));
      setByType(countIncidentsByType());
    }, [reportsGenerated]),
  );

  const maxCount = byType.reduce((m, r) => Math.max(m, r.count), 0) || 1;

  if (stats.loadsLogged === 0) {
    return (
      <Screen contentStyle={{ paddingTop: insets.top + 8 }}>
        <Text style={[t.typography.display, { color: t.colors.text, marginBottom: 16 }]}>Analytics</Text>
        <Card>
          <EmptyState icon="stats-chart-outline" title="No data yet" message="Log a few loads and your performance insights will appear here." />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen contentStyle={{ paddingTop: insets.top + 8 }}>
      <Text style={[t.typography.display, { color: t.colors.text, marginBottom: 4 }]}>Analytics</Text>
      <Text style={[t.typography.body, { color: t.colors.textSecondary, marginBottom: 16 }]}>
        Your documentation at a glance.
      </Text>

      <View style={styles.grid}>
        <StatCard label="Loads Logged" value={`${stats.loadsLogged}`} icon="cube" />
        <StatCard label="Hours Detained" value={formatHours(stats.hoursDetainedMs / 3600000)} icon="hourglass" level={stats.hoursDetainedMs > 0 ? 'significant' : 'normal'} />
        <StatCard label="Incidents" value={`${stats.incidentsRecorded}`} icon="warning" level={stats.incidentsRecorded > 0 ? 'watch' : 'normal'} />
        <StatCard label="Reports" value={`${stats.reportsGenerated}`} icon="document-text" />
        <StatCard label="Avg Facility Time" value={stats.avgFacilityTimeMs != null ? formatDuration(stats.avgFacilityTimeMs) : '—'} icon="time" />
        <StatCard label="Top Delay" value={stats.mostCommonDelay ?? '—'} icon="alert-circle" />
      </View>

      {!isPro ? (
        <Card style={[styles.proHint, { borderColor: t.colors.border }]}>
          <Ionicons name="sparkles" size={18} color={t.colors.accent} />
          <Text style={[t.typography.caption, { color: t.colors.textSecondary, flex: 1 }]}>
            Advanced analytics and trends are part of LoadTimeline Pro.
          </Text>
        </Card>
      ) : null}

      {byType.length > 0 ? (
        <View style={{ marginTop: 26 }}>
          <SectionTitle title="Incidents by Type" />
          <Card style={{ gap: 14 }}>
            {byType.map((row) => {
              const meta = INCIDENT_META[row.type];
              return (
                <View key={row.type} style={styles.barRow}>
                  <View style={styles.barLabel}>
                    <Ionicons name={meta?.icon ?? 'alert'} size={14} color={t.colors.textSecondary} />
                    <Text style={[t.typography.caption, { color: t.colors.text }]} numberOfLines={1}>
                      {meta?.label}
                    </Text>
                  </View>
                  <View style={[styles.barTrack, { backgroundColor: t.colors.cardAlt }]}>
                    <View style={[styles.barFill, { backgroundColor: t.colors.accent, width: `${(row.count / maxCount) * 100}%` }]} />
                  </View>
                  <Text style={[t.typography.label, { color: t.colors.text, width: 24, textAlign: 'right' }]}>{row.count}</Text>
                </View>
              );
            })}
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  proHint: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, width: 120 },
  barTrack: { flex: 1, height: 10, borderRadius: 5, overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 5 },
});
