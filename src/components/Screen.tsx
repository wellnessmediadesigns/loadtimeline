import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/theme';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  contentStyle?: ViewStyle;
  footer?: React.ReactNode;
}

/** Themed page container that respects safe-area insets. */
export function Screen({ children, scroll = true, padded = true, contentStyle, footer }: ScreenProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const pad: ViewStyle = padded ? { padding: t.spacing.lg } : {};

  return (
    <View style={[styles.flex, { backgroundColor: t.colors.background }]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[
            pad,
            { paddingBottom: t.spacing.xxxl + insets.bottom },
            contentStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, pad, contentStyle]}>{children}</View>
      )}
      {footer ? (
        <View
          style={[
            styles.footer,
            {
              backgroundColor: t.colors.card,
              borderTopColor: t.colors.border,
              paddingBottom: insets.bottom + t.spacing.md,
            },
          ]}
        >
          {footer}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  footer: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
});
