import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/theme';

interface LogoProps {
  /** Size of the square brand mark in px. */
  size?: number;
  /** Render the "Organized Freight" wordmark beside the mark. */
  wordmark?: boolean;
  /** Override the mark color (defaults to accent blue). */
  color?: string;
  /** Use light text for the wordmark on dark backgrounds. */
  onDark?: boolean;
}

/**
 * Organized Freight brand mark — a grid of rounded "blocks" in accent blue,
 * matching OrganizedFreight.com. This is a faithful recreation; drop in the
 * official logo asset to replace it for store submission.
 */
export function Logo({ size = 36, wordmark = false, color, onDark = false }: LogoProps) {
  const t = useTheme();
  const accent = color ?? t.colors.accent;
  const gap = Math.round(size * 0.12);
  const cell = (size - gap) / 2;
  const radius = Math.max(2, Math.round(cell * 0.32));

  const square = (opacity: number) => (
    <View style={{ width: cell, height: cell, borderRadius: radius, backgroundColor: accent, opacity }} />
  );

  const mark = (
    <View style={{ width: size, height: size, gap, flexDirection: 'row', flexWrap: 'wrap' }}>
      {square(1)}
      {square(0.55)}
      {square(0.55)}
      {square(1)}
    </View>
  );

  if (!wordmark) return mark;

  const textColor = onDark ? '#FFFFFF' : t.colors.text;
  const subColor = onDark ? '#94A3B8' : t.colors.textSecondary;

  return (
    <View style={styles.row}>
      {mark}
      <View>
        <Text style={[styles.word, { color: textColor }]}>Organized</Text>
        <Text style={[styles.sub, { color: subColor }]}>FREIGHT</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  word: { fontSize: 17, fontWeight: '800', letterSpacing: -0.2, lineHeight: 19 },
  sub: { fontSize: 10, fontWeight: '700', letterSpacing: 3 },
});
