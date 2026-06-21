import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  /** Color used when selected (defaults to the accent color). */
  color?: string;
}

export function Chip({ label, selected, onPress, icon, color }: ChipProps) {
  const t = useTheme();
  const selectedColor = color ?? t.colors.accent;
  const handlePress = onPress
    ? () => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }
    : undefined;
  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? selectedColor : t.colors.card,
          borderColor: selected ? selectedColor : t.colors.border,
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
