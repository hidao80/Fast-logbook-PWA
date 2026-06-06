/**
 * IndexedDB-based key-value storage module.
 *
 * Drop-in async replacement for localStorage. Provides:
 *   getItem(key)         -> Promise<string|null>
 *   setItem(key, value)  -> Promise<void>
 *   removeItem(key)      -> Promise<void>
 *   migrateFromLocalStorage(keys) -> Promise<void>
 *
 * DB name    : 'fast-logbook-pwa'
 * Store name : 'kv'  (out-of-line keys)
 *
 * @module storage
 */

const DB_NAME = 'fast-logbook-pwa';
const STORE_NAME = 'kv';
const DB_VERSION = 1;

// Open the database once and reuse the connection for all operations.
const dbPromise = new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, DB_VERSION);

  request.onupgradeneeded = (event) => {
    const db = event.target.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      // Out-of-line keys: key is supplied as the second argument to put/get.
      db.createObjectStore(STORE_NAME);
    }
  };

  request.onsuccess = (event) => resolve(event.target.result);
  request.onerror = (event) => reject(event.target.error);
});

/**
 * Retrieve a value by key.
 *
 * @param {string} key
 * @returns {Promise<string|null>} Stored string, or null if not found
 * @example
 * const log = await getItem('log');
 */
export async function getItem(key) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Store a value under the given key.
 *
 * Resolves on tx.oncomplete to guarantee the write is flushed to disk,
 * not merely queued (which req.onsuccess would indicate).
 *
 * @param {string} key
 * @param {string} value
 * @returns {Promise<void>}
 * @example
 * await setItem('log', 'entry text');
 */
export async function setItem(key, value) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/**
 * Remove the entry for the given key.
 *
 * @param {string} key
 * @returns {Promise<void>}
 * @example
 * await removeItem('downloadUrl');
 */
export async function removeItem(key) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/**
 * One-time migration from localStorage to IndexedDB.
 *
 * For each key: if a value exists in localStorage it is written to IndexedDB,
 * then removed from localStorage. On subsequent calls localStorage will be
 * empty so the function is effectively a no-op.
 *
 * @param {string[]} keys - localStorage keys to migrate
 * @returns {Promise<void>}
 * @example
 * await migrateFromLocalStorage(['log', 'rounding_mins']);
 */
export async function migrateFromLocalStorage(keys) {
  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (value !== null && value !== 'undefined') {
      await setItem(key, value);
    }
    localStorage.removeItem(key);
  }
}
