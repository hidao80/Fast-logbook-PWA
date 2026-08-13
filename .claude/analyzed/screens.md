---
name: analyzed-screens
description: Documents the React Router screen structure, entry point, and view components of the Fast-logbook-PWA single-page app.
type: analysis
commit-hash: ceff98ab997a60d35e564821f2e6bf7b6c284128
---

# Screens

This project is a React + TypeScript + Vite single-page application (SPA) using
`react-router-dom` v7 with hash-based routing. It is no longer the vanilla-JS
two-page (`index.html` + `config.html`) PWA described in older documentation —
that description is fully obsolete and has been discarded from this file.

## Entry Point

- `src/main.tsx` is the SPA entry module, loaded via `<script type="module" src="/src/main.tsx">` in the root `index.html`.
- It mounts a single React root at `<div id="root">` using `createRoot(...).render(<StrictMode>...)`.
- Global CSS side-effect imports at the top of `main.tsx`: `bootstrap/dist/css/bootstrap.min.css`, `bootstrap-icons/font/bootstrap-icons.css`, and `./i18n/index` (i18next setup).
- Router: `createHashRouter` (hash-based routing, e.g. `#/config`), wrapped by `<RouterProvider>`.

### Route table (verified from `src/main.tsx`, lines 10-13)

| Path | Element | Screen |
|---|---|---|
| `/` | `<App />` | Main logbook screen |
| `/config` | `<ConfigApp />` | Settings screen |

- No catch-all / 404 route is defined. Any unmatched hash path will render `react-router-dom`'s default "no route matched" error output (an unstyled error boundary), since no `errorElement` is configured on the router or on either route object.

## Vite entry file (`index.html`) — status at HEAD, and current working-tree state

This required careful re-verification because a prior pass in this session flagged it as a critical, currently-reproducing bug. That is **not accurate for the current working tree**, though it is accurate for the last commit:

- `git show HEAD --stat` for commit `ceff98ab997a60d35e564821f2e6bf7b6c284128` shows `index.html | 34 --` — i.e. **the commit deleted the root `index.html`** with no replacement added under `public/` or elsewhere, and no `root` override was added to `vite.config.ts`.
- However, `git status --porcelain` at the time of this analysis shows `?? index.html` — an **untracked** `index.html` file that currently exists in the working tree (34 lines, containing the `<div id="root">` and the `<script type="module" src="/src/main.tsx">` tag). This file is not committed.
- Because this untracked file is present, `pnpm run build` **succeeds** right now: verified directly by running `pnpm run build`, which completed with `✓ built in 448ms` and produced `dist/index.html`, `dist/assets/*`, and a PWA precache/service worker (`dist/sw.js`, `dist/workbox-*.js`, 19 precache entries, 908.50 KiB).
- **Conclusion**: the build-breaking bug is real in git history (the deletion was committed with nothing restoring the file), but is currently masked in this working tree by an uncommitted, untracked `index.html`. If that untracked file is discarded (`git clean`) or a fresh clone/CI checkout of HEAD is used, the build will fail again with Vite's `[UNRESOLVED_ENTRY] Cannot resolve entry module index.html` (this exact reproduction was reported by a prior pass; not re-triggered here since doing so would require deleting the untracked file, which was out of scope for a read-only analysis). This should be treated as an **outstanding known bug** at the commit/repo level regardless of the current working-tree state — recommend committing the untracked `index.html` (⭐️5, trivial and directly fixes a broken HEAD) or restoring the file via a `public/` copy plus Vite `root`/`build.rollupOptions.input` config if a different entry layout is intended (⭐️2, unnecessary complexity for this project's simple single-entry structure).
- `vite.config.ts` (project root) confirms: no custom `root`, no `build.rollupOptions.input`, no `appType` override — it relies entirely on Vite's default convention of an `index.html` at the project root as the SPA entry.

## App.tsx — Main screen (`/`)

Root page component (`export default function App()`), documented via its own JSDoc as handling "log CRUD, shortcut insertion, date selection, formatted-log export, and PWA install prompt."

**Major state** (`useState`): `isDirty`, `version`, `shortcuts` (9-slot array), `targetDate`, `installBtnVisible`, `isSideMenuOpen`, `isDeleteModalOpen`, `isDateNoticeModalOpen`, `isHelpModalOpen`.

**Major refs** (`useRef`): `initialized`, `textareaRef` (the log textarea), `targetDateRef`, `debounceRef` (300ms autosave debounce), `bcRef` (`BroadcastChannel('fast-logbook-sync')` for cross-tab sync), `deferredPromptRef` (PWA install prompt event), `logViewerRef` (handle to the popped-out formatted-log viewer window).

**UI elements**:
- Top navbar: hamburger menu button (opens `Drawer`), unsaved/saved status dot, app title, help button (opens Help `Modal`).
- `Drawer` side menu: "view formatted log", "download formatted log", link to `/config`, "delete log" button, version label, conditional "install PWA" button.
- Main content: date `<input type="date">` selector; 9 shortcut buttons (slots 1-9, laid out 1-5 in one column and 6-9 + a free-text quick-entry input in the other); a `<textarea>` for the raw log buffer.
- Three `Modal` instances: delete-confirmation modal, one-time "date selector feature" notice modal (content injected via `dangerouslySetInnerHTML` from translated/trusted i18n strings), and a large tabbed `HelpModal` (home/config/changelog tabs, also using `dangerouslySetInnerHTML` for translated rich-text content).

**Key event handlers / behaviors**:
- Global digit-key shortcut handler (`keydown` on `document.body`): digits 1-9 append the corresponding shortcut text with a timestamp; `0` focuses the free-text input. Skipped when focus is in an `INPUT`/`TEXTAREA`.
- Textarea input/composition/keydown handlers manage IME composition state and a 300ms debounced `saveLogs()`.
- `handleViewLog` opens a named popup window synchronously (before any `await`, to dodge popup blockers) and writes the formatted log HTML via `document.write()`, per the project's documented `escapeHtml()`-before-`document.write()` security convention — the code comment explicitly references `generateFormattedLog` escaping content first.
- `flushBuffer`/`loadLogs` merge a localStorage-backed "log_buffer" into the persisted log store (`getItem`/`setItem` from `lib/storage`) filtered by a configurable roll-over time boundary.
- Service worker: registers `sw.js` on mount and reloads on `controllerchange` (but only if a controller already existed, i.e. not on first install).
- `beforeinstallprompt`/`appinstalled` listeners drive the PWA install button.
- Runs a one-time migration (`runMigrations`) from legacy `localStorage` keys into the current storage abstraction.

## ConfigApp.tsx — Settings screen (`/config`)

Settings page component (`export default function ConfigApp()`), per its JSDoc: "Manages rounding unit, shortcut strings, and date roll-over time, syncing changes across tabs via BroadcastChannel."

**State**: `version`, `shortcuts` (9-slot array), `roundingUnit`, `rollOverTime`, `isSideMenuOpen`.

**UI elements**:
- Same navbar/`Drawer` pattern as `App.tsx`, but the drawer only contains a "back to `/`" link and the version label (no delete/download/install actions here).
- Rounding-unit `<select>` (1/5/10/15/30/60 minutes).
- 9 shortcut text `<input>` fields (biome-ignore comment documents intentional array-index keys since the 9 slots are position-fixed).
- Date roll-over `<input type="time">`.

**Key behaviors**:
- All three setting types (`shortcut_N`, rounding unit, roll-over time) are persisted via `setItem`/`getItem` and broadcast via the same `fast-logbook-sync` `BroadcastChannel` used in `App.tsx`, so edits made here propagate live to any open main-screen tab (and vice versa is implied but not shown in this file).
- Shortcut inputs guard against saving mid-IME-composition (`isComposing` check) — consistent with the composition-handling convention also present in `App.tsx`.
- Same `QuotaExceededError` try/catch pattern around every `setItem` call, surfacing `t('storage_quota_exceeded')` via `alert()`.

## Shared UI components

- `src/components/Drawer.tsx` — a Bootstrap-offcanvas-styled slide-in side panel, rendered via `createPortal` into `document.body`. Props: `isOpen`, `onClose`, `title`, `children`. Closes on Escape key or backdrop click; toggles `document.body` scroll-lock class while open. Used by both `App.tsx` (main menu) and `ConfigApp.tsx` (config menu) as their respective side-navigation drawer.
- `src/components/Modal.tsx` — a Bootstrap-modal-styled dialog, also rendered via `createPortal`. Props: `isOpen`, optional `onClose` (omitting it makes the modal non-dismissible — used for the one-time date-notice modal, which has no `onClose` passed), `title`, `children`, optional `footer`, optional `fullscreen`. Used only by `App.tsx`, for three modals: delete confirmation, one-time date-selector notice, and the tabbed help modal (`fullscreen` variant).
- `ConfigApp.tsx` does not use `Modal` at all — only `Drawer`.

## Offline routing behavior (vite-plugin-pwa)

- `vite.config.ts` configures `VitePWA` with `strategies: 'generateSW'` (Workbox-generated service worker, not a custom one), `registerType: 'autoUpdate'`, output filename `sw.js`, manifest filename `manifest.json`.
- `workbox.globPatterns` precaches `**/*.{js,css,html,png,ico,svg,woff2,json}`.
- No explicit `navigateFallback` option is set in the `workbox` block shown in `vite.config.ts`. For `generateSW` strategy, Workbox's default behavior is to auto-configure a navigation-fallback (typically to the precached `index.html`) when precaching HTML, enabling SPA-style offline navigation — but the exact fallback path and any exclusions were **not directly observed** in this config (no override is present, so this relies on `vite-plugin-pwa`'s default, which was not independently verified against the installed plugin version's source in this pass). **Unconfirmed**: whether offline hash-route navigation (`/#/config`) resolves correctly under the generated service worker, since hash routes are not separate navigation requests and should be transparently served by the same cached `index.html` shell — this is consistent with how `createHashRouter` is designed to work with a single cached shell, but was not tested in-browser here.
- The build run performed for this analysis did produce `dist/sw.js` and a workbox runtime chunk (`workbox-9c191d2f.js`) with 19 precache entries (908.50 KiB), confirming the PWA build step itself completes successfully once `index.html` is present.

<!-- commit-hash: ceff98ab997a60d35e564821f2e6bf7b6c284128 -->
