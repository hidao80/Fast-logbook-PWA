---
name: analyzed-known_bugs
description: Known bugs, architectural/design issues, compatibility issues, and analysis limitations for Fast-logbook-PWA
type: analysis
commit-hash: e021877bb892db6cc019f4e0520449119de3c079
---

# Known Bugs & Design Issues

- [Security issues](#security-issues)
- [Architectural / design issues](#architectural--design-issues)
- [Compatibility issues](#compatibility-issues)
- [Analysis limitations](#analysis-limitations)

All findings below were independently re-verified against commit `e021877bb892db6cc019f4e0520449119de3c079` (`develop` branch) by running `git`, `pnpm build`, and reading source directly. No source files were modified as part of this analysis.

## Architectural / design issues

### 1. ~~Committed HEAD has no valid application entry point~~ — RESOLVED as of commit `e021877`

**Status: Fixed** — **Severity when open: Critical**

This was previously documented as a Critical bug: root `index.html` had been deleted at commit `ceff98a` with no replacement committed, so a clean `git clone` + `pnpm install && pnpm run build` failed with `[UNRESOLVED_ENTRY] Cannot resolve entry module index.html`. At the time, only an untracked, uncommitted `index.html` in the working tree masked the failure locally.

**Fix confirmed**: commit `e021877` ("feat: add initial HTML structure and metadata for Fast Logbook PWA") adds root `index.html` (63 lines) back to the repository as a tracked file. Contents were read directly and confirmed to follow standard Vite SPA entry conventions: `<div id="root"></div>` plus `<script type="module" src="/src/main.tsx"></script>`, along with meta tags, OGP/Twitter card tags, a JSON-LD `WebApplication` schema block, and a `speculationrules` script for prerender/prefetch. `docs/index.html` (a separate, unrelated file — see screens.md) was also added/changed in the same commit but is not the Vite build entry.

`pnpm run build` was re-run at the current HEAD and completed successfully (`vite v8.2.1`, 62 modules transformed, `dist/` generated including the Workbox service worker chunk, no errors) — this is a genuine fix, not just a re-masking by an untracked file. The historical finding is kept here as a record; no further action is needed unless this file is deleted again.

Docker build behavior and actual Netlify/hosting deploy behavior were still **not verified** in this pass (see Analysis Limitations) — the fix is expected to resolve those pipelines too, since the root cause (missing entry module) is gone, but this was not directly re-tested against the project's actual deploy pipeline.

### 2. `generateFormattedLog()` parses the log text twice

**Severity: Low** — **Recommendation: ⭐️⭐️⭐️ (minor efficiency cleanup, not urgent)**

Confirmed in `src/lib/download.ts`. `generateFormattedLog()` (lines 206–211) calls both `toHtml(log, mins)` (line 208) and `toMarkdown(log, mins)` (line 210). `toHtml()` internally calls `parse(log, mins)` at line 125, and `toMarkdown()` independently calls `parse(log, mins)` again at line 175. The same raw log text is therefore parsed twice per invocation of `generateFormattedLog()`. This is purely a design/efficiency inefeciency — `parse()` is a pure synchronous string-processing function with no side effects, so there is no correctness bug, only redundant CPU work proportional to log size (called on-demand when the user views/downloads the formatted log, not on every keystroke).

### 3. `toMarkdown()` does not call `escapeHtml()` on category/detail values (unlike `toHtml()`)

**Severity: Low** — **Recommendation: ⭐️⭐️⭐️ (inconsistent defensive coding, low real-world exposure today)**

Confirmed in `src/lib/download.ts`. `toHtml()` explicitly escapes both `category` and `dataJson[category].detail` via `escapeHtml()` (lines 140–141). `toMarkdown()` (lines 174–201) interpolates the same `category` and `.detail` values directly into the output string with **no** `escapeHtml()` call (line 184).

Currently the only caller of `toMarkdown()` is `generateFormattedLog()` (line 210), which sets `isCode: true` for the markdown section, causing the *entire* markdown block to be passed through `escapeHtml(section.content)` at line 229 before being embedded in the generated HTML page. This means the current, single call path is not exploitable for XSS in the generated HTML viewer — the whole markdown string gets escaped once more downstream regardless of what `toMarkdown()` itself did.

The residual risk is architectural: `toMarkdown()` is an exported function, and if it is ever called directly for a standalone `.md` file export (a plausible future feature, given the function name and the existing HTML/plaintext/markdown three-way split), any category/detail text containing HTML-significant characters would be emitted unescaped into a real Markdown file. Markdown renderers that allow embedded raw HTML (many do) would then render that unescaped content. This is a latent gap, not a currently-exploitable bug.

### 4. `log_buffer` / `log_buffer_date` intentionally excluded from IndexedDB migration

**Not a bug — confirmed as deliberate design.**

`src/lib/storage.ts` implements `migrateFromLocalStorage(keys: string[])`, a one-time migration helper that copies specific `localStorage` keys into IndexedDB (via the `idb` library, `getItem`/`setItem`/`removeItem`) and deletes them from `localStorage`. It is explicitly called with a fixed list of keys; `log_buffer` and `log_buffer_date` are not among them.

Verified in `src/App.tsx` (lines 105–147): `log_buffer` and `log_buffer_date` are written synchronously to `localStorage` (`saveLogs`, lines 105–119) as a live, per-keystroke-adjacent edit buffer for the textarea, and later merged into the IndexedDB-backed `LOG_DATA_KEY` log store via `flushBuffer()` (lines 121–147), after which both `localStorage` keys are removed. This is a working temp-buffer pattern (synchronous localStorage for low-latency UI state, async IndexedDB for the durable log store) — not an oversight in the migration list.

## Security issues

### 5. `dangerouslySetInnerHTML` used 17 times in `App.tsx`, all sourced from i18next `t()` translation keys

**Severity: Low (Informational)** — **Recommendation: ⭐️⭐️⭐️ (acceptable today; document/guard as a boundary invariant)**

Re-verified independently: `grep -c dangerouslySetInnerHTML src/App.tsx` returns 17 matches, all in the form `dangerouslySetInnerHTML={{ __html: t('some_key') }}` (e.g. lines 636, 721, 726, 731, 744, 749, 754, 759, 764, 787, 793, 798, 851, 861, 907, 937, 962). Every occurrence's `__html` value is the return of `t(...)` (i18next), sourced from bundled translation resource files, not from user input, `localStorage` log content, or any runtime-controlled data. No direct XSS vector exists in the current code path.

This remains an architectural fragility rather than an active vulnerability: the safety property depends entirely on translation strings staying static/bundled. If translations were ever sourced from a remote endpoint, a user-editable config, or interpolated with user-supplied variables without escaping, all 17 sites would become simultaneous XSS vectors. No such remote/dynamic translation loading was found in this codebase during this review, but this should be treated as an invariant to protect, not a closed question.

## Compatibility issues

None identified with confirmed evidence during this pass. The `escapeHtml()`/CDN-SRI/service-worker cache-key items referenced in project security rules (`.claude/rules/security.md`) were not re-investigated here as they fall outside this document's assigned scope (known_bugs vs. security-rules maintenance) — see Analysis Limitations.

## Analysis limitations

- **Docker build was not run or verified.** No `docker build` was attempted in this session; whether a Dockerfile exists and whether it would reproduce the same `UNRESOLVED_ENTRY` failure on a fresh image build was not checked.
- **Actual Netlify/hosting deploy behavior was not verified.** No deploy was triggered or inspected; the conclusion that a fresh-clone deploy pipeline would fail is inferred from the clean-clone build reproduction, not from observing an actual failed deploy.
- **Real browser offline/Service-Worker behavior was not tested in a live browser.** Only `pnpm run build`'s PWA plugin output (precache manifest generation) was inspected; runtime offline behavior, cache invalidation across versions, and the previously-reported `sw.js` `'my-cache'` vs `CACHE_NAME` hardcoding bug (documented in `.claude/rules/security.md`) were not re-verified in this pass.
- **Whether `toMarkdown()` has any other callers outside `src/`** (e.g. scripts, build tooling) was checked only via a repo-wide grep for `toMarkdown` and `toHtml(` inside `src/`; call sites outside `src/` (if any) were not searched.
- **No unit tests exist to cross-check parser/escaping behavior programmatically** — findings on `parse()`, `toHtml()`, and `toMarkdown()` are based on static code reading only, not on running an isolated test against crafted malicious input.
- **Translation resource files were not exhaustively audited** for whether any `t()` key value used with `dangerouslySetInnerHTML` is ever built from a runtime template/interpolation (e.g. `t('key', { variable })`); each occurrence found was `t('literal_key')` with no interpolation object, but resource JSON contents themselves were not fully read line-by-line.

<!-- commit-hash: e021877bb892db6cc019f4e0520449119de3c079 -->
