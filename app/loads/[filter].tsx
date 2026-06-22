import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { AppHeader, Card, EmptyState, LoadCard, Screen } from '@/components';
import { listLoads } from '@/db/queries/loads';
import { listEvents } from '@/db/queries/events';
import { listIncidents } from '@/db/queries/incidents';
import { computeDetention } from '@/lib/detention';
import type { Load } from '@/types';

type Filter = 'active' | 'completed' | 'incidents' | 'detention' | 'hours';

const META: Record<Filter, { title: string; subtitle: string; empty: string; emptyIcon: any }> = {
  active: { title: 'Active Loads', subtitle: 'Loads in progress', empty: 'No active loads right now.', emptyIcon: 'cube-outline' },
  completed: { title: 'Completed Loads', subtitle: 'Finished loads', empty: 'No completed loads yet.', emptyIcon: 'checkmark-done-outline' },
  incidents: { title: 'Loads with Incidents', subtitle: 'Loads that logged an incident', empty: 'No incidents logged on any load.', emptyIcon: 'shield-checkmark-outline' },
  detention: { title: 'Loads with Detention', subtitle: 'Time on site beyond the free window', empty: 'No detention recorded on any load.', emptyIcon: 'hourglass-outline' },
  hours: { title: 'Logged Loads', subtitle: 'Loads with recorded on-site time', empty: 'No on-site time logged yet.', emptyIcon: 'time-outline' },
};

function selectLoads(filter: Filter): Load[] {
  const all = listLoads();
  switch (filter) {
    case 'active':
      return all.filter((l) => l.status === 'active');
    case 'completed':
      return all.filter((l) => l.status === 'completed');
    case 'incidents':
      return all.filter((l) => listIncidents(l.id).length > 0);
    case 'detention':
      return all.filter((l) => computeDetention(listEvents(l.id)).totalPotentialDetentionMs > 0);
    case 'hours':
      return all.filter((l) => {
        const d = computeDetention(listEvents(l.id));
        return d.totalOnSiteMs != null && d.totalOnSiteMs > 0;
      });
    default:
      return all;
  }
}

export default function LoadsList() {
  const router = useRouter();
  const { filter } = useLocalSearchParams<{ filter: string }>();
  const key = (['active', 'completed', 'incidents', 'detention', 'hours'].includes(filter ?? '')
    ? filter
    : 'active') as Filter;
  const meta = META[key];

  const [loads, setLoads] = useState<Load[]>([]);
  useFocusEffect(
    useCallback(() => {
      setLoads(selectLoads(key));
    }, [key]),
  );

  return (
    <View style={{ flex: 1 }}>
      <AppHeader title={meta.title} subtitle={`${loads.length} ${loads.length === 1 ? 'load' : 'loads'}`} />
      <Screen>
        {loads.length === 0 ? (
          <Card>
            <EmptyState icon={meta.emptyIcon} title={meta.title} message={meta.empty} />
          </Card>
        ) : (
          <View style={{ gap: 12 }}>
            {loads.map((load) => (
              <LoadCard key={load.id} load={load} onPress={() => router.push(`/load/${load.id}`)} />
            ))}
          </View>
        )}
      </Screen>
    </View>
  );
}
