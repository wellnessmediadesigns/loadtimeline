import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean;
  closeIcon?: boolean;
  right?: React.ReactNode;
}

export function AppHeader({ title, subtitle, back = true, closeIcon, right }: AppHeaderProps) {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: insets.top + 8,
          backgroundColor: t.colors.background,
          borderBottomColor: t.colors.border,
        },
      ]}
    >
      <View style={styles.side}>
        {back ? (
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            hitSlop={10}
            style={[styles.iconBtn, { backgroundColor: t.colors.cardAlt }]}
          >
            <Ionicons name={closeIcon ? 'close' : 'chevron-back'} size={22} color={t.colors.text} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.titleWrap}>
        <Text style={[t.typography.subtitle, { color: t.colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[t.typography.caption, { color: t.colors.textSecondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  side: { minWidth: 40, justifyContent: 'center' },
  right: { alignItems: 'flex-end' },
  iconBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  titleWrap: { flex: 1, alignItems: 'center' },
});
