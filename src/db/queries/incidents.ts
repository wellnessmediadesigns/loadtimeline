import { getDb, newId } from '../client';
import { touchLoad } from './loads';
import type { GeoStamp, Incident, IncidentType, Severity } from '@/types';

interface IncidentRow {
  id: string;
  load_id: string;
  type: IncidentType;
  title: string;
  notes: string | null;
  timestamp: number;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  severity: Severity;
  created_at: number;
}

function mapRow(r: IncidentRow): Incident {
  return {
    id: r.id,
    loadId: r.load_id,
    type: r.type,
    title: r.title,
    notes: r.notes,
    timestamp: r.timestamp,
    latitude: r.latitude,
    longitude: r.longitude,
    address: r.address,
    severity: r.severity,
    createdAt: r.created_at,
  };
}

export interface IncidentInput {
  type: IncidentType;
  title: string;
  notes?: string | null;
  severity: Severity;
  geo: GeoStamp;
}

export function addIncident(loadId: string, input: IncidentInput): Incident {
  const db = getDb();
  const now = Date.now();
  const id = newId();
  db.runSync(
    `INSERT INTO incidents
      (id, load_id, type, title, notes, timestamp, latitude, longitude, address, severity, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      loadId,
      input.type,
      input.title,
      input.notes ?? null,
      now,
      input.geo.latitude,
      input.geo.longitude,
      input.geo.address,
      input.severity,
      now,
    ],
  );
  touchLoad(loadId);
  return getIncident(id)!;
}

export function getIncident(id: string): Incident | null {
  const row = getDb().getFirstSync<IncidentRow>('SELECT * FROM incidents WHERE id = ?', [id]);
  return row ? mapRow(row) : null;
}

export function listIncidents(loadId: string): Incident[] {
  const rows = getDb().getAllSync<IncidentRow>(
    'SELECT * FROM incidents WHERE load_id = ? ORDER BY timestamp DESC',
    [loadId],
  );
  return rows.map(mapRow);
}

export interface IncidentUpdate {
  type: IncidentType;
  title: string;
  notes?: string | null;
  severity: Severity;
}

export function updateIncident(id: string, input: IncidentUpdate): void {
  getDb().runSync(
    'UPDATE incidents SET type = ?, title = ?, notes = ?, severity = ? WHERE id = ?',
    [input.type, input.title, input.notes ?? null, input.severity, id],
  );
}

export function setIncidentGeo(id: string, geo: GeoStamp): void {
  getDb().runSync('UPDATE incidents SET latitude = ?, longitude = ?, address = ? WHERE id = ?', [
    geo.latitude,
    geo.longitude,
    geo.address,
    id,
  ]);
}

export function deleteIncident(id: string): void {
  getDb().runSync('DELETE FROM incidents WHERE id = ?', [id]);
}

export function countIncidents(): number {
  const row = getDb().getFirstSync<{ c: number }>('SELECT COUNT(*) as c FROM incidents');
  return row?.c ?? 0;
}

export function countIncidentsByType(): { type: IncidentType; count: number }[] {
  const rows = getDb().getAllSync<{ type: IncidentType; c: number }>(
    'SELECT type, COUNT(*) as c FROM incidents GROUP BY type ORDER BY c DESC',
  );
  return rows.map((r) => ({ type: r.type, count: r.c }));
}
