import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import {
  AppHeader,
  Button,
  Card,
  EmptyState,
  EventButton,
  IncidentRow,
  Screen,
  SectionTitle,
  StatCard,
  TimelineItem,
} from '@/components';
import { useTheme } from '@/theme/theme';
import { getLoad, setLoadStatus, deleteLoad } from '@/db/queries/loads';
import { addEvent, listEvents } from '@/db/queries/events';
import { listIncidents } from '@/db/queries/incidents';
import { listPhotos } from '@/db/queries/photos';
import { captureGeo } from '@/lib/gps';
import { purgeLoadPhotos } from '@/lib/photos';
import { computeDetention, detentionLevel, onSiteLevel } from '@/lib/detention';
import { formatDuration, detentionText } from '@/lib/format';
import { eventsForStop, STOP_META, STOP_ORDER } from '@/types/catalog';
import type { EventType, Incident, Load, LoadEvent, Photo, StopType } from '@/types';

export default function ActiveLoad() {
  const t = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [load, setLoad] = useState<Load | null>(null);
  const [events, setEvents] = useState<LoadEvent[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [photosByEvent, setPhotosByEvent] = useState<Record<string, Photo[]>>({});
  const [photosByIncident, setPhotosByIncident] = useState<Record<string, Photo[]>>({});
  const [recording, setRecording] = useState<EventType | null>(null);
  const [stop, setStop] = useState<StopType>('pickup');

  const reload = useCallback(() => {
    if (!id) return;
    setLoad(getLoad(id));
    const evs = listEvents(id);
    setEvents(evs);
    const incs = listIncidents(id);
    setIncidents(incs);
    setPhotosByEvent(Object.fromEntries(evs.map((e) => [e.id, listPhotos('event', e.id)])));
    setPhotosByIncident(Object.fromEntries(incs.map((i) => [i.id, listPhotos('incident', i.id)])));
  }, [id]);

  useFocusEffect(useCallback(() => reload(), [reload]));

  const detention = useMemo(() => computeDetention(events), [events]);
  const stopDet = stop === 'pickup' ? detention.pickup : detention.delivery;
  const recordedTypes = useMemo(
    () => new Set(events.filter((e) => e.stop === stop).map((e) => e.type)),
    [events, stop],
  );

  const record = async (type: EventType) => {
    if (!id || recording) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setRecording(type);
    try {
      const geo = await captureGeo();
      addEvent(id, stop, type, geo);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      reload();
    } finally {
      setRecording(null);
    }
  };

  const openMenu = () => {
    if (!load) return;
    const isActive = load.status === 'active';
    Alert.alert('Load Options', undefined, [
      { text: 'Edit Details', onPress: () => router.push(`/load/${id}/edit`) },
      { text: 'Detention Payment', onPress: () => router.push(`/load/${id}/payment`) },
      {
        text: isActive ? 'Mark as Completed' : 'Reopen Load',
        onPress: () => {
          setLoadStatus(id!, isActive ? 'completed' : 'active');
          reload();
        },
      },
      {
        text: 'Delete Load',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Delete load?', 'This permanently removes the load and all its events.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => {
                purgeLoadPhotos(id!);
                deleteLoad(id!);
                router.replace('/');
              },
            },
          ]),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  if (!load) {
    return (
      <View style={{ flex: 1 }}>
        <AppHeader title="Load" />
        <Screen>
          <EmptyState icon="cube-outline" title="Load not found" message="This load may have been deleted." />
        </Screen>
      </View>
    );
  }

  const subtitle =
    [[load.shipper, load.receiver].filter(Boolean).join(' → ') || null, load.brokerName]
      .filter(Boolean)
      .join(' · ') || undefined;
  const stopLocation = stop === 'pickup' ? load.pickupLocation : load.deliveryLocation;

  return (
    <View style={{ flex: 1 }}>
      <AppHeader
        title={load.loadNumber ? `Load ${load.loadNumber}` : 'Load'}
        subtitle={subtitle}
        right={
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Pressable onPress={() => router.push(`/load/${id}/report`)} hitSlop={8} style={[styles.hBtn, { backgroundColor: t.colors.cardAlt }]}>
              <Ionicons name="document-text" size={20} color={t.colors.accent} />
            </Pressable>
            <Pressable onPress={openMenu} hitSlop={8} style={[styles.hBtn, { backgroundColor: t.colors.cardAlt }]}>
              <Ionicons name="ellipsis-horizontal" size={20} color={t.colors.text} />
            </Pressable>
          </View>
        }
      />
      <Screen>
        {/* Stop selector */}
        <View style={[styles.segment, { backgroundColor: t.colors.cardAlt, borderColor: t.colors.border }]}>
          {STOP_ORDER.map((s) => {
            const meta = STOP_META[s];
            const active = stop === s;
            const sd = s === 'pickup' ? detention.pickup : detention.delivery;
            return (
              <Pressable
                key={s}
                onPress={() => setStop(s)}
                style={[styles.segmentBtn, active ? { backgroundColor: t.colors.card, ...t.shadow(1) } : null]}
              >
                <Ionicons name={meta.icon} size={16} color={active ? t.colors.accent : t.colors.textSecondary} />
                <Text style={[t.typography.subtitle, { color: active ? t.colors.text : t.colors.textSecondary }]}>
                  {meta.label}
                </Text>
                {sd.hasActivity ? (
                  <View style={[styles.dot, { backgroundColor: sd.ongoing ? t.colors.success : t.colors.accent }]} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
        {stopLocation ? (
          <View style={styles.locRow}>
            <Ionicons name="location" size={14} color={t.colors.textSecondary} />
            <Text style={[t.typography.body, { color: t.colors.textSecondary, flex: 1 }]} numberOfLines={1}>
              {stopLocation}
            </Text>
          </View>
        ) : null}

        <SectionTitle title={`Record ${STOP_META[stop].label} Event`} style={{ marginTop: 16 }} />
        <View style={styles.eventGrid}>
          {eventsForStop(stop).map((meta) => (
            <EventButton
              key={meta.type}
              meta={meta}
              recorded={recordedTypes.has(meta.type)}
              loading={recording === meta.type}
              disabled={recording !== null && recording !== meta.type}
              onPress={() => record(meta.type)}
            />
          ))}
        </View>

        {/* Detention for the selected stop */}
        <SectionTitle title={`${STOP_META[stop].label} Detention`} style={{ marginTop: 28 }} />
        <View style={styles.grid}>
          <StatCard label="Time On Site" value={formatDuration(stopDet.onSiteMs)} icon="time" level={onSiteLevel(stopDet.onSiteMs)} hint={stopDet.ongoing ? 'On site now' : undefined} />
          <StatCard label="Wait Time" value={formatDuration(stopDet.waitMs)} icon="hourglass" level={onSiteLevel(stopDet.waitMs)} />
          <StatCard label={STOP_META[stop].serviceLabel} value={formatDuration(stopDet.serviceMs)} icon={stop === 'pickup' ? 'cube' : 'file-tray-full'} />
          <StatCard label="Detention" value={detentionText(stopDet.potentialDetentionMs)} icon="alert-circle" level={detentionLevel(stopDet.potentialDetentionMs)} hint={`after ${stopDet.freeMinutes / 60}h free`} />
        </View>
        {detention.totalOnSiteMs != null ? (
          <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginTop: 10 }]}>
            Combined on site (both stops): {formatDuration(detention.totalOnSiteMs)}
            {detention.totalPotentialDetentionMs && detention.totalPotentialDetentionMs > 0
              ? ` · Detention: ${formatDuration(detention.totalPotentialDetentionMs)}`
              : ' · No detention incurred'}
          </Text>
        ) : null}

        {/* Timeline grouped by stop */}
        <SectionTitle title="Timeline" style={{ marginTop: 28 }} />
        {events.length === 0 ? (
          <Card>
            <EmptyState icon="git-commit-outline" title="No events yet" message="Tap an action above when you arrive, check in, or get to a dock." />
          </Card>
        ) : (
          STOP_ORDER.map((s) => {
            const stopEvents = events.filter((e) => e.stop === s);
            if (stopEvents.length === 0) return null;
            const meta = STOP_META[s];
            return (
              <View key={s} style={{ marginBottom: 12 }}>
                <View style={styles.stopHeader}>
                  <Ionicons name={meta.icon} size={15} color={t.colors.accent} />
                  <Text style={[t.typography.label, { color: t.colors.textSecondary }]}>
                    {meta.label.toUpperCase()}
                  </Text>
                </View>
                <Card style={{ paddingVertical: 18 }}>
                  {stopEvents.map((e, idx) => (
                    <Pressable key={e.id} onPress={() => router.push(`/event/${e.id}`)}>
                      <TimelineItem
                        event={e}
                        photos={photosByEvent[e.id] ?? []}
                        isFirst={idx === 0}
                        isLast={idx === stopEvents.length - 1}
                      />
                    </Pressable>
                  ))}
                </Card>
              </View>
            );
          })
        )}

        {/* Incidents */}
        <SectionTitle title="Incidents" style={{ marginTop: 16 }} action={{ label: '+ Add', onPress: () => router.push(`/load/${id}/incident`) }} />
        {incidents.length === 0 ? (
          <Card>
            <EmptyState icon="shield-checkmark-outline" title="No incidents" message="Document damage, shortages, seal issues, lumper fees, and more." />
          </Card>
        ) : (
          <View style={{ gap: 12 }}>
            {incidents.map((i) => (
              <IncidentRow key={i.id} incident={i} photos={photosByIncident[i.id] ?? []} />
            ))}
          </View>
        )}

        <Button label="Generate Report" icon="document-text" size="lg" onPress={() => router.push(`/load/${id}/report`)} style={{ marginTop: 28 }} />
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  eventGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  hBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  segment: { flexDirection: 'row', borderRadius: 14, padding: 4, borderWidth: 1, gap: 4 },
  segmentBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingHorizontal: 4 },
  stopHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
});
