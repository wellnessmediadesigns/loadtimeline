/**
 * Organized Freight brand palette for LoadTimeline.
 * Exact spec colors drive the light theme; dark variants are derived
 * from the same palette for a consistent logistics-tool feel.
 */

export const brand = {
  navy: '#0F172A',
  slate: '#1E293B',
  accent: '#2563EB',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
} as const;

export interface ThemeColors {
  background: string;
  card: string;
  cardAlt: string;
  text: string;
  textSecondary: string;
  border: string;
  navy: string;
  slate: string;
  accent: string;
  accentSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  onAccent: string;
  onDark: string;
  shadow: string;
  overlay: string;
}

export const lightColors: ThemeColors = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  cardAlt: '#F1F5F9',
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  navy: brand.navy,
  slate: brand.slate,
  accent: brand.accent,
  accentSoft: '#DBEAFE',
  success: brand.success,
  successSoft: '#DCFCE7',
  warning: brand.warning,
  warningSoft: '#FEF3C7',
  danger: brand.danger,
  dangerSoft: '#FEE2E2',
  onAccent: '#FFFFFF',
  onDark: '#F8FAFC',
  shadow: '#0F172A',
  overlay: 'rgba(15, 23, 42, 0.55)',
};

export const darkColors: ThemeColors = {
  background: '#0B1220',
  card: '#111B2E',
  cardAlt: '#1E293B',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  border: '#1F2A3C',
  navy: '#0B1220',
  slate: '#1E293B',
  accent: '#3B82F6',
  accentSoft: '#1E3A8A',
  success: brand.success,
  successSoft: '#14532D',
  warning: brand.warning,
  warningSoft: '#78350F',
  danger: brand.danger,
  dangerSoft: '#7F1D1D',
  onAccent: '#FFFFFF',
  onDark: '#F8FAFC',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.65)',
};
