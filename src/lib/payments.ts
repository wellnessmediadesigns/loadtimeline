/**
 * Detention payment math + financial roll-ups. Anticipated detention pay is the
 * effective $/hr rate times the billable detention hours (time on site beyond
 * the free window, already computed by lib/detention).
 */
import dayjs from 'dayjs';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import { listLoads } from '@/db/queries/loads';

dayjs.extend(quarterOfYear);
import { listEvents } from '@/db/queries/events';
import { listPayments } from '@/db/queries/payments';
import { computeDetention } from './detention';
import type { Load, Payment, PaymentStatus } from '@/types';

export type Period = 'all' | 'month' | 'quarter' | 'year';

export const PERIOD_LABEL: Record<Period, string> = {
  all: 'All Time',
  month: 'This Month',
  quarter: 'This Quarter',
  year: 'This Year',
};

export interface LoadPayment {
  load: Load;
  detentionMs: number;
  detentionHours: number;
  rate: number; // effective $/hr used
  anticipated: number;
  received: number;
  outstanding: number;
  status: PaymentStatus;
  payment: Payment | null;
}

export function effectiveRate(payment: Payment | null, defaultRate: number): number {
  return payment?.rate != null ? payment.rate : defaultRate;
}

function periodStart(period: Period): number | null {
  if (period === 'all') return null;
  const unit = period === 'month' ? 'month' : period === 'quarter' ? 'quarter' : 'year';
  return dayjs().startOf(unit as any).valueOf();
}

/** Every load that incurred detention, joined with its payment record. */
export function listDetentionLoads(defaultRate: number, period: Period = 'all'): LoadPayment[] {
  const payments = listPayments();
  const start = periodStart(period);
  const out: LoadPayment[] = [];

  for (const load of listLoads()) {
    if (start != null && load.createdAt < start) continue;
    const detentionMs = computeDetention(listEvents(load.id)).totalPotentialDetentionMs;
    if (detentionMs <= 0) continue;

    const payment = payments[load.id] ?? null;
    const rate = effectiveRate(payment, defaultRate);
    const detentionHours = detentionMs / 3_600_000;
    const anticipated = rate * detentionHours;
    const received = payment?.amountPaid ?? 0;
    const status: PaymentStatus = payment?.status ?? 'pending';
    out.push({
      load,
      detentionMs,
      detentionHours,
      rate,
      anticipated,
      received,
      outstanding: Math.max(0, anticipated - received),
      status,
      payment,
    });
  }
  // Outstanding first, then most recent.
  out.sort((a, b) => b.outstanding - a.outstanding || b.load.createdAt - a.load.createdAt);
  return out;
}

export interface Financials {
  rows: LoadPayment[];
  totalAnticipated: number;
  totalReceived: number;
  totalOutstanding: number;
  collectionRate: number | null; // received / anticipated
  byStatus: Record<PaymentStatus, number>;
  topPaid: LoadPayment[];
}

export function computeFinancials(defaultRate: number, period: Period = 'all'): Financials {
  const rows = listDetentionLoads(defaultRate, period);
  const totalAnticipated = rows.reduce((s, r) => s + r.anticipated, 0);
  const totalReceived = rows.reduce((s, r) => s + r.received, 0);
  const totalOutstanding = rows.reduce((s, r) => s + r.outstanding, 0);
  const byStatus: Record<PaymentStatus, number> = { pending: 0, partial: 0, paid: 0, refused: 0 };
  for (const r of rows) byStatus[r.status] += 1;
  const topPaid = [...rows].filter((r) => r.received > 0).sort((a, b) => b.received - a.received).slice(0, 5);
  return {
    rows,
    totalAnticipated,
    totalReceived,
    totalOutstanding,
    collectionRate: totalAnticipated > 0 ? totalReceived / totalAnticipated : null,
    byStatus,
    topPaid,
  };
}

/** Suggests a status from amounts (the user can still override it). */
export function suggestStatus(anticipated: number, received: number): PaymentStatus {
  if (received <= 0) return 'pending';
  if (received >= anticipated - 0.01) return 'paid';
  return 'partial';
}

export function formatMoney(n: number): string {
  return `$${(Math.round(n * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: 'Pending',
  partial: 'Partial',
  paid: 'Paid',
  refused: 'Refused',
};
