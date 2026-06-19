import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme';
import type { DetentionLevel } from '@/lib/detention';

export type StatTone =
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'teal'
  | 'violet'
  | 'indigo'
  | 'neutral';

interface StatCardProps {
  label: string;
  value: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  level?: DetentionLevel;
  /** Distinct icon color, independent of detention `level`. Takes precedence when set. */
  tone?: StatTone;
  hint?: string;
}

export function StatCard({ label, value, icon, level = 'normal', tone, hint }: StatCardProps) {
  const t = useTheme();

  const accentByLevel: Record<DetentionLevel, { fg: string; bg: string }> = {
    normal: { fg: t.colors.success, bg: t.colors.successSoft },
    watch: { fg: t.colors.warning, bg: t.colors.warningSoft },
    significant: { fg: t.colors.danger, bg: t.colors.dangerSoft },
  };
  const accentByTone: Record<StatTone, { fg: string; bg: string }> = {
    accent: { fg: t.colors.accent, bg: t.colors.accentSoft },
    success: { fg: t.colors.success, bg: t.colors.successSoft },
    warning: { fg: t.colors.warning, bg: t.colors.warningSoft },
    danger: { fg: t.colors.danger, bg: t.colors.dangerSoft },
    teal: { fg: t.colors.teal, bg: t.colors.tealSoft },
    violet: { fg: t.colors.violet, bg: t.colors.violetSoft },
    indigo: { fg: t.colors.indigo, bg: t.colors.indigoSoft },
    neutral: { fg: t.colors.textSecondary, bg: t.colors.cardAlt },
  };
  const accent = tone ? accentByTone[tone] : accentByLevel[level];

  // `tone` → tinted card (Home/Analytics); `level` → legacy white card (Load detail).
  const tinted = !!tone;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: tinted ? accent.bg : t.colors.card,
          borderRadius: t.radius.lg,
          borderColor: tinted ? `${accent.fg}22` : t.colors.border,
          ...t.shadow(tinted ? 1 : 2),
        },
      ]}
    >
      {icon ? (
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: tinted ? accent.fg : accent.bg },
          ]}
        >
          <Ionicons name={icon} size={20} color={tinted ? t.colors.onAccent : accent.fg} />
        </View>
      ) : null}
      <Text style={[t.typography.display, { color: t.colors.text }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[t.typography.caption, { color: t.colors.textSecondary }]} numberOfLines={1}>
        {label.toUpperCase()}
      </Text>
      {hint ? (
        <Text style={[t.typography.caption, { color: accent.fg, marginTop: 2 }]} numberOfLines={1}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 150, borderWidth: 1, padding: 16, gap: 2 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
});
