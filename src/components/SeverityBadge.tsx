import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/theme';
import { SEVERITY_LABEL } from '@/types/catalog';
import type { Severity } from '@/types';

export function SeverityBadge({ severity }: { severity: Severity }) {
  const t = useTheme();
  const map: Record<Severity, { fg: string; bg: string }> = {
    low: { fg: t.colors.success, bg: t.colors.successSoft },
    medium: { fg: t.colors.warning, bg: t.colors.warningSoft },
    high: { fg: t.colors.danger, bg: t.colors.dangerSoft },
  };
  const c = map[severity];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <View style={[styles.dot, { backgroundColor: c.fg }]} />
      <Text style={[t.typography.caption, { color: c.fg }]}>{SEVERITY_LABEL[severity].toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
