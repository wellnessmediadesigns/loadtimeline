import React from 'react';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  elevated?: boolean;
}

export function Card({ children, onPress, style, padded = true, elevated = true }: CardProps) {
  const t = useTheme();
  const base: ViewStyle = {
    backgroundColor: t.colors.card,
    borderRadius: t.radius.lg,
    borderWidth: 1,
    borderColor: t.colors.border,
    padding: padded ? t.spacing.lg : 0,
    ...(elevated ? t.shadow(1) : null),
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [base, { opacity: pressed ? 0.9 : 1 }, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}
