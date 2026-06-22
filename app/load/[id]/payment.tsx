import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppHeader, Button, Chip, EmptyState, Field, FormSection, Screen } from '@/components';
import { useTheme } from '@/theme/theme';
import { useSettings } from '@/store/settings';
import { getLoad } from '@/db/queries/loads';
import { listEvents } from '@/db/queries/events';
import { getPayment, upsertPayment } from '@/db/queries/payments';
import { computeDetention } from '@/lib/detention';
import { effectiveRate, formatMoney, STATUS_LABEL } from '@/lib/payments';
import { formatDuration } from '@/lib/format';
import type { PaymentStatus } from '@/types';

const STATUSES: PaymentStatus[] = ['pending', 'partial', 'paid', 'refused'];

function num(s: string): number {
  const n = parseFloat(s.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export default function PaymentScreen() {
  const t = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { detentionRate } = useSettings();

  const load = id ? getLoad(id) : null;
  const existing = id ? getPayment(id) : null;
  const detentionMs = load ? computeDetention(listEvents(load.id)).totalPotentialDetentionMs : 0;
  const detentionHours = detentionMs / 3_600_000;

  const [rateStr, setRateStr] = useState(String(effectiveRate(existing, detentionRate)));
  const [mode, setMode] = useState<'flat' | 'hourly'>(existing?.paidHours != null ? 'hourly' : 'flat');
  const [amountStr, setAmountStr] = useState(existing?.amountPaid != null && existing.paidHours == null ? String(existing.amountPaid) : '');
  const [hoursStr, setHoursStr] = useState(existing?.paidHours != null ? String(existing.paidHours) : '');
  const [paidRateStr, setPaidRateStr] = useState(existing?.paidRate != null ? String(existing.paidRate) : String(detentionRate));
  const [status, setStatus] = useState<PaymentStatus>(existing?.status ?? 'pending');
  const [note, setNote] = useState(existing?.note ?? '');

  if (!load) {
    return (
      <View style={{ flex: 1 }}>
        <AppHeader title="Detention Payment" closeIcon />
        <Screen>
          <EmptyState icon="cash-outline" title="Load not found" message="This load may have been deleted." />
        </Screen>
      </View>
    );
  }

  const rate = num(rateStr);
  const anticipated = rate * detentionHours;
  const received = mode === 'hourly' ? num(hoursStr) * num(paidRateStr) : num(amountStr);

  const statusColor: Record<PaymentStatus, string> = {
    pending: t.colors.textSecondary,
    partial: t.colors.warning,
    paid: t.colors.success,
    refused: t.colors.danger,
  };

  const save = () => {
    const isHourly = mode === 'hourly' && (hoursStr.trim() !== '' || paidRateStr.trim() !== '');
    upsertPayment(load.id, {
      rate: Math.abs(rate - detentionRate) < 0.001 ? null : rate,
      amountPaid: status === 'pending' && received === 0 ? null : received,
      paidHours: isHourly ? num(hoursStr) : null,
      paidRate: isHourly ? num(paidRateStr) : null,
      status,
      note: note.trim() || null,
    });
    router.back();
  };

  return (
    <View style={{ flex: 1 }}>
      <AppHeader title="Detention Payment" subtitle={load.loadNumber ? `Load ${load.loadNumber}` : undefined} closeIcon />
      <Screen footer={<Button label="Save Payment" icon="checkmark" size="lg" onPress={save} />}>
        <View style={{ gap: 16 }}>
          {/* Anticipated band */}
          <View style={[styles.band, { backgroundColor: t.colors.accentSoft, borderColor: `${t.colors.accent}22` }]}>
            <Text style={[t.typography.overline, { color: t.colors.accent }]}>ANTICIPATED DETENTION PAY</Text>
            <Text style={[t.typography.hero, { color: t.colors.text }]}>{formatMoney(anticipated)}</Text>
            <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>
              {formatDuration(detentionMs)} beyond free window · {detentionHours.toFixed(2)}h × {formatMoney(rate)}/hr
            </Text>
          </View>

          <FormSection title="Rate" icon="pricetag">
            <Field label="Detention rate ($/hr)" value={rateStr} onChangeText={setRateStr} keyboardType="numeric" icon="cash" hint="Defaults to your Settings rate; edit it for this load/customer." />
          </FormSection>

          <FormSection title="Payment Received" icon="wallet">
            <View style={styles.chips}>
              <Chip label="Flat amount" selected={mode === 'flat'} onPress={() => setMode('flat')} />
              <Chip label="By the hour" selected={mode === 'hourly'} onPress={() => setMode('hourly')} />
            </View>
            {mode === 'flat' ? (
              <Field label="Amount received ($)" value={amountStr} onChangeText={setAmountStr} keyboardType="numeric" icon="cash" placeholder="e.g. 150" />
            ) : (
              <>
                <Field label="Hours paid" value={hoursStr} onChangeText={setHoursStr} keyboardType="numeric" icon="time" placeholder="e.g. 2" />
                <Field label="Rate paid ($/hr)" value={paidRateStr} onChangeText={setPaidRateStr} keyboardType="numeric" icon="cash" />
                <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>
                  Received: {formatMoney(received)}
                </Text>
              </>
            )}
          </FormSection>

          <FormSection title="Status" icon="flag">
            <View style={styles.chips}>
              {STATUSES.map((s) => (
                <Chip key={s} label={STATUS_LABEL[s]} selected={status === s} color={statusColor[s]} onPress={() => setStatus(s)} />
              ))}
            </View>
            <View style={styles.summaryRow}>
              <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>Anticipated {formatMoney(anticipated)}</Text>
              <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>Received {formatMoney(received)}</Text>
              <Text style={[t.typography.caption, { color: anticipated - received > 0.01 ? t.colors.danger : t.colors.success }]}>
                {anticipated - received > 0.01 ? `Outstanding ${formatMoney(anticipated - received)}` : 'Settled'}
              </Text>
            </View>
          </FormSection>

          <FormSection title="Note" icon="create">
            <Field label="Payment note" value={note} onChangeText={setNote} placeholder="e.g. broker approved 2 hrs only" multiline />
          </FormSection>
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  band: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 4 },
});
