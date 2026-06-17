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

function insertIgnore(table: string, rows: Record<string, unknown>[]): number {
  const db = getDb();
  let count = 0;
  for (const row of rows) {
    const cols = Object.keys(row);
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
