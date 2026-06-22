import React, { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Chip, EmptyState, Screen, ScreenHeading, SectionTitle, StatCard } from '@/components';
import { useTheme } from '@/theme/theme';
import { useSettings } from '@/store/settings';
import {
  computeFinancials,
  formatMoney,
  PERIOD_LABEL,
  STATUS_LABEL,
  type Financials,
  type LoadPayment,
  type Period,
} from '@/lib/payments';
import { shareFinancialReport } from '@/lib/financialPdf';
import type { PaymentStatus } from '@/types';

const PERIODS: Period[] = ['all', 'month', 'quarter', 'year'];

export default function Payments() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { detentionRate } = useSettings();

  const [period, setPeriod] = useState<Period>('all');
  const [fin, setFin] = useState<Financials>(() => computeFinancials(detentionRate, 'all'));
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setFin(computeFinancials(detentionRate, period));
    }, [detentionRate, period]),
  );

  const onExport = async () => {
    if (fin.rows.length === 0) return;
    setBusy(true);
    try {
      await shareFinancialReport(detentionRate, period);
    } catch (e) {
      Alert.alert('Could not export', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const statusColor: Record<PaymentStatus, string> = {
    pending: t.colors.textSecondary,
    partial: t.colors.warning,
    paid: t.colors.success,
    refused: t.colors.danger,
  };

  return (
    <Screen contentStyle={{ paddingTop: insets.top + 8 }}>
      <ScreenHeading title="Payment Status" subtitle="Detention you're owed vs. what you've collected." icon="cash" />

      <View style={styles.chips}>
        {PERIODS.map((p) => (
          <Chip key={p} label={PERIOD_LABEL[p]} selected={period === p} onPress={() => setPeriod(p)} />
        ))}
      </View>

      <View style={styles.statGrid}>
        <StatCard label="Anticipated" value={formatMoney(fin.totalAnticipated)} icon="calculator" tone="accent" />
        <StatCard label="Received" value={formatMoney(fin.totalReceived)} icon="checkmark-done" tone="success" />
        <StatCard label="Outstanding" value={formatMoney(fin.totalOutstanding)} icon="alert-circle" tone={fin.totalOutstanding > 0 ? 'danger' : 'neutral'} />
        <StatCard
          label="Collection Rate"
          value={fin.collectionRate != null ? `${Math.round(fin.collectionRate * 100)}%` : '—'}
          icon="trending-up"
          tone="violet"
        />
      </View>

      <Button
        label="Export Financial Summary"
        icon="share-outline"
        variant="secondary"
        onPress={onExport}
        loading={busy}
        disabled={fin.rows.length === 0}
        style={{ marginTop: 14 }}
      />

      <SectionTitle title={`Detention Loads · ${fin.rows.length}`} style={{ marginTop: 24 }} />
      {fin.rows.length === 0 ? (
        <Card>
          <EmptyState
            icon="cash-outline"
            title="No detention to bill"
            message="Loads that go beyond the free window will appear here so you can track what you're owed and what you've been paid."
          />
        </Card>
      ) : (
        <View style={{ gap: 12 }}>
          {fin.rows.map((r) => (
            <PaymentRow key={r.load.id} row={r} statusColor={statusColor[r.status]} onPress={() => router.push(`/load/${r.load.id}/payment`)} />
          ))}
        </View>
      )}
    </Screen>
  );
}

function PaymentRow({ row, statusColor, onPress }: { row: LoadPayment; statusColor: string; onPress: () => void }) {
  const t = useTheme();
  const route = [row.load.shipper, row.load.receiver].filter(Boolean).join(' → ');
  return (
    <Card onPress={onPress} style={styles.row}>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={styles.head}>
          <Text style={[t.typography.subtitle, { color: t.colors.text, flex: 1 }]} numberOfLines={1}>
            {row.load.loadNumber ? `Load ${row.load.loadNumber}` : 'Untitled Load'}
          </Text>
          <View style={[styles.badge, { backgroundColor: `${statusColor}22` }]}>
            <Text style={[t.typography.caption, { color: statusColor, fontSize: 10 }]}>{STATUS_LABEL[row.status].toUpperCase()}</Text>
          </View>
        </View>
        {route ? (
          <Text style={[t.typography.caption, { color: t.colors.textSecondary }]} numberOfLines={1}>{route}</Text>
        ) : null}
        <View style={styles.amounts}>
          <Money label="Anticipated" value={formatMoney(row.anticipated)} color={t.colors.text} t={t} />
          <Money label="Received" value={formatMoney(row.received)} color={row.received > 0 ? t.colors.success : t.colors.textSecondary} t={t} />
          {row.outstanding > 0.01 ? (
            <Money label="Outstanding" value={formatMoney(row.outstanding)} color={t.colors.danger} t={t} />
          ) : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={t.colors.textSecondary} />
    </Card>
  );
}

function Money({ label, value, color, t }: { label: string; value: string; color: string; t: ReturnType<typeof useTheme> }) {
  return (
    <View>
      <Text style={[t.typography.caption, { color: t.colors.textSecondary, fontSize: 10 }]}>{label.toUpperCase()}</Text>
      <Text style={[t.typography.subtitle, { color, fontSize: 15 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  amounts: { flexDirection: 'row', gap: 18, marginTop: 8 },
});
