import React, { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { AppHeader, Button, Card, Field, PhotoGrid, Screen } from '@/components';
import { useTheme } from '@/theme/theme';
import { deleteEvent, getEvent, updateEventNotes } from '@/db/queries/events';
import { listPhotos, deletePhoto } from '@/db/queries/photos';
import { capturePhoto, pickPhotos, removePhotoFiles } from '@/lib/photos';
import { EVENT_META } from '@/types/catalog';
import { formatDateTime, shortCoords } from '@/lib/format';
import type { LoadEvent, Photo } from '@/types';

export default function EventEditor() {
  const t = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [event, setEvent] = useState<LoadEvent | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => {
    if (!id) return;
    const e = getEvent(id);
    setEvent(e);
    setNotes(e?.notes ?? '');
    setPhotos(listPhotos('event', id));
  }, [id]);

  useFocusEffect(useCallback(() => reload(), [reload]));

  if (!event) {
    return (
      <View style={{ flex: 1 }}>
        <AppHeader title="Event" closeIcon />
        <Screen><Text style={[t.typography.body, { color: t.colors.textSecondary }]}>Event not found.</Text></Screen>
      </View>
    );
  }

  const meta = EVENT_META[event.type];
  const coords = shortCoords(event.latitude, event.longitude);

  const save = () => {
    updateEventNotes(event.id, notes.trim() || null);
    router.back();
  };

  const onCamera = async () => {
    setBusy(true);
    try {
      await capturePhoto('event', event.id);
      reload();
    } finally {
      setBusy(false);
    }
  };

  const onLibrary = async () => {
    setBusy(true);
    try {
      await pickPhotos('event', event.id);
      reload();
    } finally {
      setBusy(false);
    }
  };

  const onRemovePhoto = (photo: Photo) => {
    deletePhoto(photo.id);
    removePhotoFiles(photo);
    reload();
  };

  const onDelete = () => {
    Alert.alert('Delete event?', 'This timeline event will be permanently removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteEvent(event.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <AppHeader title={meta?.label ?? 'Event'} subtitle={formatDateTime(event.timestamp)} closeIcon />
      <Screen footer={<Button label="Save" icon="checkmark" size="lg" onPress={save} />}>
        <View style={{ gap: 16 }}>
          <Card style={{ gap: 4 }}>
            <Text style={[t.typography.label, { color: t.colors.textSecondary }]}>LOCATION</Text>
            <Text style={[t.typography.body, { color: t.colors.text }]}>
              {event.address ?? 'No address captured'}
            </Text>
            {coords ? (
              <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>GPS: {coords}</Text>
            ) : null}
          </Card>

          <Field label="Notes" value={notes} onChangeText={setNotes} placeholder="Add details about this event" multiline />

          <View style={{ gap: 8 }}>
            <Text style={[t.typography.label, { color: t.colors.textSecondary }]}>PHOTOS</Text>
            <PhotoGrid photos={photos} onAddCamera={onCamera} onAddLibrary={onLibrary} onRemove={onRemovePhoto} busy={busy} />
          </View>

          <Button label="Delete Event" icon="trash" variant="ghost" onPress={onDelete} />
        </View>
      </Screen>
    </View>
  );
}
