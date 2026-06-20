import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { AppHeader, Button, Chip, Field, FormSection, PhotoGrid, Screen } from '@/components';
import { useTheme } from '@/theme/theme';
import { addIncident, deleteIncident, listIncidents, setIncidentGeo, updateIncident } from '@/db/queries/incidents';
import { deletePhoto, listPhotos } from '@/db/queries/photos';
import { capturePhoto, pickPhotos, removePhotoFiles } from '@/lib/photos';
import { captureGeo, EMPTY_GEO } from '@/lib/gps';
import { INCIDENT_CATALOG, SEVERITY_LABEL } from '@/types/catalog';
import type { IncidentType, Photo, Severity } from '@/types';

const SEVERITIES: Severity[] = ['low', 'medium', 'high'];
const SEVERITY_TONE: Record<Severity, 'success' | 'warning' | 'danger'> = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
};

/**
 * Incident editor. Creates a draft incident on open so photos can attach
 * immediately; an untouched draft is discarded when the user cancels.
 */
export default function IncidentScreen() {
  const t = useTheme();
  const router = useRouter();
  const { id: loadId } = useLocalSearchParams<{ id: string }>();

  const incidentIdRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [type, setType] = useState<IncidentType>('DAMAGED_FREIGHT');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [severity, setSeverity] = useState<Severity>('medium');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [busy, setBusy] = useState(false);
  const savedRef = useRef(false);

  useEffect(() => {
    if (!loadId) return;
    const incident = addIncident(loadId, {
      type: 'DAMAGED_FREIGHT',
      title: '',
      severity: 'medium',
      geo: EMPTY_GEO,
    });
    incidentIdRef.current = incident.id;
    setReady(true);
    // Capture GPS in the background and patch the draft.
    captureGeo().then((geo) => {
      if (incidentIdRef.current && (geo.latitude != null || geo.address != null)) {
        setIncidentGeo(incidentIdRef.current, geo);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadId]);

  const refreshPhotos = useCallback(() => {
    if (incidentIdRef.current) setPhotos(listPhotos('incident', incidentIdRef.current));
  }, []);

  useFocusEffect(useCallback(() => refreshPhotos(), [refreshPhotos]));

  const persist = () => {
    if (!incidentIdRef.current) return;
    const finalTitle = title.trim() || INCIDENT_CATALOG.find((i) => i.type === type)?.label || 'Incident';
    updateIncident(incidentIdRef.current, {
      type,
      title: finalTitle,
      notes: notes.trim() || null,
      severity,
    });
  };

  const onSave = () => {
    persist();
    savedRef.current = true;
    router.back();
  };

  const onCancel = () => {
    // Discard the untouched draft.
    if (incidentIdRef.current && !title.trim() && !notes.trim() && photos.length === 0) {
      deleteIncident(incidentIdRef.current);
      incidentIdRef.current = null;
    }
    router.back();
  };

  // Safety: if the screen unmounts without an explicit save/cancel and the
  // draft is empty, clean it up.
  useEffect(() => {
    return () => {
      const iid = incidentIdRef.current;
      if (!savedRef.current && iid) {
        const remaining = listIncidents(loadId!).find((i) => i.id === iid);
        if (remaining && !remaining.title && listPhotos('incident', iid).length === 0) {
          deleteIncident(iid);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCamera = async () => {
    if (!incidentIdRef.current) return;
    setBusy(true);
    try {
      await capturePhoto('incident', incidentIdRef.current);
      refreshPhotos();
    } finally {
      setBusy(false);
    }
  };

  const onLibrary = async () => {
    if (!incidentIdRef.current) return;
    setBusy(true);
    try {
      await pickPhotos('incident', incidentIdRef.current);
      refreshPhotos();
    } finally {
      setBusy(false);
    }
  };

  const onRemovePhoto = (photo: Photo) => {
    deletePhoto(photo.id);
    removePhotoFiles(photo);
    refreshPhotos();
  };

  return (
    <View style={{ flex: 1 }}>
      <AppHeader title="Document Incident" closeIcon back={false} right={<Text onPress={onCancel} style={[t.typography.label, { color: t.colors.accent }]}>Cancel</Text>} />
      <Screen footer={<Button label="Save Incident" icon="checkmark" size="lg" onPress={onSave} disabled={!ready} />}>
        <View style={{ gap: 16 }}>
          <FormSection title="Type" icon="pricetag">
            <View style={styles.chips}>
              {INCIDENT_CATALOG.map((i) => (
                <Chip key={i.type} label={i.label} icon={i.icon} selected={type === i.type} onPress={() => setType(i.type)} />
              ))}
            </View>
          </FormSection>

          <FormSection title="Details" icon="document-text">
            <Field label="Title" value={title} onChangeText={setTitle} placeholder="Short summary" icon="text" />
            <Field label="Notes" value={notes} onChangeText={setNotes} placeholder="What happened? Be specific." multiline />
          </FormSection>

          <FormSection title="Severity" icon="alert-circle">
            <View style={styles.chips}>
              {SEVERITIES.map((s) => (
                <Chip
                  key={s}
                  label={SEVERITY_LABEL[s]}
                  selected={severity === s}
                  color={t.colors[SEVERITY_TONE[s]]}
                  onPress={() => setSeverity(s)}
                />
              ))}
            </View>
          </FormSection>

          <FormSection title="Photos" icon="camera">
            <PhotoGrid photos={photos} onAddCamera={onCamera} onAddLibrary={onLibrary} onRemove={onRemovePhoto} busy={busy} />
          </FormSection>
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
