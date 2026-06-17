import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme';
import { Card } from './Card';
import { SeverityBadge } from './SeverityBadge';
import { INCIDENT_META } from '@/types/catalog';
import { formatDateTime } from '@/lib/format';
import type { Incident, Photo } from '@/types';

interface IncidentRowProps {
  incident: Incident;
  photos?: Photo[];
  onPress?: () => void;
}

export function IncidentRow({ incident, photos = [], onPress }: IncidentRowProps) {
  const t = useTheme();
  const meta = INCIDENT_META[incident.type];

  return (
    <Card onPress={onPress} style={{ gap: 6 }}>
      <View style={styles.head}>
        <View style={styles.titleRow}>
          <View style={[styles.icon, { backgroundColor: t.colors.cardAlt }]}>
            <Ionicons name={meta?.icon ?? 'alert'} size={16} color={t.colors.text} />
          </View>
          <Text style={[t.typography.subtitle, { color: t.colors.text, flex: 1 }]} numberOfLines={1}>
            {incident.title || meta?.label}
          </Text>
        </View>
        <SeverityBadge severity={incident.severity} />
      </View>
      <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>
        {meta?.label} · {formatDateTime(incident.timestamp)}
      </Text>
      {incident.notes ? (
        <Text style={[t.typography.body, { color: t.colors.text }]} numberOfLines={3}>
          {incident.notes}
        </Text>
      ) : null}
      {incident.address ? (
        <Text style={[t.typography.caption, { color: t.colors.textSecondary }]} numberOfLines={1}>
          <Ionicons name="location-outline" size={11} /> {incident.address}
        </Text>
      ) : null}
      {photos.length > 0 ? (
        <View style={styles.thumbs}>
          {photos.map((p) => (
            <Image key={p.id} source={{ uri: p.thumbUri }} style={[styles.thumb, { borderColor: t.colors.border }]} />
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  icon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  thumbs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  thumb: { width: 56, height: 56, borderRadius: 8, borderWidth: 1 },
});
