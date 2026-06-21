import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme';
import { Card } from './Card';
import { EVENT_META } from '@/types/catalog';
import { formatDayLabel, formatDuration } from '@/lib/format';
import { computeDetention } from '@/lib/detention';
import { listEvents } from '@/db/queries/events';
import { listIncidents } from '@/db/queries/incidents';
import type { Load } from '@/types';

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

export function LoadCard({ load, onPress }: { load: Load; onPress: () => void }) {
  const t = useTheme();
  const events = listEvents(load.id);
  const incidents = listIncidents(load.id);
  const last = events[events.length - 1];
  const detention = computeDetention(events);

  const isActive = load.status === 'active';
  const detained = (detention.totalPotentialDetentionMs ?? 0) > 0;

  // Avatar reflects status + detention so the list flags problem loads at a glance.
  const avatar: { icon: React.ComponentProps<typeof Ionicons>['name']; tone: Tone } = isActive
    ? { icon: 'navigate', tone: 'accent' }
    : detained
      ? { icon: 'hourglass', tone: 'danger' }
      : { icon: 'checkmark-done', tone: 'success' };

  const toneColors: Record<Tone, { fg: string; bg: string }> = {
    neutral: { fg: t.colors.textSecondary, bg: t.colors.cardAlt },
    accent: { fg: t.colors.accent, bg: t.colors.accentSoft },
    success: { fg: t.colors.success, bg: t.colors.successSoft },
    warning: { fg: t.colors.warning, bg: t.colors.warningSoft },
    danger: { fg: t.colors.danger, bg: t.colors.dangerSoft },
  };
  const av = toneColors[avatar.tone];

  const route = [load.shipper, load.receiver].filter(Boolean).join('  →  ');

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={[styles.avatar, { backgroundColor: av.bg }]}>
        <Ionicons name={avatar.icon} size={20} color={av.fg} />
      </View>

      <View style={styles.body}>
        <View style={styles.head}>
          <Text style={[t.typography.subtitle, { color: t.colors.text, flex: 1 }]} numberOfLines={1}>
            {load.loadNumber ? `Load ${load.loadNumber}` : 'Untitled Load'}
          </Text>
          <View style={[styles.statusPill, { backgroundColor: isActive ? t.colors.accentSoft : t.colors.cardAlt }]}>
            <Text style={[t.typography.caption, { color: isActive ? t.colors.accent : t.colors.textSecondary, fontSize: 10 }]}>
              {isActive ? 'ACTIVE' : 'COMPLETED'}
            </Text>
          </View>
        </View>

        {route || load.brokerName ? (
          <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginTop: 2 }]} numberOfLines={1}>
            {route ? <Text style={{ color: t.colors.text }}>{route}</Text> : null}
            {route && load.brokerName ? '   ·   ' : ''}
            {load.brokerName ?? ''}
          </Text>
        ) : null}

        <View style={styles.chips}>
          {last ? (
            <Pill icon="flag" text={EVENT_META[last.type]?.label ?? '—'} tone="neutral" />
          ) : (
            <Pill icon="ellipse-outline" text="No events" tone="neutral" />
          )}
          {detained ? (
            <Pill icon="hourglass" text={`Detention ${formatDuration(detention.totalPotentialDetentionMs)}`} tone="danger" />
          ) : detention.totalOnSiteMs != null ? (
            <Pill icon="time" text={`${formatDuration(detention.totalOnSiteMs)} on site`} tone="neutral" />
          ) : null}
          {incidents.length > 0 ? (
            <Pill icon="warning" text={`${incidents.length}`} tone="warning" />
          ) : null}
          <View style={{ flex: 1 }} />
          <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>
            {formatDayLabel(load.updatedAt)}
          </Text>
        </View>
      </View>
    </Card>
  );
}

function Pill({
  icon,
  text,
  tone,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  text: string;
  tone: Tone;
}) {
  const t = useTheme();
  const map: Record<Tone, { fg: string; bg: string }> = {
    neutral: { fg: t.colors.textSecondary, bg: t.colors.cardAlt },
    accent: { fg: t.colors.accent, bg: t.colors.accentSoft },
    success: { fg: t.colors.success, bg: t.colors.successSoft },
    warning: { fg: t.colors.warning, bg: t.colors.warningSoft },
    danger: { fg: t.colors.danger, bg: t.colors.dangerSoft },
  };
  const c = map[tone];
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]}>
      <Ionicons name={icon} size={12} color={c.fg} />
      <Text style={[t.typography.caption, { color: c.fg, fontSize: 11 }]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  avatar: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusPill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  chips: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
});
