---
name: analyzed-utilities
description: Inventory of exported helper functions/classes in src/lib/ (storage.ts, utils.ts, download.ts) and src/i18n/index.ts.
type: analysis
commit-hash: ceff98ab997a60d35e564821f2e6bf7b6c284128
---

# Utilities Inventory (src/lib/, src/i18n/)

This covers the current React + TypeScript codebase. The old `js/lib/*.js` vanilla-JS helper layer (`utils.js`, `download.js`, `multilingualization.js`, `indolence.min.js`) no longer exists at HEAD.

Files inventoried:
- `src/lib/utils.ts`
- `src/lib/storage.ts` (deep dive lives in `databases.md`; only signatures listed here)
- `src/lib/download.ts`
- `src/i18n/index.ts`

## src/lib/utils.ts

Date/time string helpers, HTML escaping, and theme auto-switching. All functions are pure except `installPWA` and `autoSetTheme`, which touch the DOM/`window`.

### Constants

- `LOG_DATA_KEY = 'log'` — KVS key for the raw log text.
- `ROUNDING_UNIT_MINUTE_KEY = 'rounding_mins'` — KVS key for the rounding unit (minutes).

### Functions

#### `getTodayString(): string`
> "Get the current date as a string."

Returns today's date as `'YYYY-MM-DD'`, built from `new Date()` with manual zero-padding (not `toISOString()`, so it uses the local timezone rather than UTC). No side effects.

#### `fetchHourFromTime(time?: string | null, isInt?: true): number` (overload) / `fetchHourFromTime(time: string | null, isInt: false): string`
> "Get the hour from a date and time."

- `time`: a string starting with `'YYYY-MM-DD HH:MM'` (or longer), or `null`/omitted for the current time.
- `isInt`: `true` (default) returns a `number`; `false` returns a zero-padded string.
- Implementation extracts `time.slice(11, 13)` directly rather than parsing via `new Date(time)` — comment notes this avoids "Invalid Date" issues in Safari for the app's custom, non-ISO log-line format.
- No side effects (reads `new Date()` only when `time` is `null`).

#### `fetchMinFromTime(time?: string | null, isInt?: true): number` (overload) / `fetchMinFromTime(time: string | null, isInt: false): string`
> "Get minutes from a date and time."

Same shape and rationale as `fetchHourFromTime`, extracting `time.slice(14, 16)`. No side effects.

#### `getRoundingUnit(value: number | string | null): number`
> "Get a valid rounding unit time."

Whitelists the input against `1, 5, 10, 15, 30, 60` (via `Number(value)` + `switch`); any other value (including `null`, non-numeric strings, or out-of-range numbers) falls back to `1`. Pure function; used to sanitize a value coming out of storage before use as a divisor.

#### `appendTime(tag: string, date?: string): string`
> "Add a timestamp prefix to a work tag."

Returns `'YYYY-MM-DD HH:MM' + tag`, where the date defaults to `getTodayString()` and the time is always the *current* wall-clock time (via `fetchHourFromTime(null, false)` / `fetchMinFromTime(null, false)`) — the `date` parameter only overrides the date portion, not the time. This is the write-side counterpart of the log line format that `download.ts`'s `parse()` reads.

#### `trimNewLine(text: string): string`
> "Remove duplicate and leading/trailing newlines from log text."

Collapses runs of 2+ `\n` into a single `\n`, then strips one leading and/or trailing `\n`. Pure string function.

#### `escapeHtml(unsafe: string): string`
> "Escape HTML special characters."

Escapes exactly 5 characters via sequential `.replace()` calls, in this order: `&`→`&amp;`, `<`→`&lt;`, `>`→`&gt;`, `"`→`&quot;`, `'`→`&#039;`. This is the project's sole XSS-mitigation primitive (equivalent to the legacy vanilla-JS `escapeHtml()`). See "escapeHtml usage audit" below and `security.md` for the full security review — this section is inventory-only.

#### `installPWA(elem: HTMLElement & { promptEvent?: BeforeInstallPromptEvent }): void`
> "Wire up the PWA install button with the beforeinstallprompt event."

Side effects: registers a `window` `beforeinstallprompt` listener that stashes the event on `elem.promptEvent` and shows `elem` (removes `d-none`); registers a `click` listener on `elem` that calls `promptEvent.prompt()` and, once `userChoice` resolves, re-hides `elem` and clears `promptEvent`. No storage writes.

#### `autoSetTheme(): void`
> "Apply Bootstrap theme based on prefers-color-scheme when data-bs-theme='auto'."

Side effect: reads `document.documentElement`'s `data-bs-theme` attribute (default `'light'`); if it is `'auto'` and `matchMedia('(prefers-color-scheme: dark)')` matches, sets the attribute to `'dark'`, otherwise re-sets it to the existing value. No storage writes; DOM mutation only.

### Local type

`BeforeInstallPromptEvent` — an `interface extends Event` with `prompt(): void` and `userChoice: Promise<{ outcome: string }>`, used only to type-narrow the native `beforeinstallprompt` event inside `installPWA`.

## src/lib/storage.ts

idb-based key-value store wrapper. Full architectural discussion (schema, versioning, migration strategy) belongs in `databases.md`; only signatures are listed here.

- `DB_NAME = 'fast-logbook-pwa'`, `STORE_NAME = 'kv'`, `DB_VERSION = 1` (module-level, not exported).
- A module-level `dbPromise = openDB(DB_NAME, DB_VERSION, { upgrade })` opens the database once at import time and creates the `'kv'` object store if absent.

#### `getItem(key: string): Promise<string | null>`
> "Retrieve a value by key."

Reads from the `'kv'` object store; normalizes IndexedDB's `undefined` (key not found) to `null`. Side effect: IndexedDB read.

#### `setItem(key: string, value: string): Promise<void>`
> "Store a value under the given key."

Side effect: IndexedDB write (`put`) into the `'kv'` store.

#### `removeItem(key: string): Promise<void>`
> "Remove the entry for the given key."

Side effect: IndexedDB delete from the `'kv'` store.

#### `migrateFromLocalStorage(keys: string[]): Promise<void>`
> "One-time migration from localStorage to IndexedDB."

For each key: if `localStorage.getItem(key)` is neither `null` nor the literal string `'undefined'`, copies it into IndexedDB via `setItem` and then removes it from `localStorage`. Side effects: reads/deletes from `localStorage`, writes to IndexedDB. This is the only place in the current codebase that still touches `localStorage` directly — matches the `security.md` guidance about `localStorage` returning `null` or the string `'undefined'`.

## src/lib/download.ts

Core log-format processing: parsing raw log text into per-category aggregates, rendering HTML/Markdown summaries, and building the standalone downloadable HTML viewer page.

### Module state

`_downloadUrl: string | null` and `_downloadFilename: string | null` — module-scoped mutable variables (comment: "lifecycle is synchronous (set → dispatch → get → clear)"), used to pass data from `download()` to the `startDownload` event listener registered in the same module.

### Functions

#### `download(outputDataString: string, extension = 'html', mimeType = 'text/html'): void`

Builds a `Blob` from `outputDataString`, creates an object URL via `URL.createObjectURL`, and builds a filename `` `${i18next.t('app_name')}_${getTodayString()}.${extension}` ``. Stores both in the module-level `_downloadUrl`/`_downloadFilename` variables, then dispatches a `window` `CustomEvent('startDownload')`. Side effects: creates a Blob/object URL, dispatches a DOM event, mutates module state. Does not itself trigger the browser download.

A `window.addEventListener('startDownload', …)` registered at module load time is what actually performs the download: it creates a temporary `<a>` element with `href`/`download` set from the stashed URL/filename, appends it to `document.body`, calls `.click()`, removes it, and calls `URL.revokeObjectURL(url)`, then clears the module state. Side effects: DOM mutation, triggers a file save, revokes the object URL.

#### `parse(text: string, mins: number): Record<string, ParsedCategory>`
> "Parse raw log text into a category-wise summary."

Local constants: `TIME_LENGTH = 16`, `FIELD_SEPARATOR = ';'`, `RECORD_SEPARATOR = '\n'` — this is the canonical definition of the log line format `YYYY-MM-DD HH:MM<Category>;<Detail>` referenced in `.claude/rules/code-style.md`.

Algorithm:
1. Split `text` on `'\n'`.
2. For each line: `time = line.slice(0, 16)` (the fixed-width timestamp); find the first `';'` (`junction`); `category = line.slice(16, junction)` (or `line.slice(16)` if no `';'` present); `detail = line.slice(junction + 1)` (or `''` if no `';'`).
3. Collect `{ time, category }` pairs in order (`timeStamp` array), and build `detailLists[category]` (array of detail strings, may contain duplicates) plus initialize `times[category] = 0`.
4. For each adjacent pair of entries `i-1, i`: compute the elapsed hour/minute delta between `timeStamp[i-1].time` and `timeStamp[i].time` (handling hour/minute rollover, e.g. negative minutes borrow an hour, negative hours wrap by +24). Add the elapsed minutes to `times[timeStamp[i-1].category]` — i.e., the duration is attributed to the *earlier* entry's category (the "work done until the next log line" model). **The very last log line's category gets no duration added** (no following line to diff against).
5. Build the result: for each category, `{ time (minutes, number), detail: Array.from(new Set(detailLists[item])).join(', ') (deduplicated, comma-joined), round: Math.floor(time/60) + Number(((Math.round((time%60)/mins)*mins)/60).toFixed(2)) (fractional-hour value rounded to the nearest `mins`-minute unit) }`.

**Verified: the `^` "work-time-exclusion" prefix is NOT handled inside `parse()` at all.** `parse()` treats a category starting with `^` exactly like any other category string — it appears verbatim as an object key in the returned `Record`, with its `time`/`detail`/`round` computed identically. The exclusion logic lives entirely in the callers (`toHtml`/`toMarkdown`, see below).

No side effects; pure function. Note: `parse()` does not call `escapeHtml()` on `category` or `detail` — escaping (where it happens) is the caller's responsibility.

`ParsedCategory` (local, non-exported interface): `{ time: number; detail: string; round: number }`.

#### `toHtml(log: string, mins: number): string`
> "Convert log summary to an HTML table string."

Calls `parse(log, mins)`, then builds an HTML `<table>` (Bootstrap classes) with one row per category (sorted alphabetically via `Object.keys(dataJson).sort()`). Each row applies `escapeHtml()` to both `category` and `dataJson[category].detail`, falling back to `'-'` / `' '` respectively when the escaped value is falsy (i.e., empty string). `round`/`time` numeric columns are inserted unescaped (safe, numeric).

**`^` exclusion logic (confirmed, lives here, not in `parse()`):** `const breakMark = '^'`; inside the per-category loop, `total` always accumulates every category's `time`, but `sum` only accumulates it `if (category[0] !== breakMark)`. Two summary lines are appended: "actual work time" (`sum`, `^`-excluded) and "total time" (`total`, includes everything), each converted to a rounded-hours string via the same `Math.floor(...) + Math.round(...)` formula as `parse()`'s `round` field.

Uses `i18next.t()` for all labels (table headers, summary labels). Pure function (no side effects; DOM/storage untouched).

#### `toMarkdown(log: string, mins: number): string`
> "Convert log summary to a Markdown table string."

Same structure as `toHtml` (calls `parse()`, sorts categories, same `breakMark`/`sum`/`total` split, same rounded-hours formula, `i18next.t()` labels) but emits a Markdown pipe-table instead of HTML.

**Verified: `escapeHtml()` is NOT called on `category` or `dataJson[category].detail` inside `toMarkdown()`** — both are interpolated into the output string raw (line: `` `${category} | ${dataJson[category].detail} | ...` ``). This confirms the prior finding. Whether this is an actual XSS risk depends entirely on how `toMarkdown()`'s output is later consumed by callers — that determination is out of scope for this inventory (see `security.md`). Flagged here only as: **Unconfirmed** whether any current caller renders this Markdown as HTML without independent escaping. `generateFormattedLog()` (below) embeds the Markdown output inside an already-escaped `<pre><code>` block, which neutralizes this specific path, but that is one specific caller, not a guarantee for all future callers of `toMarkdown()`.

Speculative suggestion: apply `escapeHtml()` to `category`/`detail` inside `toMarkdown()` for defense-in-depth consistency with `toHtml()`, even though the current sole caller re-escapes downstream. Rating: ⭐️⭐️ (low priority — no demonstrated exploitable path today, but cheap to add and removes a latent trap for future callers).

#### `generateFormattedLog(log: string, mins: number): string`
> "Generate the full HTML page for the formatted log viewer."

Builds three sections — `HTML_SUMMARY` (`toHtml()` output, rendered as raw HTML), `PLAINTEXT_LOG` (the raw `log` string, rendered inside `<pre><code>`), `MARKDOWN_SUMMARY` (`toMarkdown()` output, also rendered inside `<pre><code>`) — and assembles a full standalone HTML document (CDN-loaded Bootstrap JS/CSS with SRI `integrity` attributes, Font Awesome with SRI) with a small inline `<script>` that wires up copy-to-clipboard buttons via the Clipboard API.

**Verified: for the two `isCode: true` sections (`PLAINTEXT_LOG`, `MARKDOWN_SUMMARY`), `section.content` is passed through `escapeHtml()`** before being embedded in `<pre><code>...</code></pre>` (`` `<pre><code id='...'>${escapeHtml(section.content)}</code></pre>` ``). This is what neutralizes `toMarkdown()`'s own lack of internal escaping, for this specific call path — the raw Markdown string is HTML-escaped as a whole, as one blob, by `generateFormattedLog`, not by `toMarkdown()` itself.

For `HTML_SUMMARY` (`isCode: false`/omitted), `section.content` (the `toHtml()` output) is embedded **without** an additional `escapeHtml()` pass — this is correct/expected, since `toHtml()` already escapes per-field internally and the section content is meant to render as actual HTML markup, not as escaped text.

Pure function; builds a string only. Does not call `download()` or touch storage.

#### `downloadLog(log: string | null = null): Promise<void>`

Async orchestrator: reads `log` from the parameter, or falls back to `await getItem(LOG_DATA_KEY)`, or `''` if both are absent. Reads the rounding unit via `await getItem(ROUNDING_UNIT_MINUTE_KEY)`, coercing to `Number` and falling back to `1` if not a positive number (note: unlike `utils.ts`'s `getRoundingUnit()`, this does not validate against the fixed `{1,5,10,15,30,60}` whitelist — any positive number is accepted). Calls `generateFormattedLog()` then `download()`. Side effects: IndexedDB reads (via `getItem`), and (transitively, through `download()`) Blob/object-URL creation and a `startDownload` event dispatch.

## src/i18n/index.ts

i18next setup/initialization for React (`react-i18next`).

- `detectedLang` (module-level const, not exported): derived from `navigator.languages?.[0] ?? navigator.language ?? 'en'`, sliced to its first 2 characters, and checked against a `{ en: 1, ja: 1 }` set literal — falls back to `'en'` if the detected language isn't supported.
- Module-level side effect: `i18next.use(initReactI18next).init({...})` is called at import time, configuring `resources: { en, ja }` (loaded from `./locales/en.json` / `./locales/ja.json`), `lng: detectedLang`, `fallbackLng: 'en'`, and `interpolation: { escapeValue: false }` (React already escapes interpolated values, so i18next's own escaping is disabled — standard `react-i18next` practice, not itself a vulnerability given React's JSX escaping, but would matter if `i18next.t()` output were ever inserted via `dangerouslySetInnerHTML` or a raw string template like the ones in `download.ts`. `download.ts` uses `i18next.t()` output for fixed UI labels only, not user-controlled data, so this is low risk. Unconfirmed/out of scope: whether any current or future translation string could itself be attacker-influenced.).
- `export default i18next;` — the configured singleton instance, documented as "Supports `en` and `ja`; falls back to `en`."

No storage side effects (this module doesn't read/write `localStorage` or IndexedDB).

## Log format reference (canonical, from `download.ts::parse()`)

Format: `YYYY-MM-DD HH:MM<Category>;<Detail>`

- Timestamp: fixed-width, exactly the first 16 characters of each line (`TIME_LENGTH = 16`); no explicit format validation is performed — `parse()` simply slices the first 16 characters regardless of their actual content.
- Field separator: first `';'` in the line, splits `<Category>` from `<Detail>`. If no `';'` is present, the entire remainder after the timestamp is treated as `<Category>` and `<Detail>` is `''`.
- Record separator: `'\n'`.
- `^` prefix: a category whose first character is `'^'` marks that category as excluded from the "actual work time" (`sum`) aggregate in both `toHtml()` and `toMarkdown()`, but is still included in the "total time" (`total`) aggregate. **This exclusion is applied only by the two rendering functions, not by `parse()` itself** — `parse()`'s returned `Record` includes `^`-prefixed categories with fully computed `time`/`detail`/`round` values, indistinguishable in structure from any other category.
- Duration attribution model: the time between consecutive log lines is attributed to the *earlier* line's category (i.e., each line marks "I started category X now," and the duration of X runs until the next line is logged). The final line in the log never accrues duration on its own, since there is no subsequent line to diff against.

<!-- commit-hash: ceff98ab997a60d35e564821f2e6bf7b6c284128 -->
