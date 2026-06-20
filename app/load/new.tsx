import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader, Button, Field, FormSection, Screen } from '@/components';
import { useTheme } from '@/theme/theme';
import { createLoad } from '@/db/queries/loads';

export default function NewLoad() {
  const router = useRouter();
  const t = useTheme();
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
          <Text style={[t.typography.body, { color: t.colors.textSecondary }]}>
            Everything's optional — capture what you have now and edit anytime.
          </Text>

          <FormSection title="Load" icon="cube">
            <Field label="Load Number" value={form.loadNumber} onChangeText={set('loadNumber')} placeholder="e.g. 48213" icon="pricetag" autoCapitalize="characters" />
            <Field label="Reference Number" value={form.referenceNumber} onChangeText={set('referenceNumber')} placeholder="PO / BOL / PRO" icon="document-text" autoCapitalize="characters" />
            <Field label="Trailer Number" value={form.trailerNumber} onChangeText={set('trailerNumber')} placeholder="Trailer #" icon="bus" autoCapitalize="characters" />
          </FormSection>

          <FormSection title="Route" icon="navigate">
            <Field label="Pickup Location" value={form.pickupLocation} onChangeText={set('pickupLocation')} placeholder="City, ST or facility" icon="location" autoCapitalize="words" />
            <Field label="Delivery Location" value={form.deliveryLocation} onChangeText={set('deliveryLocation')} placeholder="City, ST or facility" icon="flag" autoCapitalize="words" />
          </FormSection>

          <FormSection title="Parties" icon="people">
            <Field label="Broker Name" value={form.brokerName} onChangeText={set('brokerName')} placeholder="Broker / 3PL" icon="briefcase" autoCapitalize="words" />
            <Field label="Customer Name" value={form.customerName} onChangeText={set('customerName')} placeholder="Shipper / receiver" icon="business" autoCapitalize="words" />
          </FormSection>

          <FormSection title="Driver Override" icon="person">
            <Field label="Driver Name" value={form.driverName} onChangeText={set('driverName')} placeholder="Defaults to your profile" icon="person-circle" autoCapitalize="words" />
            <Field label="Company" value={form.company} onChangeText={set('company')} placeholder="Defaults to your profile" icon="business" autoCapitalize="words" hint="Leave blank to use your Settings profile." />
          </FormSection>

          <FormSection title="Notes" icon="create">
            <Field label="Driver Notes" value={form.driverNotes} onChangeText={set('driverNotes')} placeholder="Anything to remember about this load" multiline />
          </FormSection>
        </View>
      </Screen>
    </View>
  );
}
