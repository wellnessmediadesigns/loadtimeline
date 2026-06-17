import React from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme';
import type { Photo } from '@/types';

interface PhotoGridProps {
  photos: Photo[];
  onAddCamera: () => void;
  onAddLibrary: () => void;
  onRemove?: (photo: Photo) => void;
  busy?: boolean;
}

export function PhotoGrid({ photos, onAddCamera, onAddLibrary, onRemove, busy }: PhotoGridProps) {
  const t = useTheme();

  const confirmRemove = (photo: Photo) => {
    if (!onRemove) return;
    Alert.alert('Remove photo?', 'This photo will be deleted from the device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => onRemove(photo) },
    ]);
  };

  const addBtn = (icon: React.ComponentProps<typeof Ionicons>['name'], label: string, onPress: () => void) => (
    <Pressable
      onPress={onPress}
      disabled={busy}
      style={({ pressed }) => [
        styles.add,
        {
          borderColor: t.colors.border,
          backgroundColor: t.colors.cardAlt,
          borderRadius: t.radius.md,
          opacity: busy ? 0.5 : pressed ? 0.8 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={22} color={t.colors.accent} />
      <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={styles.grid}>
      {photos.map((p) => (
        <Pressable key={p.id} onLongPress={() => confirmRemove(p)}>
          <Image source={{ uri: p.thumbUri }} style={[styles.thumb, { borderColor: t.colors.border }]} />
          {onRemove ? (
            <View style={[styles.removeBadge, { backgroundColor: t.colors.danger }]}>
              <Ionicons name="close" size={12} color="#fff" />
            </View>
          ) : null}
        </Pressable>
      ))}
      {addBtn('camera', 'Camera', onAddCamera)}
      {addBtn('images', 'Library', onAddLibrary)}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  thumb: { width: 84, height: 84, borderRadius: 12, borderWidth: 1 },
  removeBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  add: {
    width: 84,
    height: 84,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
});
