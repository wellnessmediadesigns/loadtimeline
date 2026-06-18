import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppHeader, Button, Field, Screen } from '@/components';
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
    customerName: existing?.customerName ?? '',
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
        <Screen><Text style={[t.typography.body, { color: t.colors.textSecondary }]}>Load not found.</Text></Screen>
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
      customerName: clean(form.customerName),
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
          <Field label="Load Number" value={form.loadNumber} onChangeText={set('loadNumber')} autoCapitalize="characters" />
          <Field label="Broker Name" value={form.brokerName} onChangeText={set('brokerName')} autoCapitalize="words" />
          <Field label="Customer Name" value={form.customerName} onChangeText={set('customerName')} autoCapitalize="words" />
          <Field label="Pickup Location" value={form.pickupLocation} onChangeText={set('pickupLocation')} autoCapitalize="words" />
          <Field label="Delivery Location" value={form.deliveryLocation} onChangeText={set('deliveryLocation')} autoCapitalize="words" />
          <Field label="Reference Number" value={form.referenceNumber} onChangeText={set('referenceNumber')} autoCapitalize="characters" />
          <Field label="Trailer Number" value={form.trailerNumber} onChangeText={set('trailerNumber')} autoCapitalize="characters" />
          <Field label="Driver Name" value={form.driverName} onChangeText={set('driverName')} placeholder="Overrides your profile for this load" autoCapitalize="words" />
          <Field label="Company" value={form.company} onChangeText={set('company')} placeholder="Overrides your profile for this load" autoCapitalize="words" />
          <Field label="Driver Notes" value={form.driverNotes} onChangeText={set('driverNotes')} multiline />
        </View>
      </Screen>
    </View>
  );
}
