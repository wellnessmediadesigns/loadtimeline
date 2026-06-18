import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Logo } from '@/components';
import { useTheme } from '@/theme/theme';
import { useSettings } from '@/store/settings';
import { EVENT_CATALOG } from '@/types/catalog';

interface Slide {
  key: string;
  render: () => React.ReactNode;
}

export default function Onboarding() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useSettings();
  const [step, setStep] = useState(0);

  const finish = (createLoad: boolean) => {
    completeOnboarding();
    if (createLoad) router.replace('/load/new');
    else router.replace('/');
  };

  const slides: Slide[] = [
    {
      key: 'welcome',
      render: () => (
        <View style={styles.center}>
          <View style={[styles.logo, { backgroundColor: t.colors.accentSoft }]}>
            <Ionicons name="documents" size={44} color={t.colors.accent} />
          </View>
          <Text style={[t.typography.overline, { color: t.colors.accent }]}>WELCOME TO LOADTIMELINE</Text>
          <Text style={[t.typography.hero, { color: t.colors.text, textAlign: 'center' }]}>
            Document Every Load.
          </Text>
          <Text style={[t.typography.subtitle, { color: t.colors.textSecondary, textAlign: 'center' }]}>
            Track arrivals, detention, delays, incidents, and proof of service.
          </Text>
        </View>
      ),
    },
    {
      key: 'onetap',
      render: () => (
        <View style={styles.center}>
          <Text style={[t.typography.overline, { color: t.colors.accent }]}>ONE TAP DOCUMENTATION</Text>
          <Text style={[t.typography.title, { color: t.colors.text, textAlign: 'center' }]}>
            Log events in seconds.
          </Text>
          <View style={styles.chips}>
            {EVENT_CATALOG.slice(0, 5).map((e) => (
              <View key={e.type} style={[styles.eventChip, { backgroundColor: t.colors.card, borderColor: t.colors.border }]}>
                <Ionicons name={e.icon} size={18} color={t.colors.accent} />
                <Text style={[t.typography.subtitle, { color: t.colors.text }]}>{e.label}</Text>
              </View>
            ))}
          </View>
          <Text style={[t.typography.body, { color: t.colors.textSecondary, textAlign: 'center' }]}>
            Every event is automatically timestamped — with date, time, and GPS location.
          </Text>
        </View>
      ),
    },
    {
      key: 'start',
      render: () => (
        <View style={styles.center}>
          <View style={[styles.logo, { backgroundColor: t.colors.successSoft }]}>
            <Ionicons name="rocket" size={44} color={t.colors.success} />
          </View>
          <Text style={[t.typography.overline, { color: t.colors.accent }]}>START YOUR FIRST LOAD</Text>
          <Text style={[t.typography.title, { color: t.colors.text, textAlign: 'center' }]}>
            You're ready to roll.
          </Text>
          <Text style={[t.typography.body, { color: t.colors.textSecondary, textAlign: 'center' }]}>
            No account required. No subscription wall. No login. Your data stays on your device.
          </Text>
        </View>
      ),
    },
  ];

  const isLast = step === slides.length - 1;

  return (
    <View style={[styles.flex, { backgroundColor: t.colors.background, paddingTop: insets.top + 24 }]}>
      <View style={styles.brandRow}>
        <Logo size={22} wordmark />
        {!isLast ? (
          <Text
            style={[t.typography.label, { color: t.colors.accent }]}
            onPress={() => finish(false)}
          >
            Skip
          </Text>
        ) : null}
      </View>

      <View style={styles.flex}>{slides[step].render()}</View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.dots}>
          {slides.map((s, i) => (
            <View
              key={s.key}
              style={[
                styles.dot,
                {
                  backgroundColor: i === step ? t.colors.accent : t.colors.border,
                  width: i === step ? 22 : 8,
                },
              ]}
            />
          ))}
        </View>
        {isLast ? (
          <Button label="Create Load" icon="add" size="lg" onPress={() => finish(true)} />
        ) : (
          <Button label="Continue" icon="arrow-forward" size="lg" onPress={() => setStep((s) => s + 1)} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 28 },
  logo: { width: 96, height: 96, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  chips: { gap: 10, alignSelf: 'stretch', marginVertical: 8 },
  eventChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  footer: { paddingHorizontal: 24, gap: 18 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { height: 8, borderRadius: 4 },
});
