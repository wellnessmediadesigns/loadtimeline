import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme';
import { Card } from './Card';

interface FormSectionProps {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  children: React.ReactNode;
}

/** Grouped form card: an icon header above a stack of fields/controls. */
export function FormSection({ title, icon, children }: FormSectionProps) {
  const t = useTheme();
  return (
    <Card style={{ gap: 14 }}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: t.colors.accentSoft }]}>
          <Ionicons name={icon} size={15} color={t.colors.accent} />
        </View>
        <Text style={[t.typography.overline, { color: t.colors.textSecondary }]}>
          {title.toUpperCase()}
        </Text>
      </View>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
