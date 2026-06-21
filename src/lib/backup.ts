/**
 * Local device backup: export all data to a JSON file (shareable) and
 * import it back. Everything stays on-device; no cloud involved.
 */
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import dayjs from 'dayjs';
import { getDb } from '@/db/client';

interface BackupShape {
  app: 'LoadTimeline';
  version: number;
  exportedAt: number;
  loads: Record<string, unknown>[];
  events: Record<string, unknown>[];
  incidents: Record<string, unknown>[];
  photos: Record<string, unknown>[];
}

function dump(table: string): Record<string, unknown>[] {
  return getDb().getAllSync<Record<string, unknown>>(`SELECT * FROM ${table}`);
}

export function buildBackup(): BackupShape {
  return {
    app: 'LoadTimeline',
    version: 1,
    exportedAt: Date.now(),
    loads: dump('loads'),
    events: dump('events'),
    incidents: dump('incidents'),
    photos: dump('photos'),
  };
}

/** Writes the backup JSON to a file and opens the share sheet. */
export async function exportBackup(): Promise<void> {
  const data = buildBackup();
  const name = `loadtimeline-backup-${dayjs().format('YYYY-MM-DD-HHmm')}.json`;
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(data, null, 2));
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Export LoadTimeline Data',
    });
  }
}

export interface ImportResult {
  loads: number;
  events: number;
  incidents: number;
  photos: number;
}

// Whitelist of importable columns per table — guards against a hand-edited /
// malicious backup file injecting unexpected SQL via column names.
const ALLOWED_COLUMNS: Record<string, Set<string>> = {
  loads: new Set([
    'id', 'load_number', 'broker_name', 'customer_name', 'shipper', 'receiver',
    'pickup_location', 'delivery_location', 'reference_number', 'trailer_number',
    'driver_notes', 'driver_name', 'company', 'status', 'created_at', 'updated_at',
  ]),
  events: new Set([
    'id', 'load_id', 'stop', 'type', 'timestamp', 'latitude', 'longitude', 'address', 'notes', 'created_at',
  ]),
  incidents: new Set([
    'id', 'load_id', 'type', 'title', 'notes', 'timestamp', 'latitude', 'longitude', 'address', 'severity', 'created_at',
  ]),
  photos: new Set([
    'id', 'parent_type', 'parent_id', 'uri', 'thumb_uri', 'width', 'height', 'created_at',
  ]),
};

function insertIgnore(table: string, rows: Record<string, unknown>[]): number {
  const db = getDb();
  const allowed = ALLOWED_COLUMNS[table];
  if (!allowed) return 0;
  let count = 0;
  for (const row of rows) {
    const cols = Object.keys(row).filter((c) => allowed.has(c));
    if (cols.length === 0) continue;
    const placeholders = cols.map(() => '?').join(', ');
    const values = cols.map((c) => row[c] as string | number | null);
    const res = db.runSync(
      `INSERT OR IGNORE INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`,
      values,
    );
    count += res.changes;
  }
  return count;
}

/** Opens a file picker, parses the backup JSON, and merges it in (skips dupes). */
export async function importBackup(): Promise<ImportResult | null> {
  const picked = await File.pickFileAsync(undefined, 'application/json');
  const file = Array.isArray(picked) ? picked[0] : picked;
  if (!file) return null;

  const text = file.textSync();
  const data = JSON.parse(text) as Partial<BackupShape>;
  if (data.app !== 'LoadTimeline') {
    throw new Error('This file is not a LoadTimeline backup.');
  }

  const db = getDb();
  let result: ImportResult = { loads: 0, events: 0, incidents: 0, photos: 0 };
  db.withTransactionSync(() => {
    result = {
      loads: insertIgnore('loads', data.loads ?? []),
      events: insertIgnore('events', data.events ?? []),
      incidents: insertIgnore('incidents', data.incidents ?? []),
      photos: insertIgnore('photos', data.photos ?? []),
    };
  });
  return result;
}
