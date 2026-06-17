import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme';
import { Card } from './Card';
import { EVENT_META } from '@/types/catalog';
import { formatDayLabel, formatDuration } from '@/lib/format';
import { computeDetention, onSiteLevel } from '@/lib/detention';
import { listEvents } from '@/db/queries/events';
import { listIncidents } from '@/db/queries/incidents';
import type { Load } from '@/types';

export function LoadCard({ load, onPress }: { load: Load; onPress: () => void }) {
  const t = useTheme();
  const events = listEvents(load.id);
  const incidents = listIncidents(load.id);
  const last = events[events.length - 1];
  const detention = computeDetention(events);
  const level = onSiteLevel(detention.onSiteMs);

  const levelColor =
    level === 'significant' ? t.colors.danger : level === 'watch' ? t.colors.warning : t.colors.success;

  const isActive = load.status === 'active';

  return (
    <Card onPress={onPress} style={{ gap: 8 }}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Text style={[t.typography.subtitle, { color: t.colors.text }]} numberOfLines={1}>
            {load.loadNumber ? `Load ${load.loadNumber}` : 'Untitled Load'}
          </Text>
          {load.customerName || load.brokerName ? (
            <Text style={[t.typography.caption, { color: t.colors.textSecondary }]} numberOfLines={1}>
              {[load.customerName, load.brokerName].filter(Boolean).join(' · ')}
            </Text>
          ) : null}
        </View>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: isActive ? t.colors.accentSoft : t.colors.cardAlt },
          ]}
        >
          <Text style={[t.typography.caption, { color: isActive ? t.colors.accent : t.colors.textSecondary }]}>
            {isActive ? 'ACTIVE' : 'COMPLETED'}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Meta icon="flag" text={last ? EVENT_META[last.type]?.label ?? '—' : 'No events'} color={t.colors.textSecondary} />
        {detention.onSiteMs != null ? (
          <Meta icon="time" text={formatDuration(detention.onSiteMs)} color={levelColor} />
        ) : null}
        {incidents.length > 0 ? (
          <Meta icon="warning" text={`${incidents.length}`} color={t.colors.danger} />
        ) : null}
        <View style={{ flex: 1 }} />
        <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>
          {formatDayLabel(load.updatedAt)}
        </Text>
      </View>
    </Card>
  );
}

function Meta({
  icon,
  text,
  color,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  text: string;
  color: string;
}) {
  const t = useTheme();
  return (
    <View style={styles.meta}>
      <Ionicons name={icon} size={13} color={color} />
      <Text style={[t.typography.caption, { color: t.colors.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
