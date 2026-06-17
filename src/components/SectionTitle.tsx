import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/theme';

interface SectionTitleProps {
  title: string;
  action?: { label: string; onPress: () => void };
  style?: object;
}

export function SectionTitle({ title, action, style }: SectionTitleProps) {
  const t = useTheme();
  return (
    <View style={[styles.row, style]}>
      <Text style={[t.typography.overline, { color: t.colors.textSecondary }]}>
        {title.toUpperCase()}
      </Text>
      {action ? (
        <Pressable onPress={action.onPress} hitSlop={8}>
          <Text style={[t.typography.label, { color: t.colors.accent }]}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
});
