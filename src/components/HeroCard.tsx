import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme';
import { Logo, OF_CYAN } from './Logo';

interface HeroCardProps {
  onNewLoad: () => void;
  /** Free loads left to show under the CTA; null hides the caption (Pro). */
  freeRemaining: number | null;
  freeLimit: number;
}

/** Branded gradient header for the dashboard: logo, title, tagline, primary CTA. */
export function HeroCard({ onNewLoad, freeRemaining, freeLimit }: HeroCardProps) {
  const t = useTheme();

  return (
    <LinearGradient
      colors={[t.colors.navy, t.colors.slate, t.colors.accent]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { borderRadius: t.radius.lg, ...t.shadow(2) }]}
    >
      <Logo size={24} wordmark onDark />

      <View style={{ gap: 4, marginTop: 18 }}>
        <Text style={[t.typography.hero, styles.title]}>LoadTimeline</Text>
        <Text style={[t.typography.subtitle, { color: OF_CYAN }]}>If It Happened, Prove It.</Text>
      </View>

      <Pressable
        onPress={onNewLoad}
        style={({ pressed }) => [
          styles.cta,
          { borderRadius: t.radius.md, minHeight: t.touch.action, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <Ionicons name="add-circle" size={22} color={t.colors.accent} />
        <Text style={[t.typography.subtitle, { color: t.colors.accent, fontSize: 18 }]}>NEW LOAD</Text>
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
  title: { color: '#FFFFFF' },
  cta: {
    marginTop: 22,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  caption: { color: 'rgba(248, 250, 252, 0.75)', textAlign: 'center', marginTop: 10 },
});
