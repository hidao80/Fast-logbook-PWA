---
name: analyzed-performance
description: Performance characteristics of the Fast Logbook PWA — a client-only React/TypeScript/Vite app with IndexedDB persistence and no backend.
type: analysis
commit-hash: ceff98ab997a60d35e564821f2e6bf7b6c284128
---

# Performance Analysis

Scope: processing cost, timing, parallelism, and bottlenecks. This document replaces a prior Japanese-language, vanilla-JS-era analysis, which is stale (the app is now React + TypeScript + Vite).

## 1. Log parsing (`src/lib/download.ts`)

- `parse(text, mins)` (lines 64–119) does a **single linear pass**: `text.split('\n')` into a `timeStamp` array plus per-category detail/time accumulation (one `forEach`), followed by one more `for` loop over `timeStamp` to compute durations between consecutive entries. This is **O(n)** in the number of log lines, not quadratic. It is a full re-parse from scratch on every call — there is no incremental/memoized parsing.
- **Confirmed: `parse()` runs twice per export.** `generateFormattedLog()` (lines 206–211) builds its `sections` array by calling both `toHtml(log, mins)` and `toMarkdown(log, mins)`. `toHtml()` (line 125) and `toMarkdown()` (line 175) each independently call `parse(log, mins)` on the same `log`/`mins` arguments — so the identical O(n) parse work is duplicated once per view (`handleViewLog`) and once per download (`downloadLog`). For typical logbook sizes (a personal work log, likely hundreds to low thousands of lines) this is unlikely to be perceptible, but it is a straightforward, verified redundancy.
  - **Recommendation:** parse once in `generateFormattedLog()` and pass the parsed `Record<string, ParsedCategory>` into `toHtml`/`toMarkdown` (or refactor them to accept already-parsed data). Rating: ⭐️⭐️⭐️ (cheap, correctness-neutral, only matters if log sizes grow or export is invoked frequently).

## 2. React re-render patterns (`src/App.tsx`)

- **Confirmed:** the log textarea is uncontrolled — bound via `textareaRef` (a `ref`, not `useState`), and mutated imperatively (`ta.value = ...`) in `loadLogs`, `appendLog`, `handleConfirmDelete`. `onInput`/`onKeyDown` handlers do not put keystrokes into React state, so keystrokes do not trigger a re-render of `App`. This is a deliberate and effective avoidance of full-component re-render per keystroke in a component with many other pieces of state (`isDirty`, `shortcuts`, `targetDate`, several modal-open booleans).
- `handleTextareaInput` (line 323) debounces `saveLogs()` by 300ms via `debounceRef`/`setTimeout`, avoiding a localStorage write on every keystroke; `setIsDirty(true)` still fires synchronously on each qualifying input event, which does cause a small re-render (only the save-status dot depends on `isDirty`, so the render cost is limited to that JSX region reconciling, not the whole tree doing real work — React re-renders the function component but the diff against the previous VDOM is cheap since only one span's className/title differ). Rating for optimizing further: ⭐️⭐️ (marginal; `isDirty` re-renders are cheap and already isolated in effect).
- The main `useEffect` (lines 191–285) has dependencies `[runMigrations, getDateWithRollOver, flushBuffer, loadLogs, saveLogs]`. All five are `useCallback`-wrapped with stable (mostly empty) dependency arrays, so in practice this effect should only run once on mount despite the non-empty dependency list — consistent with the `initialized` ref guard pattern. Unconfirmed/speculative: under React 18 `StrictMode` (used in `main.tsx`), effects double-invoke in development, meaning `runMigrations`, `flushBuffer`, etc. execute twice on dev mount; this is a dev-only cost and does not affect production, but could mask double-execution bugs during development. Rating: ⭐️⭐️ (worth a comment, not urgent).
- No `useMemo`/`useCallback` misuse or obviously missing memoization was found for expensive computations; the component does not perform heavy synchronous work in the render body itself (rendering is mostly static JSX plus the Help modal's content, which is large but static per tab).

## 3. Code-splitting / lazy loading

- **Confirmed via grep: zero hits for `React.lazy`, `lazy(`, or dynamic `import(` anywhere under `src/`.** Both routed pages (`App` at `/` and `ConfigApp` at `/config`, wired in `src/main.tsx` via `createHashRouter`) are statically imported, so both are included in the initial JS bundle regardless of which route the user lands on.
- `vite.config.js` has no manual chunking (`build.rollupOptions.output.manualChunks`) or other code-splitting configuration — only the `@vitejs/plugin-react` and `vite-plugin-pwa` plugins, `resolve.dedupe`, and `optimizeDeps.include` for React/React Router. Vite/Rollup will still split some vendor code by default heuristics, but there is no deliberate route-based or component-based lazy loading.
- **Confirmed: Bootstrap CSS is statically imported in full** — `main.tsx` line 4 imports `'bootstrap/dist/css/bootstrap.min.css'` (plus `bootstrap-icons/font/bootstrap-icons.css` on line 5) unconditionally at the entry point, not tree-shaken or scoped to used components.
- **Speculative bottleneck:** for a small two-page app (main logbook + config screen), the absence of route-level code splitting is unlikely to matter much in practice — the total JS/CSS is probably small relative to typical SPA bundles. Rating for adding `React.lazy` route splitting: ⭐️⭐️ (low priority given app size, but easy win if bundle audits show `ConfigApp` + its deps adding meaningful weight to the initial load).

## 4. Storage layer (`src/lib/storage.ts`)

- **Confirmed non-blocking:** `getItem`, `setItem`, and `removeItem` are all `async` and delegate to `idb`'s Promise-based IndexedDB wrapper (`openDB` awaited once via a module-level `dbPromise`, then `.get`/`.put`/`.delete` per call). None of these synchronously block the main thread beyond the IndexedDB transaction dispatch itself.
- `migrateFromLocalStorage` (lines 49–57) iterates keys sequentially with `await` inside a `for` loop rather than `Promise.all` — this serializes what could be parallel IndexedDB writes during the one-time migration path. Given it runs once (guarded by `MIGRATION_VERSION_KEY` in `App.tsx`) and the key list is small (a dozen keys), this is a negligible, one-time cost. Rating for parallelizing: ⭐️ (not worth the complexity).
- `App.tsx`'s `flushBuffer` (lines 121–147) does synchronous string work (`split('\n')`, `.filter()`, `.sort()` with `localeCompare`) on the full log before an async `setItem` write. This runs on every buffer flush (visibility change, date switch, BroadcastChannel sync) and is O(n log n) due to the sort, where n is total log line count — likely fine for realistic personal-logbook sizes, but is the one place doing non-trivial synchronous work tied to storage I/O. Unconfirmed how large real-world logs get; flagged as speculative. Rating: ⭐️ (no action needed without evidence of large logs).

## 5. Lighthouse badge (quoted from README, not re-measured)

README.md (lines 11–15) states:

> Accessibility: 94, Best Practices: 100, Performance: 93, SEO: 90
> "Measured on Jan 17, 2026 by [Lighthouse-badges](https://github.com/hidao80/lighthouse-badges) — [Measure now!](https://pagespeed.web.dev/analysis?url=https://fast-logbook.netlify.app/)"

This is quoted verbatim from the repository's own README badge/caption. **These scores were not re-measured or independently verified as part of this analysis** — they are reported as a third-party (self-reported, tool-generated) claim only.

## Summary of speculative items and ratings

| Item | Status | Rating |
|---|---|---|
| Redundant double `parse()` per export | Confirmed | ⭐️⭐️⭐️ fix if export is hot path |
| `isDirty` re-render on each keystroke | Confirmed, low-impact | ⭐️⭐️ optional |
| StrictMode double-invoke of effects in dev | Speculative (React 18 default behavior, not directly observed running) | ⭐️⭐️ document only |
| No route-level code splitting (`React.lazy`) | Confirmed absent | ⭐️⭐️ low priority for current app size |
| Full static Bootstrap CSS import | Confirmed | ⭐️ low priority |
| Sequential migration writes | Confirmed, one-time cost | ⭐️ not worth changing |
| `flushBuffer` O(n log n) sort on full log | Confirmed pattern; real-world log size unknown | ⭐️ speculative, no action without evidence |

<!-- commit-hash: ceff98ab997a60d35e564821f2e6bf7b6c284128 -->
