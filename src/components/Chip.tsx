import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
}

export function Chip({ label, selected, onPress, icon }: ChipProps) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? t.colors.accent : t.colors.card,
          borderColor: selected ? t.colors.accent : t.colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {icon ? (
        <Ionicons name={icon} size={14} color={selected ? t.colors.onAccent : t.colors.textSecondary} />
      ) : null}
      <Text
        style={[
          t.typography.label,
          { color: selected ? t.colors.onAccent : t.colors.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
});
