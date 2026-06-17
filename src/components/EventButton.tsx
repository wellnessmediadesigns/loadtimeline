import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme';
import type { EventMeta } from '@/types/catalog';

interface EventButtonProps {
  meta: EventMeta;
  onPress: () => void;
  recorded?: boolean;
  loading?: boolean;
  disabled?: boolean;
}

/** Large, glove-friendly one-tap action button used on the active load screen. */
export function EventButton({ meta, onPress, recorded, loading, disabled }: EventButtonProps) {
  const t = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: recorded ? t.colors.successSoft : t.colors.card,
          borderColor: recorded ? t.colors.success : t.colors.border,
          borderRadius: t.radius.lg,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          ...t.shadow(1),
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: recorded ? t.colors.success : t.colors.accentSoft },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={recorded ? '#fff' : t.colors.accent} />
        ) : (
          <Ionicons
            name={recorded ? 'checkmark' : meta.icon}
            size={24}
            color={recorded ? '#fff' : t.colors.accent}
          />
        )}
      </View>
      <Text style={[t.typography.subtitle, { color: t.colors.text }]} numberOfLines={1}>
        {meta.label}
      </Text>
      <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>
        {recorded ? 'Recorded' : 'Tap to log'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flex: 1,
    minWidth: 150,
    minHeight: 110,
    borderWidth: 1.5,
    padding: 14,
    justifyContent: 'center',
    gap: 2,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
});
