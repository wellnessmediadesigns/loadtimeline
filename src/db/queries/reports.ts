import { getDb, newId } from '../client';
import type { Report } from '@/types';

interface ReportRow {
  id: string;
  load_id: string | null;
  load_number: string | null;
  title: string;
  scope: string | null;
  file_uri: string;
  created_at: number;
}

function mapRow(r: ReportRow): Report {
  return {
    id: r.id,
    loadId: r.load_id,
    loadNumber: r.load_number,
    title: r.title,
    scope: r.scope,
    fileUri: r.file_uri,
    createdAt: r.created_at,
  };
}

export interface ReportInput {
  loadId: string | null;
  loadNumber: string | null;
  title: string;
  scope: string | null;
  fileUri: string;
}

export function addReport(input: ReportInput): Report {
  const db = getDb();
  const id = newId();
  const now = Date.now();
  db.runSync(
    `INSERT INTO reports (id, load_id, load_number, title, scope, file_uri, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, input.loadId, input.loadNumber, input.title, input.scope, input.fileUri, now],
  );
  return getReport(id)!;
}

export function getReport(id: string): Report | null {
  const row = getDb().getFirstSync<ReportRow>('SELECT * FROM reports WHERE id = ?', [id]);
  return row ? mapRow(row) : null;
}

export function listReports(): Report[] {
  const rows = getDb().getAllSync<ReportRow>('SELECT * FROM reports ORDER BY created_at DESC');
  return rows.map(mapRow);
}

export function deleteReport(id: string): void {
  getDb().runSync('DELETE FROM reports WHERE id = ?', [id]);
}

export function countReports(): number {
  const row = getDb().getFirstSync<{ c: number }>('SELECT COUNT(*) as c FROM reports');
  return row?.c ?? 0;
}
