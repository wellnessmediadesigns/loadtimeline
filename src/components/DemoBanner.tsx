import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme';

/** Shown on the dashboard while Demo Mode is active, so sample data is never
 *  mistaken for the user's real loads. */
export function DemoBanner() {
  const t = useTheme();
  const router = useRouter();
  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: t.colors.warningSoft, borderColor: `${t.colors.warning}55`, borderRadius: t.radius.md },
      ]}
    >
      <Ionicons name="flask" size={18} color={t.colors.warning} />
      <View style={{ flex: 1 }}>
        <Text style={[t.typography.label, { color: t.colors.text }]}>Demo data</Text>
        <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>
          You're exploring sample loads. Your real data is safe.
        </Text>
      </View>
      <Pressable onPress={() => router.push('/settings')} hitSlop={8}>
        <Text style={[t.typography.label, { color: t.colors.accent }]}>Turn off</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 18,
  },
});
