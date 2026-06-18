import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/theme';

interface LogoProps {
  /** Size of the square brand mark in px. */
  size?: number;
  /** Render the "Organized Freight" wordmark beside the mark. */
  wordmark?: boolean;
  /** Use light text for the wordmark on dark backgrounds. */
  onDark?: boolean;
}

/** Organized Freight brand colors (traced from the official mark). */
export const OF_CYAN = '#5BC8E8';
export const OF_BLUE = '#4773D6';

/**
 * Organized Freight brand mark — three rows of "stacked freight" blocks that
 * alternate a royal-blue square with a cyan bar, matching OrganizedFreight.com.
 */
export function Logo({ size = 36, wordmark = false, onDark = false }: LogoProps) {
  const t = useTheme();
  // Layout: total = 3u + 2g (square). bar width = 2u + g.
  const u = size / 3.36;
  const g = u * 0.18;
  const r = Math.max(1.5, u * 0.28);
  const bar = 2 * u + g;
  const row = (i: number) => i * (u + g);

  const block = (x: number, y: number, w: number, color: string) => (
    <View
      style={{ position: 'absolute', left: x, top: y, width: w, height: u, borderRadius: r, backgroundColor: color }}
    />
  );

  const mark = (
    <View style={{ width: size, height: size }}>
      {/* Row 1: square | bar */}
      {block(0, row(0), u, OF_BLUE)}
      {block(u + g, row(0), bar, OF_CYAN)}
      {/* Row 2: bar | square */}
      {block(0, row(1), bar, OF_CYAN)}
      {block(2 * u + 2 * g, row(1), u, OF_BLUE)}
      {/* Row 3: square | bar */}
      {block(0, row(2), u, OF_BLUE)}
      {block(u + g, row(2), bar, OF_CYAN)}
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
