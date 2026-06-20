import { getDb, newId } from '../client';
import type { Load, LoadStatus } from '@/types';

interface LoadRow {
  id: string;
  load_number: string | null;
  broker_name: string | null;
  shipper: string | null;
  receiver: string | null;
  pickup_location: string | null;
  delivery_location: string | null;
  reference_number: string | null;
  trailer_number: string | null;
  driver_notes: string | null;
  driver_name: string | null;
  company: string | null;
  status: LoadStatus;
  created_at: number;
  updated_at: number;
}

function mapRow(r: LoadRow): Load {
  return {
    id: r.id,
    loadNumber: r.load_number,
    brokerName: r.broker_name,
    shipper: r.shipper,
    receiver: r.receiver,
    pickupLocation: r.pickup_location,
    deliveryLocation: r.delivery_location,
    referenceNumber: r.reference_number,
    trailerNumber: r.trailer_number,
    driverNotes: r.driver_notes,
    driverName: r.driver_name,
    company: r.company,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export interface LoadInput {
  loadNumber?: string | null;
  brokerName?: string | null;
  shipper?: string | null;
  receiver?: string | null;
  pickupLocation?: string | null;
  deliveryLocation?: string | null;
  referenceNumber?: string | null;
  trailerNumber?: string | null;
  driverNotes?: string | null;
  driverName?: string | null;
  company?: string | null;
}

export function createLoad(input: LoadInput): Load {
  const db = getDb();
  const now = Date.now();
  const id = newId();
  db.runSync(
    `INSERT INTO loads
      (id, load_number, broker_name, shipper, receiver, pickup_location, delivery_location,
       reference_number, trailer_number, driver_notes, driver_name, company, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
    [
      id,
      input.loadNumber ?? null,
      input.brokerName ?? null,
      input.shipper ?? null,
      input.receiver ?? null,
      input.pickupLocation ?? null,
      input.deliveryLocation ?? null,
      input.referenceNumber ?? null,
      input.trailerNumber ?? null,
      input.driverNotes ?? null,
      input.driverName ?? null,
      input.company ?? null,
      now,
      now,
    ],
  );
  return getLoad(id)!;
}

export function getLoad(id: string): Load | null {
  const row = getDb().getFirstSync<LoadRow>('SELECT * FROM loads WHERE id = ?', [id]);
  return row ? mapRow(row) : null;
}

export function listLoads(status?: LoadStatus): Load[] {
  const db = getDb();
  const rows = status
    ? db.getAllSync<LoadRow>('SELECT * FROM loads WHERE status = ? ORDER BY updated_at DESC', [status])
    : db.getAllSync<LoadRow>('SELECT * FROM loads ORDER BY updated_at DESC');
  return rows.map(mapRow);
}

export function countLoads(): number {
  const row = getDb().getFirstSync<{ c: number }>('SELECT COUNT(*) as c FROM loads');
  return row?.c ?? 0;
}

export function updateLoad(id: string, input: LoadInput): void {
  const db = getDb();
  db.runSync(
    `UPDATE loads SET
      load_number = ?, broker_name = ?, shipper = ?, receiver = ?, pickup_location = ?,
      delivery_location = ?, reference_number = ?, trailer_number = ?, driver_notes = ?,
      driver_name = ?, company = ?, updated_at = ?
     WHERE id = ?`,
    [
      input.loadNumber ?? null,
      input.brokerName ?? null,
      input.shipper ?? null,
      input.receiver ?? null,
      input.pickupLocation ?? null,
      input.deliveryLocation ?? null,
      input.referenceNumber ?? null,
      input.trailerNumber ?? null,
      input.driverNotes ?? null,
      input.driverName ?? null,
      input.company ?? null,
      Date.now(),
      id,
    ],
  );
}

export function setLoadStatus(id: string, status: LoadStatus): void {
  getDb().runSync('UPDATE loads SET status = ?, updated_at = ? WHERE id = ?', [
    status,
    Date.now(),
    id,
  ]);
}

export function touchLoad(id: string): void {
  getDb().runSync('UPDATE loads SET updated_at = ? WHERE id = ?', [Date.now(), id]);
}

export function deleteLoad(id: string): void {
  getDb().runSync('DELETE FROM loads WHERE id = ?', [id]);
}

export interface LoadFilters {
  search?: string;
  status?: LoadStatus;
  broker?: string;
  customer?: string;
  fromDate?: number;
  toDate?: number;
}

export function searchLoads(filters: LoadFilters): Load[] {
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  if (filters.status) {
    clauses.push('status = ?');
    params.push(filters.status);
  }
  if (filters.broker) {
    clauses.push('broker_name LIKE ?');
    params.push(`%${filters.broker}%`);
  }
  if (filters.customer) {
    clauses.push('(shipper LIKE ? OR receiver LIKE ?)');
    const like = `%${filters.customer}%`;
    params.push(like, like);
  }
  if (filters.fromDate != null) {
    clauses.push('created_at >= ?');
    params.push(filters.fromDate);
  }
  if (filters.toDate != null) {
    clauses.push('created_at <= ?');
    params.push(filters.toDate);
  }
  if (filters.search) {
    clauses.push(
      '(load_number LIKE ? OR shipper LIKE ? OR receiver LIKE ? OR broker_name LIKE ? OR reference_number LIKE ? OR pickup_location LIKE ? OR delivery_location LIKE ?)',
    );
    const like = `%${filters.search}%`;
    params.push(like, like, like, like, like, like, like);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = getDb().getAllSync<LoadRow>(
    `SELECT * FROM loads ${where} ORDER BY created_at DESC`,
    params,
  );
  return rows.map(mapRow);
}
