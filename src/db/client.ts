/**
 * SQLite client + migrations. Offline-first; this is the single source of
 * truth for all load data. Uses expo-sqlite's synchronous API for fast,
 * simple reads on the main thread (data volumes are small per device).
 */
import * as SQLite from 'expo-sqlite';

const DB_NAME = 'loadtimeline.db';

let db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync(DB_NAME);
    db.execSync('PRAGMA journal_mode = WAL;');
    db.execSync('PRAGMA foreign_keys = ON;');
  }
  return db;
}

const MIGRATIONS: ((d: SQLite.SQLiteDatabase) => void)[] = [
  // v1 — initial schema
  (d) => {
    d.execSync(`
      CREATE TABLE IF NOT EXISTS loads (
        id TEXT PRIMARY KEY NOT NULL,
        load_number TEXT,
        broker_name TEXT,
        customer_name TEXT,
        pickup_location TEXT,
        delivery_location TEXT,
        reference_number TEXT,
        trailer_number TEXT,
        driver_notes TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY NOT NULL,
        load_id TEXT NOT NULL,
        type TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        latitude REAL,
        longitude REAL,
        address TEXT,
        notes TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (load_id) REFERENCES loads(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY NOT NULL,
        load_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        notes TEXT,
        timestamp INTEGER NOT NULL,
        latitude REAL,
        longitude REAL,
        address TEXT,
        severity TEXT NOT NULL DEFAULT 'medium',
        created_at INTEGER NOT NULL,
        FOREIGN KEY (load_id) REFERENCES loads(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS photos (
        id TEXT PRIMARY KEY NOT NULL,
        parent_type TEXT NOT NULL,
        parent_id TEXT NOT NULL,
        uri TEXT NOT NULL,
        thumb_uri TEXT NOT NULL,
        width INTEGER NOT NULL DEFAULT 0,
        height INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_events_load ON events(load_id, timestamp);
      CREATE INDEX IF NOT EXISTS idx_incidents_load ON incidents(load_id, timestamp);
      CREATE INDEX IF NOT EXISTS idx_photos_parent ON photos(parent_type, parent_id);
      CREATE INDEX IF NOT EXISTS idx_loads_status ON loads(status, updated_at);
    `);
  },
];

/** Applies any pending migrations using PRAGMA user_version. */
export function runMigrations(): void {
  const d = getDb();
  const row = d.getFirstSync<{ user_version: number }>('PRAGMA user_version;');
  const current = row?.user_version ?? 0;
  for (let v = current; v < MIGRATIONS.length; v++) {
    MIGRATIONS[v](d);
  }
  if (current < MIGRATIONS.length) {
    d.execSync(`PRAGMA user_version = ${MIGRATIONS.length};`);
  }
}

/** Generates a sortable unique id without extra dependencies. */
export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
