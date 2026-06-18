import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Card, Screen, SectionTitle } from '@/components';
import { useTheme } from '@/theme/theme';
import { FREE_LOAD_LIMIT } from '@/lib/limits';

interface Step {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  body: string;
}

const STEPS: Step[] = [
  { icon: 'add-circle', title: '1 · Create a load', body: 'Tap NEW LOAD and enter as little or as much as you want — every field is optional except nothing; even the load number can wait.' },
  { icon: 'flash', title: '2 · Record events in one tap', body: 'Tap Arrived, Checked In, At Dock, Loaded, Unloaded, or Departed. Each is automatically stamped with the date, time, and GPS location — you never type a timestamp.' },
  { icon: 'swap-horizontal', title: '3 · Switch Pickup ↔ Delivery', body: 'Use the Pickup / Delivery toggle so each stop has its own timeline and detention. Pickup ends in Loaded; delivery ends in Unloaded.' },
  { icon: 'time', title: '4 · Detention is automatic', body: 'Time on site, wait, loading/unloading, and potential detention are calculated for each stop and color-coded green / amber / red.' },
  { icon: 'camera', title: '5 · Add notes & photos', body: 'Tap any event to add notes or photos (proof of seals, damage, BOL). Document incidents from the load screen with a type, severity, and photos.' },
  { icon: 'document-text', title: '6 · Generate a report', body: 'Tap Generate Report, choose which stops and details to include, then share, email, print, or save a professional branded PDF.' },
];

interface QA {
  q: string;
  a: string;
}

const FAQ: QA[] = [
  { q: 'Is my data private?', a: 'Yes. Everything stays on your device. There is no account, no cloud, and no tracking. Photos are compressed and stored locally.' },
  { q: 'Does it work without internet?', a: 'Completely. LoadTimeline is offline-first — record events, capture GPS, and generate reports with no signal at the dock.' },
  { q: 'How is detention calculated?', a: 'Each stop has a 2-hour free window. Time on site beyond that is shown as "potential detention." Times come straight from your tapped events, so they are accurate and defensible.' },
  { q: 'Can I hide the customer on a report?', a: 'Yes. On the report screen, turn off any detail (customer, broker, reference, trailer, status, notes). Load number, pickup, and delivery are always included so the document stays meaningful.' },
  { q: 'What is free vs Pro?', a: `Every feature is free. The free version covers up to ${FREE_LOAD_LIMIT} loads; Pro is a one-time purchase that simply removes that limit so you can document unlimited loads.` },
  { q: 'How do I back up my data?', a: 'Settings → Export Data writes a JSON backup you can save or send to yourself. Import Data restores it on this or another device.' },
  { q: 'I made a mistake on an event — can I fix it?', a: 'Tap the event in the timeline to edit its notes or photos, or delete it. You can also edit load details or delete a load from the load menu (•••).' },
];

export default function Help() {
  const t = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <AppHeader title="Help & How-To" />
      <Screen>
        <Card style={{ gap: 6 }}>
          <Text style={[t.typography.heading, { color: t.colors.text }]}>Document every load.</Text>
          <Text style={[t.typography.body, { color: t.colors.textSecondary }]}>
            LoadTimeline turns what happened on a load into clean, timestamped proof. Here's how to get the most out of it.
          </Text>
        </Card>

        <SectionTitle title="How it works" style={{ marginTop: 24 }} />
        <View style={{ gap: 12 }}>
          {STEPS.map((s) => (
            <Card key={s.title} style={styles.step}>
              <View style={[styles.icon, { backgroundColor: t.colors.accentSoft }]}>
                <Ionicons name={s.icon} size={20} color={t.colors.accent} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[t.typography.subtitle, { color: t.colors.text }]}>{s.title}</Text>
                <Text style={[t.typography.body, { color: t.colors.textSecondary }]}>{s.body}</Text>
              </View>
            </Card>
          ))}
        </View>

        <SectionTitle title="FAQ" style={{ marginTop: 24 }} />
        <View style={{ gap: 12 }}>
          {FAQ.map((item) => (
            <Card key={item.q} style={{ gap: 6 }}>
              <Text style={[t.typography.subtitle, { color: t.colors.text }]}>{item.q}</Text>
              <Text style={[t.typography.body, { color: t.colors.textSecondary }]}>{item.a}</Text>
            </Card>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={[t.typography.caption, { color: t.colors.textSecondary, textAlign: 'center' }]}>
            Still need help? Reach us at OrganizedFreight.com
          </Text>
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  footer: { marginTop: 24, alignItems: 'center' },
});
