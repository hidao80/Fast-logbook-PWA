# UI Components & Page Structure

> This document was rewritten for the React + TypeScript rewrite (`src/`). It replaces the earlier description of the static `index.html` / `config.html` pages, which no longer exist.

## Application Shell

File: [src/main.tsx](../../src/main.tsx)

```tsx
const router = createHashRouter([
  { path: '/', element: <App /> },
  { path: '/config', element: <ConfigApp /> },
]);

createRoot(container).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
```

- Routing uses `createHashRouter` (URLs like `/#/config`), not browser-history routing — this avoids needing server rewrite rules on static hosts.
- Global CSS is imported here: `bootstrap/dist/css/bootstrap.min.css`, `bootstrap-icons/font/bootstrap-icons.css`, then `./i18n/index` (initializes i18next before any component renders).
- There is a single `index.html` shell with `<div id="root"></div>`; the previous separate `config.html` page no longer exists — `/config` is now a route within the same SPA.

## Component Breakdown

### 1. `App` (main page) — [src/App.tsx](../../src/App.tsx)

Top-level component for the `/` route. Renders:

1. **Navbar** — toggler button (opens the side `Drawer`), a save-status dot (`●`, red when dirty / green via the `saved` class when clean), the app title, and a help button.
2. **`Drawer`** (side menu) — "View formatted log", "Download formatted log", a `Link` to `/config`, "Delete log", the displayed app version, and a conditionally-rendered "Install PWA" button.
3. **Date picker** — an `<input type="date">` bound to `targetDate`, capped at today, used to navigate the per-day view (see [`configuration.md`](configuration.md) and `docs/design.md` §4.4).
4. **Shortcut grid** — two `<div className="col-12 col-md-6">` columns; keys 1-5 in the left column, keys 6-9 plus the free-form `key 0` input in the right column. Each shortcut is rendered as a `<button>` (not a static `<label>`), since clicking it must append a log line.
5. **Log textarea** — a single `<textarea ref={textareaRef}>`, scoped to the active logical day.
6. **`Modal` (delete confirmation)** — shown when "Delete log" is clicked; confirms before clearing the active day's content.
7. **`Modal` (date-selector feature notice)** — a one-time notice shown to existing users explaining the new per-day view, gated by the `notice_date_selector` flag.
8. **`HelpModal`** — a fullscreen `Modal` with three tabs: Main screen, Config screen, and Changelog.

### 2. `ConfigApp` (settings page) — [src/ConfigApp.tsx](../../src/ConfigApp.tsx)

Top-level component for the `/config` route. Renders:

1. **Navbar** — toggler button + title (no save-status dot or help button).
2. **`Drawer`** — a `Link` back to `/`, plus the app version.
3. **Rounding unit `<select>`** — options for 1/5/10/15/30/60 minutes.
4. **9 shortcut text inputs** — one per shortcut slot, saved on `change`/`blur`.
5. **Roll-over time `<input type="time">`** — the logical-day boundary (default `05:00`).
6. An informational `alert alert-info` box explaining shortcut registration.

### 3. `Drawer` — [src/components/Drawer.tsx](../../src/components/Drawer.tsx)

A reusable Bootstrap-offcanvas-styled side panel, rendered via `createPortal(..., document.body)` so it escapes any parent's CSS containment.

```tsx
interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}
```

- While open: adds `modal-open` to `<body>` and sets `overflow: hidden` to prevent background scroll.
- Closes on `Escape` keydown or backdrop click.
- Used by both `App` and `ConfigApp` for their side menus.

### 4. `Modal` — [src/components/Modal.tsx](../../src/components/Modal.tsx)

A reusable Bootstrap-modal-styled dialog, also rendered via a portal.

```tsx
interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  fullscreen?: boolean;
}
```

- Omitting `onClose` makes the modal non-dismissible by the user (no close button, `Escape` does nothing) — used for the date-selector notice, which requires an explicit acknowledgement click.
- `fullscreen` applies Bootstrap's `modal-fullscreen` variant — used by `HelpModal`.
- Used for: delete confirmation, the date-selector notice, and the help dialog.

## Key Interaction Flows

### Shortcut buttons and keyboard shortcuts

Shortcut text is rendered directly inside `<button>` elements (`shortcuts[n - 1]`), loaded from IndexedDB via `getItem('shortcut_N')`. Clicking a shortcut button (or pressing digit keys `1`-`9` when focus is not in an `<input>`/`<textarea>`) calls `appendLog(appendTime(text, targetDateRef.current))`. Pressing `0` focuses the free-form input instead.

### Free-form input (key `0`)

- **Enter key** (`onKeyDown`, ignoring IME composition / keyCode 229) and **blur** both call `processInput()`, which trims the value, appends a timestamped log line, and clears the field.

### Log textarea

- `onInput`: marks the entry dirty (unless it's a line-break-only change, or it's a non-final IME composition event) and (re)starts a 300ms debounce timer that calls `saveLogs()`.
- `onCompositionEnd`: clears any pending debounce and saves immediately, so IME-confirmed text isn't lost mid-debounce.
- `onKeyDown` (`Enter`, not from IME): saves immediately rather than waiting for the debounce.
- `onBlur`: saves immediately.
- `saveLogs()` writes to the **`localStorage` per-day buffer**, not directly to IndexedDB (see [`database.md`](database.md)).

### View / Download formatted log

- **View** (`handleViewLog`): opens (or refocuses) a named popup window (`window.open('', '_log_viewer')`) **before** any `await`, to avoid popup blockers, then writes the generated HTML via `document.write()`.
- **Download** (`handleDownloadLog`): calls `downloadLog()` from `src/lib/download.ts`, which triggers a Blob-based file download (see [`utilities.md`](utilities.md)).

### PWA install

- `beforeinstallprompt` is captured in a `useRef` (`deferredPromptRef`) and toggles `installBtnVisible` (React state) rather than a DOM class.
- An explicit `appinstalled` listener clears the ref and hides the button as soon as installation completes.
- The button only renders inside the `Drawer` when `installBtnVisible` is `true`.

## Styling

- **Bootstrap 5.3.8** and **Bootstrap Icons 1.13.1** are npm dependencies, imported once in `main.tsx`, and bundled by Vite — no longer loaded from a CDN for the app shell (CDN + SRI is still used inside the **exported** HTML artifact only; see [`utilities.md`](utilities.md)).
- Component-level styling relies on Bootstrap utility classes inline in JSX; no separate `main.css`/`config.css` files exist anymore (the old `css/` directory was removed with the vanilla-JS app).
- **Theme**: `autoSetTheme()` (from `src/lib/utils.ts`) is called once per page in a `useEffect`, applying `data-bs-theme="dark"`/`"light"` to `<html>` based on `prefers-color-scheme`.

## Accessibility Notes

- `Drawer`/`Modal` set `aria-modal="true"` and `role="dialog"`/`role="presentation"` as appropriate, and trap Escape-key handling.
- The help modal's tabs use `role="tab"` and `aria-selected`.
- The navbar toggler has `aria-label="Open menu"`.
- Several places in the help content use `dangerouslySetInnerHTML` to render translated strings containing inline markup (e.g. `<code>` examples); Biome's `noDangerouslySetInnerHtml` rule is disabled in `biome.json` for this reason. These render only static, developer-authored translation strings (`src/i18n/locales/*.json`), never user-entered log content.

## Removed Since the Vanilla-JS Version

The following, previously documented here, no longer exist and have been removed from this document:
- `config.html` as a separate static page (now the `/config` route)
- `data-translate` attributes and the `Multilingualization` class (replaced by `react-i18next`'s `useTranslation()`)
- The `storage` event for cross-tab sync (replaced by `BroadcastChannel('fast-logbook-sync')`)
- CDN `<script>`/`<link>` tags for Bootstrap in the app shell (now bundled via npm/Vite)
- `indolence.min.js` DOM helpers (`$$one`/`$$all`) — React's own state/refs replace direct DOM queries
