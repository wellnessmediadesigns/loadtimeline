import React, { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppHeader, Button, EmptyState, Field, FormSection, Screen } from '@/components';
import { useTheme } from '@/theme/theme';
import { getLoad, updateLoad } from '@/db/queries/loads';

export default function EditLoad() {
  const t = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const existing = id ? getLoad(id) : null;

  const [form, setForm] = useState({
    loadNumber: existing?.loadNumber ?? '',
    brokerName: existing?.brokerName ?? '',
    shipper: existing?.shipper ?? '',
    receiver: existing?.receiver ?? '',
    pickupLocation: existing?.pickupLocation ?? '',
    deliveryLocation: existing?.deliveryLocation ?? '',
    referenceNumber: existing?.referenceNumber ?? '',
    trailerNumber: existing?.trailerNumber ?? '',
    driverNotes: existing?.driverNotes ?? '',
    driverName: existing?.driverName ?? '',
    company: existing?.company ?? '',
  });

  if (!existing) {
    return (
      <View style={{ flex: 1 }}>
        <AppHeader title="Edit Load" closeIcon />
        <Screen>
          <EmptyState icon="cube-outline" title="Load not found" message="This load may have been deleted." />
        </Screen>
      </View>
    );
  }

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));
  const clean = (v: string) => (v.trim() ? v.trim() : null);

  const onSave = () => {
    updateLoad(existing.id, {
      loadNumber: clean(form.loadNumber),
      brokerName: clean(form.brokerName),
      shipper: clean(form.shipper),
      receiver: clean(form.receiver),
      pickupLocation: clean(form.pickupLocation),
      deliveryLocation: clean(form.deliveryLocation),
      referenceNumber: clean(form.referenceNumber),
      trailerNumber: clean(form.trailerNumber),
      driverNotes: clean(form.driverNotes),
      driverName: clean(form.driverName),
      company: clean(form.company),
    });
    router.back();
  };

  return (
    <View style={{ flex: 1 }}>
      <AppHeader title="Edit Load" closeIcon />
      <Screen footer={<Button label="Save Changes" icon="checkmark" size="lg" onPress={onSave} />}>
        <View style={{ gap: 16 }}>
          <FormSection title="Load" icon="cube">
            <Field label="Load Number" value={form.loadNumber} onChangeText={set('loadNumber')} icon="pricetag" autoCapitalize="characters" />
            <Field label="Reference Number" value={form.referenceNumber} onChangeText={set('referenceNumber')} icon="document-text" autoCapitalize="characters" />
            <Field label="Trailer Number" value={form.trailerNumber} onChangeText={set('trailerNumber')} icon="bus" autoCapitalize="characters" />
          </FormSection>

          <FormSection title="Route" icon="navigate">
            <Field label="Pickup Location" value={form.pickupLocation} onChangeText={set('pickupLocation')} icon="location" autoCapitalize="words" />
            <Field label="Delivery Location" value={form.deliveryLocation} onChangeText={set('deliveryLocation')} icon="flag" autoCapitalize="words" />
          </FormSection>

          <FormSection title="Parties" icon="people">
            <Field label="Shipper" value={form.shipper} onChangeText={set('shipper')} placeholder="Pickup company" icon="arrow-up-circle" autoCapitalize="words" />
            <Field label="Receiver" value={form.receiver} onChangeText={set('receiver')} placeholder="Delivery company" icon="arrow-down-circle" autoCapitalize="words" />
            <Field label="Broker Name" value={form.brokerName} onChangeText={set('brokerName')} icon="briefcase" autoCapitalize="words" />
          </FormSection>

          <FormSection title="Driver Override" icon="person">
            <Field label="Driver Name" value={form.driverName} onChangeText={set('driverName')} placeholder="Defaults to your profile" icon="person-circle" autoCapitalize="words" />
            <Field label="Company" value={form.company} onChangeText={set('company')} placeholder="Defaults to your profile" icon="business" autoCapitalize="words" hint="Leave blank to use your Settings profile." />
          </FormSection>

          <FormSection title="Notes" icon="create">
            <Field label="Driver Notes" value={form.driverNotes} onChangeText={set('driverNotes')} multiline />
          </FormSection>
        </View>
      </Screen>
    </View>
  );
}
