import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
}: ButtonProps) {
  const t = useTheme();
  const isDisabled = disabled || loading;

  const bg: Record<Variant, string> = {
    primary: t.colors.accent,
    secondary: t.colors.cardAlt,
    ghost: 'transparent',
    danger: t.colors.danger,
    success: t.colors.success,
  };
  const fg: Record<Variant, string> = {
    primary: t.colors.onAccent,
    secondary: t.colors.text,
    ghost: t.colors.accent,
    danger: '#FFFFFF',
    success: '#FFFFFF',
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg[variant],
          borderRadius: t.radius.lg,
          minHeight: size === 'lg' ? t.touch.action : t.touch.min,
          paddingHorizontal: t.spacing.xl,
          borderWidth: variant === 'ghost' ? 1 : 0,
          borderColor: t.colors.border,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator color={fg[variant]} />
        ) : (
          <>
            {icon ? <Ionicons name={icon} size={size === 'lg' ? 22 : 18} color={fg[variant]} /> : null}
            <Text
              style={[
                t.typography.subtitle,
                { color: fg[variant], fontSize: size === 'lg' ? 18 : 16 },
              ]}
            >
              {label}
            </Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
