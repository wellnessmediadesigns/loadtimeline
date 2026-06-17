import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme';

interface EmptyStateProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  message?: string;
  children?: React.ReactNode;
}

export function EmptyState({ icon, title, message, children }: EmptyStateProps) {
  const t = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={[styles.iconWrap, { backgroundColor: t.colors.cardAlt }]}>
        <Ionicons name={icon} size={34} color={t.colors.textSecondary} />
      </View>
      <Text style={[t.typography.heading, { color: t.colors.text, textAlign: 'center' }]}>{title}</Text>
      {message ? (
        <Text style={[t.typography.body, { color: t.colors.textSecondary, textAlign: 'center' }]}>
          {message}
        </Text>
      ) : null}
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24, gap: 10 },
  iconWrap: { width: 76, height: 76, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  actions: { marginTop: 12, alignSelf: 'stretch' },
});
