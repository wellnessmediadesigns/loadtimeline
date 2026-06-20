import { getDb, newId } from '../client';
import { touchLoad } from './loads';
import type { EventType, GeoStamp, LoadEvent, StopType } from '@/types';

interface EventRow {
  id: string;
  load_id: string;
  stop: StopType;
  type: EventType;
  timestamp: number;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  notes: string | null;
  created_at: number;
}

function mapRow(r: EventRow): LoadEvent {
  return {
    id: r.id,
    loadId: r.load_id,
    stop: r.stop,
    type: r.type,
    timestamp: r.timestamp,
    latitude: r.latitude,
    longitude: r.longitude,
    address: r.address,
    notes: r.notes,
    createdAt: r.created_at,
  };
}

export function addEvent(
  loadId: string,
  stop: StopType,
  type: EventType,
  geo: GeoStamp,
  notes?: string | null,
): LoadEvent {
  const db = getDb();
  const now = Date.now();
  const id = newId();
  db.runSync(
    `INSERT INTO events (id, load_id, stop, type, timestamp, latitude, longitude, address, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, loadId, stop, type, now, geo.latitude, geo.longitude, geo.address, notes ?? null, now],
  );
  touchLoad(loadId);
  return getEvent(id)!;
}

export function getEvent(id: string): LoadEvent | null {
  const row = getDb().getFirstSync<EventRow>('SELECT * FROM events WHERE id = ?', [id]);
  return row ? mapRow(row) : null;
}

export function listEvents(loadId: string): LoadEvent[] {
  const rows = getDb().getAllSync<EventRow>(
    'SELECT * FROM events WHERE load_id = ? ORDER BY timestamp ASC',
    [loadId],
  );
  return rows.map(mapRow);
}

export function updateEventNotes(id: string, notes: string | null): void {
  getDb().runSync('UPDATE events SET notes = ? WHERE id = ?', [notes, id]);
}

export function deleteEvent(id: string): void {
  getDb().runSync('DELETE FROM events WHERE id = ?', [id]);
}

export interface RecentActivity {
  event: LoadEvent;
  loadId: string;
  loadNumber: string | null;
  shipper: string | null;
}

/** Most recent events across all loads, for the dashboard activity feed. */
export function recentActivity(limit = 8): RecentActivity[] {
  const rows = getDb().getAllSync<EventRow & { load_number: string | null; shipper: string | null }>(
    `SELECT e.*, l.load_number, l.shipper
     FROM events e JOIN loads l ON l.id = e.load_id
     ORDER BY e.timestamp DESC LIMIT ?`,
    [limit],
  );
  return rows.map((r) => ({
    event: mapRow(r),
    loadId: r.load_id,
    loadNumber: r.load_number,
    shipper: r.shipper,
  }));
}

export function countEventsByType(): Record<string, number> {
  const rows = getDb().getAllSync<{ type: string; c: number }>(
    'SELECT type, COUNT(*) as c FROM events GROUP BY type',
  );
  return Object.fromEntries(rows.map((r) => [r.type, r.c]));
}
