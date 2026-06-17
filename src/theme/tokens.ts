/** Shared design tokens: spacing, radius, typography, shadows. */
import { Platform, TextStyle, ViewStyle } from 'react-native';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16, // spec corner radius
  xl: 20,
  pill: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  display: 30,
  hero: 36,
} as const;

type TextToken = Pick<TextStyle, 'fontSize' | 'fontWeight' | 'letterSpacing' | 'lineHeight'>;

export const typography: Record<string, TextToken> = {
  hero: { fontSize: fontSize.hero, fontWeight: '800', letterSpacing: -0.5, lineHeight: 42 },
  display: { fontSize: fontSize.display, fontWeight: '800', letterSpacing: -0.4, lineHeight: 36 },
  title: { fontSize: fontSize.xxl, fontWeight: '700', letterSpacing: -0.3, lineHeight: 30 },
  heading: { fontSize: fontSize.xl, fontWeight: '700', letterSpacing: -0.2, lineHeight: 26 },
  subtitle: { fontSize: fontSize.lg, fontWeight: '600', lineHeight: 24 },
  body: { fontSize: fontSize.md, fontWeight: '500', lineHeight: 22 },
  label: { fontSize: fontSize.sm, fontWeight: '600', letterSpacing: 0.2, lineHeight: 18 },
  caption: { fontSize: fontSize.xs, fontWeight: '600', letterSpacing: 0.4, lineHeight: 16 },
  overline: { fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 1.1, lineHeight: 16 },
};

/** Subtle, modern elevation — no excessive effects. */
export function shadow(color: string, level: 1 | 2 | 3 = 1): ViewStyle {
  if (Platform.OS === 'android') {
    return { elevation: level * 2 };
  }
  const map: Record<number, ViewStyle> = {
    1: { shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
    2: { shadowOpacity: 0.1, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
    3: { shadowOpacity: 0.16, shadowRadius: 24, shadowOffset: { width: 0, height: 12 } },
  };
  return { shadowColor: color, ...map[level] };
}

/** Minimum 56–64px touch targets for gloves / one-handed dock use. */
export const touch = {
  min: 52,
  action: 64,
} as const;
