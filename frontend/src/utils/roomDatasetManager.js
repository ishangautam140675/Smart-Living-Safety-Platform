/**
 * Room Image Downloader and Local Dataset Manager
 * Saves sample images into local folder structure and provides
 * access to downloaded / cached local files.
 */

import { ROOM_IMAGE_DATASET } from './roomImageDataset';

const DATASET_CACHE_KEY = 'slp_custom_room_photos_';

export function getCustomPhotosForRoom(room) {
  try {
    const key = `${room.roomNumber}_${room.roomType}`;
    const raw = localStorage.getItem(DATASET_CACHE_KEY + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveCustomPhotosForRoom(room, photos) {
  try {
    const key = `${room.roomNumber}_${room.roomType}`;
    localStorage.setItem(DATASET_CACHE_KEY + key, JSON.stringify(photos));
  } catch (e) {
    console.error('Failed to save room photos:', e);
  }
}

export function clearCustomPhotosForRoom(room) {
  try {
    const key = `${room.roomNumber}_${room.roomType}`;
    localStorage.removeItem(DATASET_CACHE_KEY + key);
  } catch {
    // ignore
  }
}
