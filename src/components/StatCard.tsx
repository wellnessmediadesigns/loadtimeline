import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme';
import type { DetentionLevel } from '@/lib/detention';

interface StatCardProps {
  label: string;
  value: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  level?: DetentionLevel;
  hint?: string;
}

export function StatCard({ label, value, icon, level = 'normal', hint }: StatCardProps) {
  const t = useTheme();

  const accentByLevel: Record<DetentionLevel, { fg: string; bg: string }> = {
    normal: { fg: t.colors.success, bg: t.colors.successSoft },
    watch: { fg: t.colors.warning, bg: t.colors.warningSoft },
    significant: { fg: t.colors.danger, bg: t.colors.dangerSoft },
  };
  const accent = accentByLevel[level];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: t.colors.card,
          borderRadius: t.radius.lg,
          borderColor: t.colors.border,
          ...t.shadow(1),
        },
      ]}
    >
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: accent.bg }]}>
          <Ionicons name={icon} size={18} color={accent.fg} />
        </View>
      ) : null}
      <Text style={[t.typography.title, { color: t.colors.text }]} numberOfLines={1}>
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
  card: { flex: 1, minWidth: 150, borderWidth: 1, padding: 14, gap: 2 },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
});
