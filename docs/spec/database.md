# Data Storage & Persistence

> Rewritten for the IndexedDB-based persistence layer. This file replaces both the old `database.md` and the duplicate `databases.md`, which described the `localStorage`-only architecture prior to the React/TypeScript rewrite (see `docs/ADR.md` ADR-010).

## Storage Architecture

Fast Logbook PWA uses **client-side only** storage with no backend server:

1. **IndexedDB** (`fast-logbook-pwa` database, `kv` object store, via the [`idb`](https://github.com/jakearchibald/idb) wrapper) — primary data store
2. **`localStorage`** — only for the short-lived per-day edit buffer and as a one-time migration source
3. **Cache API** — asset caching via the Workbox-generated service worker

## IndexedDB Schema

### Overview

A single object store, `kv`, used as a flat key-value table (string keys → string values), opened via [src/lib/storage.ts](../../src/lib/storage.ts):

```typescript
const dbPromise = openDB('fast-logbook-pwa', 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('kv')) {
      db.createObjectStore('kv');
    }
  },
});
```

**Storage Limits**: IndexedDB quotas are browser-managed and substantially larger than `localStorage`'s typical 5-10MB (often a percentage of free disk space). `idb` operations are asynchronous `Promise`s, so they don't block the main thread the way synchronous `localStorage` calls did.

### Keys

#### 1. `log`
**Type**: string. **Format**: newline-separated log entries, identical on-disk format to the earlier `localStorage` version:
```
YYYY-MM-DD HH:MMCategory;Detail
```
Example:
```
2025-12-13 09:15@work +Project A;Meeting
2025-12-13 10:30@work +Project A;Coding
2025-12-13 12:00^Lunch
```

**Write path**: never written directly by the textarea's `onInput` handler. Edits go to the `localStorage` per-day buffer (`log_buffer`) first, and are merged into this IndexedDB key by `flushBuffer()` in `App.tsx` (see "Per-day Buffer & Merge" below).

**Read path**: `App.tsx`'s `loadLogs()` reads the full log and filters it down to the active day's window for display; `download.ts`'s `downloadLog()` reads the full log for export.

#### 2. `rounding_mins`
**Type**: numeric string. **Valid values**: `1`, `5`, `10`, `15`, `30`, `60`. **Default**: `1`. Validated via `getRoundingUnit()` (see [`utilities.md`](utilities.md)).

#### 3. `shortcut_1` through `shortcut_9`
**Type**: string. **Default**: empty (the UI shows an i18n placeholder, not a pre-filled example, when empty — see [`configuration.md`](configuration.md)).

#### 4. `date-roll-over-time`
**Type**: string, `HH:MM`. **Default**: `'05:00'`. Defines the boundary of a "logical day" for the per-day view (see §4.4 of `docs/design.md`).

#### 5. `last_edited_date`
**Type**: string, `YYYY-MM-DD`. The last date the user had open; used to restore the view on reload (falls back to "today, adjusted for roll-over" if absent or in the future).

#### 6. `migration_version`
**Type**: numeric string. Tracks which one-time migrations have run (see "Migration" below). Currently only `'0'` → `'1'` is defined.

#### 7. `notice_date_selector`
**Type**: string, presence-checked (`'1'` once set). Gates the one-time modal explaining the per-day view to upgrading users.

## `localStorage` Usage (transient only)

### Per-day Edit Buffer: `log_buffer` / `log_buffer_date`

While a day is open for editing, keystrokes are debounce-saved into `localStorage` rather than IndexedDB, since synchronous `localStorage` writes are cheap and don't need to await an IndexedDB transaction on every keystroke:

```typescript
localStorage.setItem('log_buffer', trimNewLine(textareaRef.current?.value ?? ''));
localStorage.setItem('log_buffer_date', targetDateRef.current);
```

### `flushBuffer()` — merging the buffer into IndexedDB

Called on `visibilitychange` (tab hidden), date change, and at load time. Computes the buffer's day-window via `getDateBoundaries()`, removes any lines from the full IndexedDB log that fall inside that window (so edited lines aren't duplicated), appends the buffer's lines, sorts everything by its 16-character timestamp prefix, and writes the merged result back to IndexedDB. The buffer keys are then cleared and a `BroadcastChannel` message is posted so other open tabs reload.

This means the full log in IndexedDB is **not** updated on every keystroke — only on flush — while the on-screen textarea always reflects the latest typed state via the `localStorage` buffer.

### Migration Source

On first load after upgrading, `App.tsx`'s `runMigrations()` (gated by `migration_version < 1`) calls `migrateFromLocalStorage([LOG_DATA_KEY, ROUNDING_UNIT_MINUTE_KEY, DATE_ROLL_OVER_TIME_KEY, 'shortcut_1', ..., 'shortcut_9'])`, which copies each key's `localStorage` value into IndexedDB (if present and not the string `'undefined'`) and deletes it from `localStorage`. It also migrates a legacy `date-roll-over-time-value` key if present, and removes stray `downloadUrl`/`downloadFilename` keys left over from the old download hand-off mechanism (see [`utilities.md`](utilities.md)).

## Cross-Tab Synchronization

Both `App.tsx` and `ConfigApp.tsx` open a `BroadcastChannel('fast-logbook-sync')` and post `{ key, value }` messages whenever log data or settings change. Listeners react by reloading the affected state (e.g. re-filtering the log for the active day, or updating a `<select>`/`<input>` value) — see [`configuration.md`](configuration.md) for the settings side and [`components.md`](components.md) for the main-page side.

This replaces the earlier `window.addEventListener('storage', ...)` approach, which only worked for `localStorage` and only fired in tabs that did *not* perform the write.

## Service Worker Caching

The hand-written `sw.js` (with its manually-maintained `assets` array, and the known `'my-cache'` hardcoding bug) has been **replaced** by a Workbox service worker generated by `vite-plugin-pwa` (`strategies: 'generateSW'`). See `vite.config.js`:

```javascript
VitePWA({
  registerType: 'autoUpdate',
  strategies: 'generateSW',
  filename: 'sw.js',
  workbox: { globPatterns: ['**/*.{js,css,html,png,ico,svg,woff2,json}'] },
  devOptions: { enabled: true },
})
```

Workbox derives the precache manifest from the Vite build output automatically — there is no manually-maintained asset list to fall out of sync, and no separate cache-name-race-condition or hardcoded-cache-key bug class to track (both were documented bugs in the old `sw.js`; see `docs/ADR.md` ADR-003/ADR-012/ADR-014 for the migration history). `App.tsx` registers the service worker and only forces a page reload on an actual update (a `controllerchange` after the worker already had a controller), not on first install.

## Data Lifetime

**Log data** (`log` key): created on first log entry; updated whenever `flushBuffer()` runs; deleted only via the explicit "Delete log" confirmation flow (clears the active day's content, then flushes); never migrated except by the one-time `localStorage → IndexedDB` step above.

**Configuration data** (`rounding_mins`, `shortcut_*`, `date-roll-over-time`): created on first change; updated on every settings change; never deleted by the app; validated on read with safe defaults.

**Per-day buffer** (`log_buffer`/`log_buffer_date` in `localStorage`): created on first edit of a day; cleared on every successful `flushBuffer()`; if the app crashes between a debounced save and a flush, the buffer could in principle survive past its intended lifetime — `flushBuffer()` is called defensively on visibility change, date change, and load to minimize this window.

**Cache data**: managed entirely by Workbox; old caches are pruned automatically on activation of a new service worker version.

## Data Backup & Export

Unchanged in spirit from the earlier version — see [`utilities.md`](utilities.md) `download.ts`:
1. **Download File**: a self-contained `.html` file bundling an HTML summary table, the raw plaintext log, and a Markdown summary table.
2. **View in Tab**: the same generated document opened in a popup window instead of downloaded.
3. **Copy to Clipboard**: per-section copy buttons in the generated document (clipboard-write permission gated).

**Filename**: `` `${appName}_YYYY-MM-DD.html` `` (app name from `i18next.t('app_name')`).

There is still no **import** functionality (re-uploading a previously exported file) — see `todo.md`.

## Security & Privacy

- **No encryption**: IndexedDB data is stored unencrypted, same trust model as the earlier `localStorage` version. Rationale: client-side-only application, not designed for highly sensitive data.
- **No server communication**: all data stays on-device.
- **No analytics/telemetry**: the GA4 tracking module present in earlier versions has been removed entirely (see `docs/ADR.md` ADR-005) — there is no third-party data collection of any kind.
- **Quota handling**: `setItem()` callers catch `DOMException` named `QuotaExceededError` and surface an i18next-translated alert (see [`configuration.md`](configuration.md)).

## Database Schema Summary

| Key | Store | Type | Persistence | Sync | Notes |
|-----|-------|------|-------------|------|-------|
| `log` | IndexedDB (`kv`) | string | Indefinite | `BroadcastChannel` | Newline-separated entries; updated via buffer flush, not per-keystroke |
| `rounding_mins` | IndexedDB (`kv`) | string | Indefinite | `BroadcastChannel` | Validated on read |
| `shortcut_1`–`shortcut_9` | IndexedDB (`kv`) | string | Indefinite | `BroadcastChannel` | Empty by default |
| `date-roll-over-time` | IndexedDB (`kv`) | string `HH:MM` | Indefinite | `BroadcastChannel` | Default `05:00` |
| `last_edited_date` | IndexedDB (`kv`) | string `YYYY-MM-DD` | Indefinite | No | Restores last-open day on reload |
| `migration_version` | IndexedDB (`kv`) | numeric string | Indefinite | No | Gates one-time migrations |
| `notice_date_selector` | IndexedDB (`kv`) | string | Indefinite | No | Gates the per-day-view notice modal |
| `log_buffer` / `log_buffer_date` | `localStorage` | string | Transient | No (merged into IndexedDB, then cleared) | Active day's in-progress edits |

## Future Enhancements

See [`todo.md`](todo.md) for the full list; storage-relevant candidates include data compression (`CompressionStream`), import functionality, and resolving the `package.json`/manifest version-string drift noted in [`known_bugs.md`](known_bugs.md).
