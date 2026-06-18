import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BarChart, Card, EmptyState, ProLock, Screen, SectionTitle, StatCard } from '@/components';
import { useTheme } from '@/theme/theme';
import { useSettings } from '@/store/settings';
import {
  AdvancedAnalytics,
  AnalyticsSummary,
  computeAdvancedAnalytics,
  computeAnalytics,
} from '@/lib/analytics';
import { countIncidentsByType } from '@/db/queries/incidents';
import { INCIDENT_META } from '@/types/catalog';
import { formatDuration, formatHours } from '@/lib/format';
import type { IncidentType } from '@/types';

export default function Analytics() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { reportsGenerated, isPro } = useSettings();

  const [stats, setStats] = useState<AnalyticsSummary>(() => computeAnalytics(reportsGenerated));
  const [adv, setAdv] = useState<AdvancedAnalytics>(() => computeAdvancedAnalytics());
  const [byType, setByType] = useState<{ type: IncidentType; count: number }[]>([]);

  useFocusEffect(
    useCallback(() => {
      setStats(computeAnalytics(reportsGenerated));
      setAdv(computeAdvancedAnalytics());
      setByType(countIncidentsByType());
    }, [reportsGenerated]),
  );

  const maxCount = byType.reduce((m, r) => Math.max(m, r.count), 0) || 1;
  const goPro = () => router.push('/paywall');

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

  const onTimeTotal = adv.cleanLoads + adv.detainedLoads;
  const onTimePct = onTimeTotal > 0 ? Math.round((adv.cleanLoads / onTimeTotal) * 100) : null;

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

      {/* Free: incidents by type */}
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

      {/* Pro: visual trends */}
      <View style={{ marginTop: 26 }}>
        <SectionTitle
          title="Trends"
          action={isPro ? undefined : { label: 'Pro', onPress: goPro }}
        />
        <ProLock locked={!isPro} onUnlock={goPro}>
          <View style={{ gap: 16 }}>
            <Card style={{ gap: 8 }}>
              <Text style={[t.typography.label, { color: t.colors.textSecondary }]}>LOADS PER WEEK</Text>
              <BarChart data={adv.weekly.map((w) => ({ label: w.label, value: w.loads }))} formatValue={(v) => `${v}`} />
            </Card>

            <Card style={{ gap: 8 }}>
              <Text style={[t.typography.label, { color: t.colors.textSecondary }]}>DETENTION PER WEEK</Text>
              <BarChart
                data={adv.weekly.map((w) => ({ label: w.label, value: Math.round((w.detentionMs / 3600000) * 10) / 10, highlight: w.detentionMs > 0 }))}
                color={t.colors.warning}
                highlightColor={t.colors.danger}
                formatValue={(v) => `${v}h`}
              />
            </Card>

            <Card style={{ gap: 8 }}>
              <Text style={[t.typography.label, { color: t.colors.textSecondary }]}>AVG FACILITY TIME BY STOP</Text>
              <BarChart
                data={[
                  { label: 'Pickup', value: adv.pickupAvgMs ?? 0 },
                  { label: 'Delivery', value: adv.deliveryAvgMs ?? 0 },
                ]}
                formatValue={(v) => formatDuration(v)}
                height={100}
              />
            </Card>

            <Card style={{ gap: 12 }}>
              <View style={styles.onTimeHead}>
                <Text style={[t.typography.label, { color: t.colors.textSecondary }]}>ON-TIME PERFORMANCE</Text>
                {onTimePct != null ? (
                  <Text style={[t.typography.subtitle, { color: onTimePct >= 80 ? t.colors.success : t.colors.warning }]}>
                    {onTimePct}% clean
                  </Text>
                ) : null}
              </View>
              {onTimeTotal > 0 ? (
                <>
                  <View style={styles.splitBar}>
                    <View style={{ flex: adv.cleanLoads || 0.0001, backgroundColor: t.colors.success }} />
                    <View style={{ flex: adv.detainedLoads || 0.0001, backgroundColor: t.colors.danger }} />
                  </View>
                  <View style={styles.legendRow}>
                    <Legend color={t.colors.success} label={`No detention · ${adv.cleanLoads}`} />
                    <Legend color={t.colors.danger} label={`Detained · ${adv.detainedLoads}`} />
                  </View>
                </>
              ) : (
                <Text style={[t.typography.body, { color: t.colors.textSecondary }]}>
                  Complete a load (Departed at a stop) to see on-time performance.
                </Text>
              )}
            </Card>
          </View>
        </ProLock>
      </View>
    </Screen>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  const t = useTheme();
  return (
    <View style={styles.legend}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={[t.typography.caption, { color: t.colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, width: 120 },
  barTrack: { flex: 1, height: 10, borderRadius: 5, overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 5 },
  onTimeHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  splitBar: { flexDirection: 'row', height: 16, borderRadius: 8, overflow: 'hidden' },
  legendRow: { flexDirection: 'row', gap: 18 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
});
