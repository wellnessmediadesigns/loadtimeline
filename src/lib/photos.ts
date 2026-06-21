/**
 * Local-only photo pipeline: pick/capture -> compress -> thumbnail ->
 * persist into the app's document directory. No cloud, no upload.
 * Photos are stored under `<documents>/photos`, thumbnails under `.../thumbs`.
 */
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Directory, File, Paths } from 'expo-file-system';
import { newId } from '@/db/client';
import { addPhoto, deletePhoto, listPhotos, listPhotosForLoad, type PhotoInput } from '@/db/queries/photos';
import type { Photo, PhotoParent } from '@/types';

const FULL_MAX_WIDTH = 1600;
const THUMB_MAX_WIDTH = 320;
const FULL_QUALITY = 0.6;
const THUMB_QUALITY = 0.5;

function ensureDir(name: string): Directory {
  const dir = new Directory(Paths.document, name);
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

interface ProcessedImage {
  uri: string;
  thumbUri: string;
  width: number;
  height: number;
}

/** Compress + thumbnail a source image and move both into permanent storage. */
async function processAndStore(sourceUri: string): Promise<ProcessedImage> {
  const photosDir = ensureDir('photos');
  const thumbsDir = ensureDir('thumbs');
  const id = newId();

  const full = await manipulateAsync(
    sourceUri,
    [{ resize: { width: FULL_MAX_WIDTH } }],
    { compress: FULL_QUALITY, format: SaveFormat.JPEG },
  );
  const thumb = await manipulateAsync(
    sourceUri,
    [{ resize: { width: THUMB_MAX_WIDTH } }],
    { compress: THUMB_QUALITY, format: SaveFormat.JPEG },
  );

  const fullDest = new File(photosDir, `${id}.jpg`);
  const thumbDest = new File(thumbsDir, `${id}.jpg`);
  await new File(full.uri).move(fullDest);
  await new File(thumb.uri).move(thumbDest);

  return {
    uri: fullDest.uri,
    thumbUri: thumbDest.uri,
    width: full.width,
    height: full.height,
  };
}

async function attach(
  parentType: PhotoParent,
  parentId: string,
  sourceUri: string,
): Promise<Photo> {
  const processed = await processAndStore(sourceUri);
  const input: PhotoInput = {
    uri: processed.uri,
    thumbUri: processed.thumbUri,
    width: processed.width,
    height: processed.height,
  };
  return addPhoto(parentType, parentId, input);
}

/** Capture a new photo with the camera and attach it to a parent record. */
export async function capturePhoto(
  parentType: PhotoParent,
  parentId: string,
): Promise<Photo | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 1,
    exif: false,
  });
  if (result.canceled || result.assets.length === 0) return null;
  return attach(parentType, parentId, result.assets[0].uri);
}

/** Pick one or more photos from the library and attach them. */
export async function pickPhotos(
  parentType: PhotoParent,
  parentId: string,
): Promise<Photo[]> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return [];
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: 10,
    quality: 1,
    exif: false,
  });
  if (result.canceled) return [];
  const photos: Photo[] = [];
  for (const asset of result.assets) {
    photos.push(await attach(parentType, parentId, asset.uri));
  }
  return photos;
}

/** Deletes the underlying files for a stored photo (best-effort). */
export function removePhotoFiles(photo: Photo): void {
  for (const uri of [photo.uri, photo.thumbUri]) {
    try {
      const f = new File(uri);
      if (f.exists) f.delete();
    } catch {
      // best-effort cleanup
    }
  }
}

/** Deletes a photo's files AND its DB row. */
export function purgePhoto(photo: Photo): void {
  removePhotoFiles(photo);
  deletePhoto(photo.id);
}

/** Removes every photo (files + rows) attached to an event or incident. */
export function purgePhotosFor(parentType: PhotoParent, parentId: string): void {
  for (const p of listPhotos(parentType, parentId)) purgePhoto(p);
}

/** Removes every photo (files + rows) belonging to a load's events & incidents. */
export function purgeLoadPhotos(loadId: string): void {
  for (const p of listPhotosForLoad(loadId)) purgePhoto(p);
}

/** Reads a stored image as a base64 data URI for embedding in PDF reports. */
export function toDataUri(uri: string): string | null {
  try {
    const f = new File(uri);
    if (!f.exists) return null;
    return `data:image/jpeg;base64,${f.base64Sync()}`;
  } catch {
    return null;
  }
}
