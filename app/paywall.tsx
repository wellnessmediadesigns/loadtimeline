import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components';
import { useTheme } from '@/theme/theme';
import { useSettings } from '@/store/settings';
import { FREE_LOAD_LIMIT, PRO_PRICE } from '@/lib/limits';

const PRO_FEATURES = [
  'Unlimited loads',
  'Unlimited reports',
  'Advanced analytics',
  'Premium report templates',
  'Full photo galleries in reports',
  'All future premium features',
];

export default function Paywall() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setPro } = useSettings();
  const [busy, setBusy] = useState(false);

  // NOTE: V1 unlock is a local flag. Real StoreKit / expo-in-app-purchases is
  // wired later once an Apple Developer account + EAS build exist.
  const unlock = () => {
    setBusy(true);
    setTimeout(() => {
      setPro(true);
      setBusy(false);
      Alert.alert('Pro unlocked', 'Thank you! All Pro features are now available.', [
        { text: 'Great', onPress: () => (router.canGoBack() ? router.back() : router.replace('/')) },
      ]);
    }, 400);
  };

  const restore = () => {
    Alert.alert('Restore Purchases', 'No previous purchase found on this device.');
  };

  return (
    <View style={[styles.flex, { backgroundColor: t.colors.navy, paddingTop: insets.top + 12 }]}>
      <View style={styles.closeRow}>
        <Ionicons
          name="close"
          size={26}
          color="#94A3B8"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        />
      </View>

      <View style={styles.body}>
        <View style={[styles.badge, { backgroundColor: t.colors.accent }]}>
          <Ionicons name="sparkles" size={28} color="#fff" />
        </View>
        <Text style={[t.typography.overline, { color: '#60A5FA' }]}>LOADTIMELINE PRO</Text>
        <Text style={[t.typography.hero, { color: '#fff', textAlign: 'center' }]}>
          Document without limits.
        </Text>
        <Text style={[t.typography.body, { color: '#94A3B8', textAlign: 'center' }]}>
          You've been using the free plan ({FREE_LOAD_LIMIT} loads). Upgrade once — no subscription.
        </Text>

        <View style={styles.features}>
          {PRO_FEATURES.map((f) => (
            <View key={f} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color={t.colors.success} />
              <Text style={[t.typography.subtitle, { color: '#E2E8F0', flex: 1 }]}>{f}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.priceRow}>
          <Text style={[t.typography.title, { color: '#fff' }]}>{PRO_PRICE}</Text>
          <Text style={[t.typography.body, { color: '#94A3B8' }]}>one-time purchase</Text>
        </View>
        <Button label="Unlock Pro" icon="lock-open" size="lg" loading={busy} onPress={unlock} />
        <Text onPress={restore} style={[t.typography.label, { color: '#94A3B8', textAlign: 'center', marginTop: 4 }]}>
          Restore Purchase
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  closeRow: { paddingHorizontal: 20, alignItems: 'flex-end' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 28 },
  badge: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  features: { alignSelf: 'stretch', gap: 14, marginTop: 18 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  footer: { paddingHorizontal: 24, gap: 10 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 8, marginBottom: 4 },
});
