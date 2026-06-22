import { getDb } from '../client';
import type { Payment, PaymentStatus } from '@/types';

interface PaymentRow {
  load_id: string;
  rate: number | null;
  amount_paid: number | null;
  paid_hours: number | null;
  paid_rate: number | null;
  status: PaymentStatus;
  note: string | null;
  updated_at: number;
}

function mapRow(r: PaymentRow): Payment {
  return {
    loadId: r.load_id,
    rate: r.rate,
    amountPaid: r.amount_paid,
    paidHours: r.paid_hours,
    paidRate: r.paid_rate,
    status: r.status,
    note: r.note,
    updatedAt: r.updated_at,
  };
}

export function getPayment(loadId: string): Payment | null {
  const row = getDb().getFirstSync<PaymentRow>('SELECT * FROM payments WHERE load_id = ?', [loadId]);
  return row ? mapRow(row) : null;
}

/** All payment records keyed by load id (for list/summary screens). */
export function listPayments(): Record<string, Payment> {
  const rows = getDb().getAllSync<PaymentRow>('SELECT * FROM payments');
  const map: Record<string, Payment> = {};
  for (const r of rows) map[r.load_id] = mapRow(r);
  return map;
}

export interface PaymentInput {
  rate: number | null;
  amountPaid: number | null;
  paidHours: number | null;
  paidRate: number | null;
  status: PaymentStatus;
  note: string | null;
}

export function upsertPayment(loadId: string, input: PaymentInput): void {
  getDb().runSync(
    `INSERT INTO payments (load_id, rate, amount_paid, paid_hours, paid_rate, status, note, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(load_id) DO UPDATE SET
       rate = excluded.rate,
       amount_paid = excluded.amount_paid,
       paid_hours = excluded.paid_hours,
       paid_rate = excluded.paid_rate,
       status = excluded.status,
       note = excluded.note,
       updated_at = excluded.updated_at`,
    [loadId, input.rate, input.amountPaid, input.paidHours, input.paidRate, input.status, input.note, Date.now()],
  );
}
