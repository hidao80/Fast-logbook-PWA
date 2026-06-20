# Known Issues & Limitations

> Rewritten for the React + TypeScript + Vite + IndexedDB codebase. Many issues tracked against the old vanilla-JS implementation (`js/`, `sw.js`) were resolved as a side effect of the rewrite; those are marked **RESOLVED BY REWRITE** below rather than removed outright, so the history is traceable. New issues found while reviewing the current `src/` tree are added under "Current Known Issues".

## Current Known Issues

### 1. Version-string mismatch between `package.json` and the PWA manifest

**Location**: `package.json` (`"version": "26.02.19"`) vs. `vite.config.js`'s `VitePWA({ manifest: { version: '26.06.13' } })`

**Issue**: The two version strings have drifted apart. `App.tsx`/`ConfigApp.tsx` both fetch `/manifest.json` at runtime to display "the app version" to the user, so the UI shows the (stale) `vite.config.js` value, not `package.json`'s.

**Impact**: Low (cosmetic) — but confusing for support/debugging ("what version am I running?").

**Recommendation**: Generate one from the other at build time (e.g. read `package.json`'s version into `vite.config.js` via Node's `fs`/`import`).

---

### 2. No production console suppression

**Issue**: The vanilla-JS version called `$$disableConsole()` (from `indolence.min.js`) during initialization to suppress `console.*` output outside `localhost`. That utility was removed along with the rest of `js/lib/` during the React rewrite, and no equivalent was added.

**Impact**: Low — `console.log`/`console.error` calls (if any are added later) would be visible in production builds.

**Recommendation**: Reintroduce via a Vite build option (e.g. stripping `console.*` calls in production) rather than a runtime DOM utility.

---

### 3. No Content Security Policy

**Issue**: Same gap as the vanilla-JS version — no CSP header is configured (Netlify, Nginx, or otherwise).

**Impact**: Medium — weaker defense-in-depth against injection.

**Note**: Now that Bootstrap/Bootstrap Icons are bundled via npm rather than CDN-loaded for the app shell, a CSP for the **app shell** would actually be simpler to write today (`script-src 'self'` would mostly suffice). The CDN dependency now only exists in the **exported HTML artifact** (`generateFormattedLog()`), which is opened as a standalone file outside this app's origin and isn't covered by this app's CSP regardless.

**Recommendation**: Add a `script-src 'self'` (and similarly scoped `style-src`) CSP header via Netlify headers / Nginx config.

---

### 4. `localStorage` per-day buffer vs. IndexedDB full log reconciliation window

**Location**: [src/App.tsx](../../src/App.tsx) — `flushBuffer()`

**Issue**: Active-day edits are debounce-saved into `localStorage` (`log_buffer`/`log_buffer_date`) and only merged into the IndexedDB `log` key on tab-hide, date change, or load. A crash or forced-quit between a debounced `localStorage` write and the next flush could theoretically leave edits stuck in the buffer rather than in the canonical log.

**Impact**: Low — `flushBuffer()` runs defensively on `visibilitychange`, date change, and initial load, minimizing the window; data isn't lost outright (it's still in `localStorage`), just not yet merged.

**Recommendation**: Consider also flushing on `beforeunload`, or shortening the debounce further if this proves to matter in practice.

---

### 5. Basic HTML escaping in exported logs

**Location**: [src/lib/utils.ts](../../src/lib/utils.ts) `escapeHtml()`, used in [src/lib/download.ts](../../src/lib/download.ts)

**Issue**: `escapeHtml()` is a basic five-character escaper (`&`, `<`, `>`, `"`, `'`), not a full HTML sanitizer.

**Impact**: Low — the user is the only source of the input, and the exported HTML's inline script is minimal and never `eval`s user data. A user could only "attack" their own exported file.

**Severity**: Low (by design, same risk profile as the vanilla-JS version).

---

### 6. No automated unit tests for `src/lib/*.ts`

**Issue**: Playwright E2E coverage exists ([tests/e2e/screenshot.spec.ts](../../tests/e2e/screenshot.spec.ts)), but there is no unit-test framework (e.g. Vitest) configured for the pure-logic modules (`parse()`, `getRoundingUnit()`, date/time helpers, etc. in `src/lib/`).

**Impact**: Medium — regression risk on logic changes (e.g. midnight-crossing time calculation, rounding precision) isn't caught until manual or E2E testing.

**Recommendation**: Add Vitest with focused unit tests for `src/lib/utils.ts` and `src/lib/download.ts`'s `parse()`/`toHtml()`/`toMarkdown()`.

---

## Resolved By the React/TypeScript/Vite Rewrite

The items below were tracked against the earlier vanilla-JS codebase and are no longer applicable; kept here for historical traceability (see `docs/ADR.md` for the corresponding decisions).

### IME Composition Handling — **FIXED** (predates the rewrite, carried forward)
The Enter-key/IME-composition logic (`!e.isComposing && e.keyCode !== 229 && e.key === 'Enter'`) was already fixed in the vanilla-JS version and is preserved as-is in `App.tsx`'s `handleInputKeydown`/`handleTextareaKeydown`.

### Storage Quota Exceeded — Japanese-only error message — **RESOLVED**
`storage_quota_exceeded` is now a proper i18next key (`src/i18n/locales/en.json` and `ja.json`), referenced via `t('storage_quota_exceeded')`. See [`configuration.md`](configuration.md).

### Service Worker Cache Name Race Condition — **RESOLVED BY REWRITE**
The hand-written `sw.js` that fetched `manifest.json` asynchronously to compute `CACHE_NAME` no longer exists. `vite-plugin-pwa`/Workbox generates the service worker and its cache-busting/versioning logic at build time — there is no runtime race to have.

### Hard-coded `'my-cache'` Key in the Fetch Handler — **RESOLVED BY REWRITE**
Same as above — the hand-written fetch handler with this bug no longer exists; Workbox manages its own cache naming.

### `analytics.js` Not in the Service Worker Asset List — **RESOLVED BY REWRITE (module removed)**
The GA4 analytics module was removed entirely (see `docs/ADR.md` ADR-005), so this is moot — there is no analytics script to cache or omit.

### No Build Process — **RESOLVED (now mandatory, see entry below for the trade-off)**
A Vite production build is now required (see `docs/design.md` §2.2). This previously-noted "limitation" (no minification/bundling) is resolved, at the cost of "zero-build" no longer being possible — opening `index.html` directly no longer runs the app.

### ES Module Import of Bootstrap from a CDN — **RESOLVED BY REWRITE**
Bootstrap/Bootstrap Icons are now npm dependencies bundled by Vite for the app shell. (CDN + SRI is still used, intentionally, inside the *exported* HTML artifact only — see [`utilities.md`](utilities.md).)

### No Multi-day Log Separation — **PARTIALLY RESOLVED**
The per-day view with date roll-over (`docs/design.md` §4.4) now scopes the textarea to one logical day at a time. Export still bundles the *entire* log, however — date-range-filtered export is still open (see `todo.md`).

---

## Still Open (carried forward, unchanged by the rewrite)

These limitations were already documented before the rewrite and remain true today. See `todo.md` for proposed implementations.

- **No undo functionality** for log deletion or edits (accidental deletion of the active day's content is permanent unless backed up via export).
- **No search or filter capability** for large logs.
- **No data export format selection** — always exports all three formats (HTML, plaintext, Markdown) in one file.
- **No log compression** — logs stored as plain text.
- **No data encryption** — IndexedDB data is stored unencrypted (by design; app not intended for highly sensitive data).
- **No PWA installation instructions for iOS** — the install button only appears where `beforeinstallprompt` fires (Chromium-based browsers); iOS Safari users get no guided alternative.
- **No import functionality** to re-import a previously exported HTML file.
- **Limited keyboard shortcuts** — only number keys (0-9) are bound; no remapping UI.
- **Color-only save-status indicator** — the save dot relies on color alone (green/red), with no icon/text fallback for color-blind users.
- **No screen-reader announcements** for save-status changes.

## Platform-Specific Limitations (unchanged)

- **PWA installation availability**: `beforeinstallprompt` is unsupported on iOS Safari, desktop Safari, and has limited support in Firefox.
- **Service Worker limitations on iOS**: more aggressive cache eviction, limited background sync — inherent to the platform, not specific to this app's implementation.
- **Storage quota variations**: IndexedDB quotas are generally larger and more headroom-friendly than the old `localStorage` 5-10MB limits, but still vary by browser and available disk space.

## Browser Compatibility (unchanged)

- **Speculation Rules API**: progressive enhancement, Chrome/Edge 108+ only; silently ignored elsewhere.
