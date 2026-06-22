import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '@/theme/theme';

/** Horizontally scrollable bottom tab bar so 6 tabs fit and slide. */
export function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: t.colors.card,
          borderTopColor: t.colors.border,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = (options.title ?? route.name) as string;
          const focused = state.index === index;
          const color = focused ? t.colors.accent : t.colors.textSecondary;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <Pressable key={route.key} onPress={onPress} style={styles.item} accessibilityRole="button" accessibilityState={{ selected: focused }}>
              {options.tabBarIcon?.({ focused, color, size: 24 })}
              <Text style={[styles.label, { color }]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { borderTopWidth: StyleSheet.hairlineWidth },
  content: { paddingHorizontal: 6 },
  item: { width: 74, alignItems: 'center', justifyContent: 'center', paddingTop: 8, paddingBottom: 6, gap: 3 },
  label: { fontSize: 11, fontWeight: '600' },
});
