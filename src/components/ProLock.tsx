import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme';

interface ProLockProps {
  locked: boolean;
  onUnlock: () => void;
  message?: string;
  children: React.ReactNode;
}

/** Shows a teaser of Pro-only content with a lock overlay + upgrade CTA. */
export function ProLock({ locked, onUnlock, message, children }: ProLockProps) {
  const t = useTheme();
  if (!locked) return <>{children}</>;

  return (
    <View style={styles.wrap}>
      <View style={styles.preview} pointerEvents="none">
        {children}
      </View>
      <View style={[styles.overlay, { backgroundColor: t.colors.card + 'D9' }]}>
        <View style={[styles.badge, { backgroundColor: t.colors.accentSoft }]}>
          <Ionicons name="lock-closed" size={20} color={t.colors.accent} />
        </View>
        <Text style={[t.typography.subtitle, { color: t.colors.text, textAlign: 'center' }]}>
          {message ?? 'Advanced analytics with Pro'}
        </Text>
        <Pressable
          onPress={onUnlock}
          style={({ pressed }) => [styles.cta, { backgroundColor: t.colors.accent, opacity: pressed ? 0.85 : 1 }]}
        >
          <Ionicons name="sparkles" size={16} color={t.colors.onAccent} />
          <Text style={[t.typography.label, { color: t.colors.onAccent }]}>Unlock Pro</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  preview: { opacity: 0.35 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
  },
  badge: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999 },
});
