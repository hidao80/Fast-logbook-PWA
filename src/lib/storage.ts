import { openDB } from 'idb';

const DB_NAME = 'fast-logbook-pwa';
const STORE_NAME = 'kv';
const DB_VERSION = 1;

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME);
    }
  },
});

/**
 * Retrieve a value by key.
 *
 * @returns stored string, or null if not found
 * @example const log = await getItem('log');
 */
export async function getItem(key: string): Promise<string | null> {
  return (await (await dbPromise).get(STORE_NAME, key)) ?? null;
}

/**
 * Store a value under the given key.
 *
 * @example await setItem('log', 'entry text');
 */
export async function setItem(key: string, value: string): Promise<void> {
  await (await dbPromise).put(STORE_NAME, value, key);
}

/**
 * Remove the entry for the given key.
 *
 * @example await removeItem('downloadUrl');
 */
export async function removeItem(key: string): Promise<void> {
  await (await dbPromise).delete(STORE_NAME, key);
}

/**
 * One-time migration from localStorage to IndexedDB.
 *
 * @param keys - localStorage keys to migrate
 * @example await migrateFromLocalStorage(['log', 'rounding_mins']);
 */
export async function migrateFromLocalStorage(keys: string[]): Promise<void> {
  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (value !== null && value !== 'undefined') {
      await setItem(key, value);
      localStorage.removeItem(key);
    }
  }
}
