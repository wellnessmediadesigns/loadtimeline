import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader, Button, Field, Screen } from '@/components';
import { createLoad } from '@/db/queries/loads';

export default function NewLoad() {
  const router = useRouter();
  const [form, setForm] = useState({
    loadNumber: '',
    brokerName: '',
    customerName: '',
    pickupLocation: '',
    deliveryLocation: '',
    referenceNumber: '',
    trailerNumber: '',
    driverNotes: '',
    driverName: '',
    company: '',
  });

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const clean = (v: string) => (v.trim() ? v.trim() : null);

  const onCreate = () => {
    const load = createLoad({
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
    router.replace(`/load/${load.id}`);
  };

  return (
    <View style={{ flex: 1 }}>
      <AppHeader title="Create Load" closeIcon />
      <Screen
        footer={<Button label="Start Load" icon="arrow-forward" size="lg" onPress={onCreate} />}
      >
        <View style={{ gap: 16 }}>
          <Field label="Load Number" value={form.loadNumber} onChangeText={set('loadNumber')} placeholder="e.g. 48213" autoCapitalize="characters" />
          <Field label="Broker Name" value={form.brokerName} onChangeText={set('brokerName')} placeholder="Broker / 3PL" autoCapitalize="words" />
          <Field label="Customer Name" value={form.customerName} onChangeText={set('customerName')} placeholder="Shipper / receiver" autoCapitalize="words" />
          <Field label="Pickup Location" value={form.pickupLocation} onChangeText={set('pickupLocation')} placeholder="City, ST or facility" autoCapitalize="words" />
          <Field label="Delivery Location" value={form.deliveryLocation} onChangeText={set('deliveryLocation')} placeholder="City, ST or facility" autoCapitalize="words" />
          <Field label="Reference Number" value={form.referenceNumber} onChangeText={set('referenceNumber')} placeholder="PO / BOL / PRO" autoCapitalize="characters" />
          <Field label="Trailer Number" value={form.trailerNumber} onChangeText={set('trailerNumber')} placeholder="Trailer #" autoCapitalize="characters" />
          <Field label="Driver Name" value={form.driverName} onChangeText={set('driverName')} placeholder="Override your profile for this load" autoCapitalize="words" />
          <Field label="Company" value={form.company} onChangeText={set('company')} placeholder="Override your profile for this load" autoCapitalize="words" />
          <Field label="Driver Notes" value={form.driverNotes} onChangeText={set('driverNotes')} placeholder="Anything to remember about this load" multiline />
        </View>
      </Screen>
    </View>
  );
}
