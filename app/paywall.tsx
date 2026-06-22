import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components';
import { useTheme } from '@/theme/theme';
import { useSettings } from '@/store/settings';
import { FREE_LOAD_LIMIT, PRO_PRICE } from '@/lib/limits';
import { getProPrice, purchasePro, restorePro } from '@/lib/purchases';

// Fixed on-dark palette — the paywall is always a dark, branded surface.
const ON_DARK = '#F8FAFC';
const ON_DARK_MUTED = '#94A3B8';
const CYAN = '#5BC8E8';

const PRO_FEATURES = [
  'Unlimited loads — no 25-load cap',
  'Every current feature stays free & unlocked',
  'One-time purchase, no subscription',
  'Your data stays on your device',
  'Supports future premium features',
];

export default function Paywall() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setPro } = useSettings();
  const [busy, setBusy] = useState(false);
  const [price, setPrice] = useState(PRO_PRICE);

  // Show the real StoreKit price when available (real build); else the default.
  useEffect(() => {
    getProPrice().then((p) => {
      if (p) setPrice(p);
    });
  }, []);

  const grant = () => {
    setPro(true);
    Alert.alert('Pro unlocked', 'Thank you! All Pro features are now available.', [
      { text: 'Great', onPress: () => (router.canGoBack() ? router.back() : router.replace('/')) },
    ]);
  };

  const unlock = async () => {
    setBusy(true);
    try {
      const ok = await purchasePro();
      if (ok) grant();
    } catch (e) {
      // Store unavailable (e.g. Expo Go / pre-IAP build). Allow a local unlock
      // only in development so the flow stays testable; never in production.
      if (__DEV__) {
        grant();
      } else {
        Alert.alert('Purchase unavailable', e instanceof Error ? e.message : 'Please try again later.');
      }
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    setBusy(true);
    try {
      const found = await restorePro();
      if (found) {
        grant();
      } else {
        Alert.alert('Restore Purchases', 'No previous purchase was found on this device.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <LinearGradient
      colors={[t.colors.navy, t.colors.slate, t.colors.accent]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.flex, { paddingTop: insets.top + 12 }]}
    >
      <View style={styles.closeRow}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          hitSlop={10}
          style={styles.closeBtn}
        >
          <Ionicons name="close" size={20} color={ON_DARK} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.badge}>
          <Ionicons name="sparkles" size={28} color="#fff" />
        </View>
        <Text style={[t.typography.overline, { color: CYAN }]}>LOADTIMELINE PRO</Text>
        <Text style={[t.typography.hero, { color: '#fff', textAlign: 'center' }]}>
          Document without limits.
        </Text>
        <Text style={[t.typography.body, { color: ON_DARK_MUTED, textAlign: 'center' }]}>
          You've reached the free plan's {FREE_LOAD_LIMIT}-load limit. Upgrade once — no subscription.
        </Text>

        <View style={styles.features}>
          {PRO_FEATURES.map((f) => (
            <View key={f} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color={t.colors.success} />
              <Text style={[t.typography.body, { color: ON_DARK, flex: 1 }]}>{f}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.priceRow}>
          <Text style={[t.typography.hero, { color: '#fff', fontSize: 32 }]}>{price}</Text>
          <Text style={[t.typography.body, { color: ON_DARK_MUTED }]}>one-time</Text>
        </View>
        <Button label="Unlock Pro" icon="lock-open" size="lg" loading={busy} onPress={unlock} />
        <Text onPress={restore} style={[t.typography.label, { color: ON_DARK_MUTED, textAlign: 'center', marginTop: 6 }]}>
          Restore Purchase
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  closeRow: { paddingHorizontal: 20, alignItems: 'flex-end' },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 28 },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  features: {
    alignSelf: 'stretch',
    gap: 14,
    marginTop: 22,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 18,
    padding: 18,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  footer: { paddingHorizontal: 24, gap: 10 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 8, marginBottom: 4 },
});
