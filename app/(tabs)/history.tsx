import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card, Chip, EmptyState, LoadCard, Screen, ScreenHeading, SectionTitle } from '@/components';
import { useTheme } from '@/theme/theme';
import { searchLoads } from '@/db/queries/loads';
import type { Load, LoadStatus } from '@/types';

type StatusFilter = 'all' | LoadStatus;

export default function History() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [allLoads, setAllLoads] = useState<Load[]>([]);

  useFocusEffect(
    useCallback(() => {
      setAllLoads(searchLoads({}));
    }, []),
  );

  const results = useMemo(() => {
    return searchLoads({
      search: query.trim() || undefined,
      status: status === 'all' ? undefined : status,
    });
    // re-run when query/status change, and when the underlying set changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, status, allLoads]);

  const counts = useMemo(
    () => ({
      all: allLoads.length,
      active: allLoads.filter((l) => l.status === 'active').length,
      completed: allLoads.filter((l) => l.status === 'completed').length,
    }),
    [allLoads],
  );

  return (
    <Screen contentStyle={{ paddingTop: insets.top + 8 }}>
      <ScreenHeading title="History" subtitle="Searchable archive of every load." icon="time" />

      <View style={[styles.search, { backgroundColor: t.colors.cardAlt, borderColor: t.colors.border }]}>
        <Ionicons name="search" size={18} color={t.colors.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Load #, customer, broker, reference, location"
          placeholderTextColor={t.colors.textSecondary}
          style={[t.typography.body, { color: t.colors.text, flex: 1 }]}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {query ? (
          <Ionicons name="close-circle" size={18} color={t.colors.textSecondary} onPress={() => setQuery('')} />
        ) : null}
      </View>

      <View style={styles.chips}>
        <Chip label={`All ${counts.all}`} selected={status === 'all'} onPress={() => setStatus('all')} />
        <Chip label={`Active ${counts.active}`} selected={status === 'active'} onPress={() => setStatus('active')} />
        <Chip label={`Completed ${counts.completed}`} selected={status === 'completed'} onPress={() => setStatus('completed')} />
      </View>

      <SectionTitle title={`${results.length} ${results.length === 1 ? 'Load' : 'Loads'}`} />
      {results.length === 0 ? (
        <Card>
          <EmptyState
            icon="file-tray-outline"
            title="Nothing found"
            message={query || status !== 'all' ? 'Try a different search or filter.' : 'Your completed and active loads will appear here.'}
          />
        </Card>
      ) : (
        <View style={styles.list}>
          {results.map((load) => (
            <LoadCard key={load.id} load={load} onPress={() => router.push(`/load/${load.id}`)} />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 12,
  },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  list: { gap: 12 },
});
