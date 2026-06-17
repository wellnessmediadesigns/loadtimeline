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
import { computeDetention, detentionLevel, onSiteLevel } from '@/lib/detention';
import { formatDuration } from '@/lib/format';
import { EVENT_CATALOG } from '@/types/catalog';
import type { EventType, Incident, Load, LoadEvent, Photo } from '@/types';

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
  const recordedTypes = useMemo(() => new Set(events.map((e) => e.type)), [events]);

  const record = async (type: EventType) => {
    if (!id || recording) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setRecording(type);
    try {
      const geo = await captureGeo();
      addEvent(id, type, geo);
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
        <Screen><Text style={[t.typography.body, { color: t.colors.textSecondary }]}>Load not found.</Text></Screen>
      </View>
    );
  }

  const subtitle = [load.customerName, load.brokerName].filter(Boolean).join(' · ') || undefined;

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
        {/* Route / status summary */}
        {load.pickupLocation || load.deliveryLocation ? (
          <Card style={{ marginBottom: 18, gap: 10 }}>
            <RouteRow icon="arrow-up-circle" label="Pickup" value={load.pickupLocation} />
            <RouteRow icon="arrow-down-circle" label="Delivery" value={load.deliveryLocation} />
          </Card>
        ) : null}

        <SectionTitle title="Record Event" />
        <View style={styles.grid}>
          {EVENT_CATALOG.map((meta) => (
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

        {/* Detention */}
        <SectionTitle title="Detention" style={{ marginTop: 28 }} />
        <View style={styles.grid}>
          <StatCard label="Time On Site" value={formatDuration(detention.onSiteMs)} icon="time" level={onSiteLevel(detention.onSiteMs)} hint={detention.ongoing ? 'On site now' : undefined} />
          <StatCard label="Wait Time" value={formatDuration(detention.waitMs)} icon="hourglass" level={onSiteLevel(detention.waitMs)} />
          <StatCard label="Loading" value={formatDuration(detention.loadingMs)} icon="cube" />
          <StatCard label="Unloading" value={formatDuration(detention.unloadingMs)} icon="file-tray-full" />
          <StatCard label="Potential Detention" value={formatDuration(detention.potentialDetentionMs)} icon="alert-circle" level={detentionLevel(detention.potentialDetentionMs)} hint={`after ${detention.freeMinutes / 60}h free`} />
        </View>

        {/* Timeline */}
        <SectionTitle title="Timeline" style={{ marginTop: 28 }} />
        {events.length === 0 ? (
          <Card>
            <EmptyState icon="git-commit-outline" title="No events yet" message="Tap an action above when you arrive, check in, or get to a dock." />
          </Card>
        ) : (
          <Card style={{ paddingVertical: 18 }}>
            {events.map((e, idx) => (
              <Pressable key={e.id} onPress={() => router.push(`/event/${e.id}`)}>
                <TimelineItem
                  event={e}
                  photos={photosByEvent[e.id] ?? []}
                  isFirst={idx === 0}
                  isLast={idx === events.length - 1}
                />
              </Pressable>
            ))}
          </Card>
        )}

        {/* Incidents */}
        <SectionTitle title="Incidents" style={{ marginTop: 28 }} action={{ label: '+ Add', onPress: () => router.push(`/load/${id}/incident`) }} />
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

function RouteRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string | null;
}) {
  const t = useTheme();
  if (!value) return null;
  return (
    <View style={styles.routeRow}>
      <Ionicons name={icon} size={20} color={t.colors.accent} />
      <View style={{ flex: 1 }}>
        <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>{label.toUpperCase()}</Text>
        <Text style={[t.typography.body, { color: t.colors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  hBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
