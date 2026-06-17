import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme';
import { EVENT_META } from '@/types/catalog';
import { formatTime, shortCoords } from '@/lib/format';
import type { LoadEvent, Photo } from '@/types';

interface TimelineItemProps {
  event: LoadEvent;
  photos?: Photo[];
  isFirst?: boolean;
  isLast?: boolean;
}

export function TimelineItem({ event, photos = [], isFirst, isLast }: TimelineItemProps) {
  const t = useTheme();
  const meta = EVENT_META[event.type];
  const coords = shortCoords(event.latitude, event.longitude);

  return (
    <View style={styles.row}>
      <View style={styles.timeCol}>
        <Text style={[t.typography.subtitle, { color: t.colors.text }]}>
          {formatTime(event.timestamp)}
        </Text>
      </View>

      <View style={styles.railCol}>
        <View
          style={[
            styles.railLine,
            { backgroundColor: isFirst ? 'transparent' : t.colors.border },
          ]}
        />
        <View style={[styles.dot, { backgroundColor: t.colors.accent, borderColor: t.colors.background }]}>
          <Ionicons name={meta?.icon ?? 'ellipse'} size={12} color="#fff" />
        </View>
        <View
          style={[
            styles.railLine,
            { flex: 1, backgroundColor: isLast ? 'transparent' : t.colors.border },
          ]}
        />
      </View>

      <View style={[styles.bodyCol, { borderBottomColor: t.colors.border }]}>
        <Text style={[t.typography.subtitle, { color: t.colors.text }]}>
          {meta?.label ?? event.type}
        </Text>
        {event.address ? (
          <Text style={[t.typography.body, { color: t.colors.textSecondary }]} numberOfLines={2}>
            {event.address}
          </Text>
        ) : null}
        {coords ? (
          <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>
            <Ionicons name="location-outline" size={11} /> {coords}
          </Text>
        ) : null}
        {event.notes ? (
          <View style={[styles.note, { backgroundColor: t.colors.cardAlt }]}>
            <Text style={[t.typography.body, { color: t.colors.text }]}>{event.notes}</Text>
          </View>
        ) : null}
        {photos.length > 0 ? (
          <View style={styles.thumbs}>
            {photos.map((p) => (
              <Image
                key={p.id}
                source={{ uri: p.thumbUri }}
                style={[styles.thumb, { borderColor: t.colors.border }]}
              />
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', minHeight: 64 },
  timeCol: { width: 74, paddingTop: 2, alignItems: 'flex-end', paddingRight: 8 },
  railCol: { width: 28, alignItems: 'center' },
  railLine: { width: 2, height: 8 },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyCol: { flex: 1, paddingBottom: 18, paddingLeft: 4, gap: 2, borderBottomWidth: StyleSheet.hairlineWidth },
  note: { marginTop: 6, padding: 10, borderRadius: 12 },
  thumbs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  thumb: { width: 64, height: 64, borderRadius: 10, borderWidth: 1 },
});
