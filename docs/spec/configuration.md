# Configuration System

> Rewritten for the IndexedDB-based storage layer (`src/lib/storage.ts`). The previous version of this document described `localStorage` + the `storage` event, which has been replaced.

## Overview

Fast Logbook PWA persists configuration in **IndexedDB** (database `fast-logbook-pwa`, object store `kv`), accessed through the small wrapper in [src/lib/storage.ts](../../src/lib/storage.ts). Settings are synchronized across open tabs/windows using `BroadcastChannel`, not the `storage` event (IndexedDB writes don't fire `storage` events the way `localStorage` writes do).

## Configuration Storage

### Keys

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `rounding_mins` | string (numeric) | `1` | Time rounding unit in minutes |
| `shortcut_1` to `shortcut_9` | string | `''` (empty) | User-defined shortcut button texts |
| `date-roll-over-time` | string `HH:MM` | `05:00` | Logical-day boundary used by the per-day log view |
| `migration_version` | string (numeric) | `0` | Tracks which one-time migrations have already run |
| `notice_date_selector` | string | unset | Set to `'1'` once the user dismisses the per-day-view notice |
| `last_edited_date` | string `YYYY-MM-DD` | unset | Last date the user had open; used to restore the view on reload |

### Storage Constants

Defined in [src/lib/utils.ts](../../src/lib/utils.ts):

```typescript
export const LOG_DATA_KEY = 'log';
export const ROUNDING_UNIT_MINUTE_KEY = 'rounding_mins';
```

The other keys (`date-roll-over-time`, `migration_version`, `notice_date_selector`, `last_edited_date`) are defined as local constants inside `App.tsx`/`ConfigApp.tsx` rather than exported from `utils.ts`, since they are only consumed there.

## Configuration UI

### `ConfigApp` (`/config` route)

File: [src/ConfigApp.tsx](../../src/ConfigApp.tsx)

Provides:
1. **Rounding Unit Selector**: `<select>` for time-rounding precision
2. **Shortcut Items**: 9 text inputs for customizing shortcut button labels
3. **Roll-over Time**: `<input type="time">` for the logical-day boundary
4. **Version Display**: shows the app version (currently read from `/manifest.json` at runtime — see `known_bugs.md` for the version-string mismatch caveat)
5. **Back Navigation**: a `Link` to `/`

### Rounding Unit Options

Available values: `1`, `5`, `10`, `15`, `30`, `60` minutes. These affect how work time is rounded during summary calculation (see [`utilities.md`](utilities.md) `parse()`).

### Default Shortcut Values

Shortcut inputs default to an **empty string** placeholder text drawn from the i18n key `shortcut_N` (`t('shortcut_1')`, etc., used as the `placeholder` attribute) rather than being pre-filled with example values, unlike the vanilla-JS version which seeded `shortcut_1`–`5` with example text (`@work +PromotionalExams;Study`, etc.). Users start with all 9 shortcuts blank and fill them in via the Config screen.

## Configuration Logic

### Initialization (`ConfigApp`)

On mount (`useEffect`):
1. `autoSetTheme()` — apply dark/light theme
2. Open a `BroadcastChannel('fast-logbook-sync')`
3. Fetch `/manifest.json` for the version string
4. Load all 9 shortcuts (`Promise.all` over `getItem('shortcut_N')`)
5. Load `rounding_mins`, validated via `getRoundingUnit()`
6. Load `date-roll-over-time`, defaulting to `'05:00'`

### Auto-save Behavior

**Shortcut Inputs** (`handleShortcutChange`):
- Trigger: `onChange` and `onBlur`
- Action: `await setItem('shortcut_N', value.trim())`, then broadcast `{ key, value }` over the channel
- Error Handling: alerts the user (`t('storage_quota_exceeded')`) on `DOMException` named `QuotaExceededError`

**Rounding Unit** (`handleRoundingChange`):
- Trigger: `onChange` on the `<select>`
- Action: validates via `getRoundingUnit()`, persists, updates local state, broadcasts the change

**Roll-over Time** (`handleRollOverChange`):
- Trigger: `onChange` on the `<input type="time">`
- Action: persists and broadcasts the new value; `App.tsx` reacts to this broadcast by recomputing `targetDate` and reloading the visible day

### Cross-tab Synchronization

Both `App.tsx` and `ConfigApp.tsx` listen on the same `BroadcastChannel('fast-logbook-sync')`:

```typescript
bc.addEventListener('message', (event: MessageEvent<{ key: string; value: string }>) => {
  const { key, value } = event.data ?? {};
  if (key === ROUNDING_UNIT_MINUTE_KEY) {
    setRoundingUnit(getRoundingUnit(value));
  } else if (key === DATE_ROLL_OVER_TIME_KEY) {
    setRollOverTime(value);
  } else if (key.startsWith('shortcut_')) {
    // update the corresponding shortcut slot
  }
});
```

Unlike the old `storage` event (which only fires in *other* tabs, never the writing tab, and only for `localStorage`), `BroadcastChannel` messages are explicit and work uniformly across same-origin tabs regardless of which storage backend changed.

## Validation Functions

### `getRoundingUnit()`

Defined in [src/lib/utils.ts](../../src/lib/utils.ts):

```typescript
export function getRoundingUnit(value: number | string | null): number {
  switch (Number(value)) {
    case 1: case 5: case 10: case 15: case 30: case 60:
      return Number(value);
    default:
      return 1;
  }
}
```

**Purpose**: validates a rounding-unit value (from IndexedDB, a `BroadcastChannel` message, or a `<select>` change), defaulting to `1` for anything else.

## Error Handling

### Storage Quota Exceeded

```typescript
try {
  await setItem(key, value);
} catch (e) {
  if (e instanceof DOMException && e.name === 'QuotaExceededError') {
    alert(t('storage_quota_exceeded'));
  }
}
```

`storage_quota_exceeded` is a proper i18next key, present in both `en.json` and `ja.json` — the previously hard-coded Japanese-only alert string (a documented bug in the vanilla-JS version) has been fixed.

**User Impact**: alert displayed, data not saved.
**Recovery**: user must clear old logs or browser data.

## Theme Configuration

### Auto-theme Detection

Implemented in [src/lib/utils.ts](../../src/lib/utils.ts):

```typescript
export function autoSetTheme(): void {
  const theme = document.documentElement.getAttribute('data-bs-theme') ?? 'light';
  if (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-bs-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-bs-theme', theme);
  }
}
```

Called once per page (`App`/`ConfigApp`) inside a `useEffect` on mount. Behavior is unchanged from the earlier vanilla-JS implementation.

## Multilingual Support

### Language Detection

Implemented in [src/i18n/index.ts](../../src/i18n/index.ts):

```typescript
const detectedLang = (() => {
  const lang = (navigator.languages?.[0] ?? navigator.language ?? 'en').slice(0, 2);
  return lang in { en: 1, ja: 1 } ? lang : 'en';
})();
```

**Supported Languages**: Japanese (`ja`), English (`en`, fallback).

### Translation System

`i18next` + `react-i18next` are initialized once, in `main.tsx`, before any component renders — there is no longer a separate "early init script in `<head>`" step, since React's render cycle itself avoids the translation-flash problem that motivated that pattern in the vanilla-JS version (see `docs/design.md` §6.1).

Components call `const { t } = useTranslation()` and reference keys via `t('key_name')`. Non-component modules (`download.ts`) import the configured `i18next` instance directly. There is no `data-translate` HTML attribute system anymore — translation is expressed through JSX.

## Migration & Versioning

Unlike the earlier version of this document, **migration logic now exists**. `App.tsx`'s `runMigrations()` reads `migration_version` from IndexedDB and, if it is below `1`:

1. Calls `migrateFromLocalStorage([...])` (see [`database.md`](database.md)) to move the legacy `localStorage` keys (`log`, `rounding_mins`, `date-roll-over-time`, `shortcut_1`–`9`) into IndexedDB.
2. Migrates the old `date-roll-over-time-value` key, if present, into the current `date-roll-over-time` key.
3. Removes stray legacy keys (`downloadUrl`, `downloadFilename`) left over from the old `localStorage`-based download hand-off.
4. Sets `migration_version` to `'1'`, so this block only runs once per browser profile.

**Future Consideration**: if the IndexedDB schema needs another breaking change, bump the check to `version < 2` and add the new migration step, following the same pattern.

## Best Practices (unchanged from the earlier version)

### Data Integrity
1. Always validate values before applying (e.g., `getRoundingUnit()`)
2. Handle `undefined` and the string `'undefined'` (a leftover possibility from the `localStorage` era; `getItem()` in `storage.ts` already normalizes missing keys to `null`)
3. Trim user input before saving
4. Provide sensible defaults when a key is unset

### Performance
1. Debounce writes to the per-day `localStorage` buffer (300ms) rather than writing to IndexedDB on every keystroke
2. Only update UI state when values actually change

### User Experience
1. Auto-save on blur/change — no manual save button needed
2. Cross-tab synchronization via `BroadcastChannel` for consistency
3. Visual feedback for save status (main app only)
