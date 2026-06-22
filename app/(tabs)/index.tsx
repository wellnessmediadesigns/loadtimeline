import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card, DemoBanner, EmptyState, HeroCard, LoadCard, Screen, SectionTitle, StatCard } from '@/components';
import { useTheme } from '@/theme/theme';
import { useSettings } from '@/store/settings';
import { countLoads, listLoads } from '@/db/queries/loads';
import { recentActivity, RecentActivity } from '@/db/queries/events';
import { computeAnalytics } from '@/lib/analytics';
import { EVENT_META } from '@/types/catalog';
import { canCreateLoad, FREE_LOAD_LIMIT } from '@/lib/limits';
import { formatHours, relativeFromNow } from '@/lib/format';
import type { Load } from '@/types';

export default function Dashboard() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isPro, profile, demoMode } = useSettings();

  const [active, setActive] = useState<Load[]>([]);
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [stats, setStats] = useState(() => computeAnalytics());

  useFocusEffect(
    useCallback(() => {
      setActive(listLoads('active'));
      setActivity(recentActivity(6));
      setStats(computeAnalytics());
    }, []),
  );

  const onNewLoad = () => {
    if (canCreateLoad(isPro, countLoads())) router.push('/load/new');
    else router.push('/paywall');
  };

  return (
    <Screen contentStyle={{ paddingTop: insets.top + 8 }}>
      {demoMode ? <DemoBanner /> : null}
      <HeroCard
        onNewLoad={onNewLoad}
        freeRemaining={isPro ? null : FREE_LOAD_LIMIT - countLoads()}
        freeLimit={FREE_LOAD_LIMIT}
        greetingName={profile.driverName}
        metrics={[
          { label: 'Active', value: `${stats.activeLoads}` },
          { label: 'Reports', value: `${stats.reportsGenerated}` },
          { label: 'Logged', value: formatHours(stats.totalHoursLoggedMs / 3600000) },
        ]}
      />

      <View style={{ marginTop: 26 }}>
        <SectionTitle title="Overview" />
        <View style={styles.statGrid}>
          <StatCard label="Active Loads" value={`${stats.activeLoads}`} icon="cube" tone="accent" onPress={() => router.push('/loads/active')} />
          <StatCard label="Completed" value={`${stats.completedLoads}`} icon="checkmark-done" tone="success" onPress={() => router.push('/loads/completed')} />
          <StatCard label="Reports" value={`${stats.reportsGenerated}`} icon="document-text" tone="violet" onPress={() => router.push('/reports')} />
          <StatCard label="Hours Logged" value={formatHours(stats.totalHoursLoggedMs / 3600000)} icon="time" tone="teal" onPress={() => router.push('/loads/hours')} />
          <StatCard label="Incidents" value={`${stats.incidentsRecorded}`} icon="warning" tone={stats.incidentsRecorded > 0 ? 'warning' : 'neutral'} onPress={() => router.push('/loads/incidents')} />
          <StatCard label="Detention" value={formatHours(stats.hoursDetainedMs / 3600000)} icon="hourglass" tone={stats.hoursDetainedMs > 0 ? 'danger' : 'neutral'} onPress={() => router.push('/loads/detention')} />
        </View>
      </View>

      <View style={{ marginTop: 26 }}>
        <SectionTitle title="Active Loads" />
        {active.length === 0 ? (
          <Card>
            <EmptyState
              icon="cube-outline"
              title="No active loads"
              message="Start a new load when you arrive at your pickup or delivery."
            />
          </Card>
        ) : (
          <View style={styles.list}>
            {active.map((load) => (
              <LoadCard key={load.id} load={load} onPress={() => router.push(`/load/${load.id}`)} />
            ))}
          </View>
        )}
      </View>

      {activity.length > 0 ? (
        <View style={{ marginTop: 26 }}>
          <SectionTitle title="Recent Activity" action={{ label: 'History', onPress: () => router.push('/history') }} />
          <Card padded={false}>
            {activity.map((a, idx) => {
              const meta = EVENT_META[a.event.type];
              return (
                <View
                  key={a.event.id}
                  style={[
                    styles.activityRow,
                    idx < activity.length - 1 ? { borderBottomColor: t.colors.border, borderBottomWidth: StyleSheet.hairlineWidth } : null,
                  ]}
                >
                  <View style={[styles.activityIcon, { backgroundColor: t.colors.accentSoft }]}>
                    <Ionicons name={meta?.icon ?? 'ellipse'} size={16} color={t.colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[t.typography.body, { color: t.colors.text }]} numberOfLines={1}>
                      {meta?.label}
                      <Text style={{ color: t.colors.textSecondary }}>
                        {'  ·  '}
                        {a.loadNumber ? `Load ${a.loadNumber}` : a.shipper ?? 'Load'}
                      </Text>
                    </Text>
                    <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>
                      {relativeFromNow(a.event.timestamp)}
                    </Text>
                  </View>
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
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  list: { gap: 12 },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  activityIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
