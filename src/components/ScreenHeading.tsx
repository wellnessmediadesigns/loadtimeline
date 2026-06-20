import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme';

interface ScreenHeadingProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
}

/** Consistent page heading for the list/utility tabs (lighter than the Home hero). */
export function ScreenHeading({ title, subtitle, icon }: ScreenHeadingProps) {
  const t = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {icon ? (
          <View style={[styles.badge, { backgroundColor: t.colors.accentSoft }]}>
            <Ionicons name={icon} size={20} color={t.colors.accent} />
          </View>
        ) : null}
        <Text style={[t.typography.display, { color: t.colors.text }]}>{title}</Text>
      </View>
      {subtitle ? (
        <Text style={[t.typography.body, { color: t.colors.textSecondary }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6, marginBottom: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badge: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
