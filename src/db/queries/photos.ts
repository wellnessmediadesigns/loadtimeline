import { getDb, newId } from '../client';
import type { Photo, PhotoParent } from '@/types';

interface PhotoRow {
  id: string;
  parent_type: PhotoParent;
  parent_id: string;
  uri: string;
  thumb_uri: string;
  width: number;
  height: number;
  created_at: number;
}

function mapRow(r: PhotoRow): Photo {
  return {
    id: r.id,
    parentType: r.parent_type,
    parentId: r.parent_id,
    uri: r.uri,
    thumbUri: r.thumb_uri,
    width: r.width,
    height: r.height,
    createdAt: r.created_at,
  };
}

export interface PhotoInput {
  uri: string;
  thumbUri: string;
  width: number;
  height: number;
}

export function addPhoto(parentType: PhotoParent, parentId: string, input: PhotoInput): Photo {
  const db = getDb();
  const id = newId();
  const now = Date.now();
  db.runSync(
    `INSERT INTO photos (id, parent_type, parent_id, uri, thumb_uri, width, height, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, parentType, parentId, input.uri, input.thumbUri, input.width, input.height, now],
  );
  const row = db.getFirstSync<PhotoRow>('SELECT * FROM photos WHERE id = ?', [id])!;
  return mapRow(row);
}

export function listPhotos(parentType: PhotoParent, parentId: string): Photo[] {
  const rows = getDb().getAllSync<PhotoRow>(
    'SELECT * FROM photos WHERE parent_type = ? AND parent_id = ? ORDER BY created_at ASC',
    [parentType, parentId],
  );
  return rows.map(mapRow);
}

/** All photos belonging to a load (its events + incidents), for reports. */
export function listPhotosForLoad(loadId: string): Photo[] {
  const rows = getDb().getAllSync<PhotoRow>(
    `SELECT p.* FROM photos p
     WHERE (p.parent_type = 'event' AND p.parent_id IN (SELECT id FROM events WHERE load_id = ?))
        OR (p.parent_type = 'incident' AND p.parent_id IN (SELECT id FROM incidents WHERE load_id = ?))
     ORDER BY p.created_at ASC`,
    [loadId, loadId],
  );
  return rows.map(mapRow);
}

export function deletePhoto(id: string): void {
  getDb().runSync('DELETE FROM photos WHERE id = ?', [id]);
}

export function countPhotos(): number {
  const row = getDb().getFirstSync<{ c: number }>('SELECT COUNT(*) as c FROM photos');
  return row?.c ?? 0;
}
