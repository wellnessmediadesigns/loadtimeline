import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useTheme } from '@/theme/theme';
import { Logo, OF_CYAN } from './Logo';

interface HeroMetric {
  label: string;
  value: string;
}

interface HeroCardProps {
  onNewLoad: () => void;
  /** Free loads left to show under the CTA; null hides the caption (Pro). */
  freeRemaining: number | null;
  freeLimit: number;
  /** Optional driver name for a personalized greeting. */
  greetingName?: string;
  /** Up to three at-a-glance stats shown on the gradient. */
  metrics?: HeroMetric[];
}

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/** Branded gradient header for the dashboard: greeting, brand, metrics, CTA. */
export function HeroCard({ onNewLoad, freeRemaining, freeLimit, greetingName, metrics }: HeroCardProps) {
  const t = useTheme();
  const name = greetingName?.trim();
  const greeting = `${timeGreeting()}${name ? `, ${name}` : ''} · ${dayjs().format('ddd, MMM D')}`;
  const strip = (metrics ?? []).slice(0, 3);

  return (
    <LinearGradient
      colors={[t.colors.navy, t.colors.slate, t.colors.accent]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { borderRadius: t.radius.lg, ...t.shadow(2) }]}
    >
      <Logo size={24} wordmark onDark />

      <View style={{ gap: 4, marginTop: 16 }}>
        <Text style={[t.typography.overline, styles.greeting]}>{greeting.toUpperCase()}</Text>
        <Text style={[t.typography.hero, styles.title]}>LoadTimeline</Text>
        <Text style={[t.typography.subtitle, { color: OF_CYAN }]}>Documentation Made Simple</Text>
      </View>

      {strip.length ? (
        <View style={[styles.strip, { borderRadius: t.radius.md }]}>
          {strip.map((m, i) => (
            <React.Fragment key={m.label}>
              {i > 0 ? <View style={styles.divider} /> : null}
              <View style={styles.metric}>
                <Text style={[t.typography.heading, styles.metricValue]} numberOfLines={1}>
                  {m.value}
                </Text>
                <Text style={[t.typography.caption, styles.metricLabel]} numberOfLines={1}>
                  {m.label.toUpperCase()}
                </Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      ) : null}

      <Pressable
        onPress={onNewLoad}
        style={({ pressed }) => [
          styles.cta,
          { borderRadius: t.radius.md, ...t.shadow(2), opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <Ionicons name="add-circle" size={22} color={t.colors.accent} />
        <Text style={[t.typography.subtitle, styles.ctaLabel, { color: t.colors.accent }]}>New Load</Text>
        <Ionicons name="chevron-forward" size={18} color={t.colors.accent} />
      </Pressable>

      {freeRemaining != null ? (
        <Text style={[t.typography.caption, styles.caption]}>
          {Math.max(0, freeRemaining)} of {freeLimit} free loads remaining
        </Text>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { padding: 22, overflow: 'hidden' },
  greeting: { color: 'rgba(248, 250, 252, 0.7)' },
  title: { color: '#FFFFFF' },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginTop: 18,
  },
  metric: { flex: 1, alignItems: 'center', gap: 2 },
  metricValue: { color: '#FFFFFF' },
  metricLabel: { color: 'rgba(248, 250, 252, 0.65)' },
  divider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: 'rgba(255, 255, 255, 0.18)' },
  cta: {
    marginTop: 18,
    minHeight: 54,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaLabel: { fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
  caption: { color: 'rgba(248, 250, 252, 0.75)', textAlign: 'center', marginTop: 10 },
});
