# Utility Functions & Libraries

> Rewritten for `src/lib/*.ts` (TypeScript). The vanilla-JS modules this document used to describe (`js/lib/analytics.js`, `js/lib/multilingualization.js`, `js/lib/indolence.min.js`) no longer exist.

## Module Overview

The application uses three library modules in [src/lib/](../../src/lib/), plus the i18n setup in [src/i18n/](../../src/i18n/):

1. **utils.ts**: Date/time helpers, storage key constants, HTML escaping, PWA install wiring, theme management
2. **storage.ts**: IndexedDB key-value wrapper (via `idb`) + one-time `localStorage` migration
3. **download.ts**: Log parsing, time calculation, and formatted-log export (HTML/Markdown/plaintext)
4. **i18n/index.ts**: i18next + react-i18next initialization

There is no longer an analytics module (GA4 tracking was removed — see `docs/ADR.md` ADR-005), no `Multilingualization` class (replaced by i18next — ADR-013), and no `indolence.min.js` DOM helpers (React owns the DOM via JSX/refs).

---

## 1. `storage.ts`

File: [src/lib/storage.ts](../../src/lib/storage.ts)

### Setup

```typescript
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
```

A single IndexedDB database (`fast-logbook-pwa`) with one object store (`kv`), opened once via `idb`'s `openDB()` and memoized in `dbPromise`.

### `getItem(key)`

```typescript
export async function getItem(key: string): Promise<string | null>
```
Returns the stored string, or `null` if not present. (Coalesces `idb`'s `undefined` to `null`.)

### `setItem(key, value)`

```typescript
export async function setItem(key: string, value: string): Promise<void>
```
Stores `value` under `key`. Callers should catch `DOMException` named `QuotaExceededError` (see [`configuration.md`](configuration.md)).

### `removeItem(key)`

```typescript
export async function removeItem(key: string): Promise<void>
```
Deletes the entry for `key`.

### `migrateFromLocalStorage(keys)`

```typescript
export async function migrateFromLocalStorage(keys: string[]): Promise<void>
```
For each key: if `localStorage.getItem(key)` is non-null and not the string `'undefined'`, copies it into IndexedDB via `setItem()` and removes it from `localStorage`. Called once, gated by `migration_version`, from `App.tsx`'s `runMigrations()` (see [`configuration.md`](configuration.md) "Migration & Versioning").

---

## 2. `utils.ts`

File: [src/lib/utils.ts](../../src/lib/utils.ts)

### Constants

```typescript
export const LOG_DATA_KEY = 'log';
export const ROUNDING_UNIT_MINUTE_KEY = 'rounding_mins';
```

### Date/Time Functions

#### `getTodayString()`
```typescript
export function getTodayString(): string
```
Returns the current date as `'YYYY-MM-DD'`.

#### `fetchHourFromTime(time?, isInt?)`
```typescript
export function fetchHourFromTime(time?: string | null, isInt?: true): number;
export function fetchHourFromTime(time: string | null, isInt: false): string;
```
Extracts the hour from a `'YYYY-MM-DD HH:MM...'` string via `slice(11, 13)` (current time if `time` is omitted/`null`), to avoid `Invalid Date` issues in Safari when constructing a `Date` object just to read the hour. Overloaded: returns a `number` by default, or a zero-padded `string` when `isInt` is `false`.

#### `fetchMinFromTime(time?, isInt?)`
Same pattern as `fetchHourFromTime`, extracting minutes via `slice(14, 16)`.

#### `appendTime(tag, date?)`
```typescript
export function appendTime(tag: string, date?: string): string
```
Returns `'YYYY-MM-DD HH:MM' + tag`, using `date` if given, otherwise today's date and the current time. Used whenever a shortcut or free-form entry is committed to the log.

### Validation

#### `getRoundingUnit(value)`
```typescript
export function getRoundingUnit(value: number | string | null): number
```
Returns the value if it is one of `1, 5, 10, 15, 30, 60`; otherwise `1`.

### String Manipulation

#### `trimNewLine(text)`
```typescript
export function trimNewLine(text: string): string
```
Collapses runs of `\n` into a single `\n` and strips a leading/trailing newline.

#### `escapeHtml(unsafe)`
```typescript
export function escapeHtml(unsafe: string): string
```
Escapes `&`, `<`, `>`, `"`, `'`. Used in `download.ts` when interpolating log content into the exported HTML (the live React UI relies on JSX's default escaping instead).

### PWA Install

#### `installPWA(elem)`
```typescript
export function installPWA(elem: HTMLElement & { promptEvent?: BeforeInstallPromptEvent }): void
```
A standalone alternative to the `useRef`-based install flow in `App.tsx` (see [`components.md`](components.md)) — wires `beforeinstallprompt` capture and click-to-prompt behavior onto a plain DOM element. (`App.tsx` currently implements this inline rather than calling this function; the two should be kept consistent if either changes.)

### Theme

#### `autoSetTheme()`
```typescript
export function autoSetTheme(): void
```
Reads `data-bs-theme` off `<html>`; if `'auto'`, applies `'dark'`/`'light'` based on `(prefers-color-scheme: dark)`.

### Ambient Types

`BeforeInstallPromptEvent` is declared locally in `utils.ts` (and again, identically, in [src/globals.d.ts](../../src/globals.d.ts)) since it is not part of the standard DOM typings:

```typescript
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
```

---

## 3. `download.ts`

File: [src/lib/download.ts](../../src/lib/download.ts)

### Constants

```typescript
const HTML_SUMMARY = 'html_summary';
const PLAINTEXT_LOG = 'plaintext_log';
const MARKDOWN_SUMMARY = 'markdown_summary';
```
Section identifiers for the formatted-log output.

### `download(outputDataString, extension?, mimeType?)`

```typescript
export function download(outputDataString: string, extension = 'html', mimeType = 'text/html'): void
```

1. Creates a `Blob` and an object URL.
2. Builds the filename: `` `${i18next.t('app_name')}_${getTodayString()}.${extension}` ``.
3. Stores the URL/filename in **module-level variables** (`_downloadUrl`, `_downloadFilename`) — not `localStorage` as in the vanilla-JS version (see `docs/ADR.md` ADR-010 for why this changed).
4. Dispatches a `startDownload` `CustomEvent` on `window`.

A `window.addEventListener('startDownload', ...)` registered once at module load reads the module variables, creates and clicks a temporary `<a download>`, then calls `URL.revokeObjectURL()` and clears the variables.

### `parse(text, mins)`

```typescript
export function parse(text: string, mins: number): Record<string, ParsedCategory>
```

```typescript
interface ParsedCategory {
  time: number;   // total minutes
  detail: string; // de-duplicated, comma-joined details
  round: number;  // time rounded to `mins`
}
```

Splits `text` on `\n`; for each line, extracts the 16-character timestamp prefix, the category (up to `;` or end of line), and the detail (after `;`). Computes the time delta between consecutive entries (handling midnight rollover by adding 24h when the delta is negative) and attributes it to the **earlier** entry's category.

### `toHtml(log, mins)` / `toMarkdown(log, mins)`

```typescript
export function toHtml(log: string, mins: number): string
export function toMarkdown(log: string, mins: number): string
```

Both call `parse()` and render a sorted-by-category table (HTML `<table>` or a Markdown pipe-table), plus two summary lines: **actual** work time (categories not starting with `^`) and **total** time (all categories, including `^`-prefixed ones).

### `generateFormattedLog(log, mins)`

```typescript
export function generateFormattedLog(log: string, mins: number): string
```

Builds a complete, self-contained HTML document with three sections (HTML summary table, plaintext log, Markdown summary), each with a clipboard-copy affordance. Loads **Bootstrap and Font Awesome from a CDN with SRI `integrity` attributes** — deliberately not bundled by Vite, since this output is a standalone artifact meant to be opened independently of the app (see `docs/design.md` §5.2).

### `downloadLog(log?)`

```typescript
export async function downloadLog(log: string | null = null): Promise<void>
```

If `log` is omitted, reads the full log from IndexedDB (`getItem(LOG_DATA_KEY)`). Reads the rounding unit, calls `generateFormattedLog()`, then `download()`. Used by `App.tsx`'s "Download formatted log" menu action.

---

## 4. `i18n/index.ts`

File: [src/i18n/index.ts](../../src/i18n/index.ts)

```typescript
i18next.use(initReactI18next).init({
  resources: { en: { translation: en }, ja: { translation: ja } },
  lng: detectedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});
```

- `detectedLang` is computed from `navigator.languages`/`navigator.language`, restricted to `'en'`/`'ja'`.
- `interpolation.escapeValue: false` — React already escapes interpolated values when rendering JSX, so i18next doesn't need to double-escape. (`download.ts`'s use of `i18next.t()` outside of JSX doesn't interpolate untrusted values, so this is safe there too.)
- Translation resources live in [src/i18n/locales/en.json](../../src/i18n/locales/en.json) and [ja.json](../../src/i18n/locales/ja.json) (133 keys each, as of this writing) rather than being embedded in a JS object.

---

## Usage Patterns

### Date/Time Workflow

```typescript
const tag = 'Project A;Meeting';
const entry = appendTime(tag, targetDateRef.current); // '2025-12-13 09:15Project A;Meeting'
appendLog(entry); // appends to the textarea + saves
```

### Log Formatting Workflow

```typescript
const log = await getItem(LOG_DATA_KEY);
const mins = Number(await getItem(ROUNDING_UNIT_MINUTE_KEY)) || 1;

const parsed = parse(log, mins);          // { 'Project A': { time: 90, round: 1.5, detail: 'Meeting' }, ... }
const htmlTable = toHtml(log, mins);
const markdown = toMarkdown(log, mins);
const fullDoc = generateFormattedLog(log, mins);
```

### `'undefined'` String Guard

A leftover convention from the `localStorage` era — `localStorage.setItem(key, undefined)` stores the literal string `"undefined"`. `storage.ts`'s `getItem()` doesn't need this guard (it returns `null` cleanly), but `App.tsx`/`ConfigApp.tsx` still defensively check `str && str !== 'undefined'` in a few places where data may have come through the migration path.

## Testing

[tests/e2e/screenshot.spec.ts](../../tests/e2e/screenshot.spec.ts) (Playwright) captures screenshots across the `mobile`/`tablet`/`fhd` viewport projects defined in `playwright.config.ts`. There is currently no unit-test framework (e.g. Vitest) configured for `src/lib/*.ts` — see [`known_bugs.md`](known_bugs.md) / [`todo.md`](todo.md) for recommended coverage (date/time edge cases, `parse()` midnight-crossing, rounding precision, HTML/Markdown formatting).
