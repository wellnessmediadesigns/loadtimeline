/**
 * SQLite client + migrations. Offline-first; this is the single source of
 * truth for all load data. Uses expo-sqlite's synchronous API for fast,
 * simple reads on the main thread (data volumes are small per device).
 */
import * as SQLite from 'expo-sqlite';

const REAL_DB = 'loadtimeline.db';
const DEMO_DB = 'loadtimeline-demo.db';

let activeName = REAL_DB;
let db: SQLite.SQLiteDatabase | null = null;
const migrated = new Set<string>();

function open(name: string): SQLite.SQLiteDatabase {
  const d = SQLite.openDatabaseSync(name);
  d.execSync('PRAGMA journal_mode = WAL;');
  d.execSync('PRAGMA foreign_keys = ON;');
  if (!migrated.has(name)) {
    applyMigrations(d);
    migrated.add(name);
  }
  return d;
}

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) db = open(activeName);
  return db;
}

/** Switches the active datastore between the user's real DB and the demo DB. */
export function setDemoMode(on: boolean): void {
  const name = on ? DEMO_DB : REAL_DB;
  if (name === activeName && db) return;
  activeName = name;
  db = null; // next getDb() opens (and lazily migrates) the target file
  getDb();
}

export function isDemoMode(): boolean {
  return activeName === DEMO_DB;
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
  // v2 — per-stop tracking (pickup vs delivery)
  (d) => {
    d.execSync(`ALTER TABLE events ADD COLUMN stop TEXT NOT NULL DEFAULT 'pickup';`);
    // Existing UNLOADED events belong to the delivery stop.
    d.execSync(`UPDATE events SET stop = 'delivery' WHERE type = 'UNLOADED';`);
  },
  // v3 — optional per-load driver/company override (falls back to profile)
  (d) => {
    d.execSync(`ALTER TABLE loads ADD COLUMN driver_name TEXT;`);
    d.execSync(`ALTER TABLE loads ADD COLUMN company TEXT;`);
  },
  // v4 — split the single customer into distinct shipper + receiver parties
  (d) => {
    d.execSync(`ALTER TABLE loads ADD COLUMN shipper TEXT;`);
    d.execSync(`ALTER TABLE loads ADD COLUMN receiver TEXT;`);
    // Preserve any existing customer value as the shipper.
    d.execSync(`UPDATE loads SET shipper = customer_name WHERE customer_name IS NOT NULL AND customer_name != '';`);
  },
];

/** Applies any pending migrations to a given DB using PRAGMA user_version. */
function applyMigrations(d: SQLite.SQLiteDatabase): void {
  const row = d.getFirstSync<{ user_version: number }>('PRAGMA user_version;');
  const current = row?.user_version ?? 0;
  for (let v = current; v < MIGRATIONS.length; v++) {
    MIGRATIONS[v](d);
  }
  if (current < MIGRATIONS.length) {
    d.execSync(`PRAGMA user_version = ${MIGRATIONS.length};`);
  }
}

/** Ensures the active datastore exists and is fully migrated. */
export function runMigrations(): void {
  getDb();
}

/** Generates a sortable unique id without extra dependencies. */
export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
