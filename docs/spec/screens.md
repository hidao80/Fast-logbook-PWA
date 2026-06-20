# Screen Inventory & Navigation

> Rewritten for the React SPA. There are no longer two separate HTML files (`index.html` + `config.html`) — both screens are routes within a single-page app, navigated via `react-router-dom`'s `createHashRouter`.

## Overview

Fast Logbook PWA is a single-page application with two routes plus one dynamically generated viewer window.

```
index.html  →  <div id="root">  →  RouterProvider (createHashRouter)
                                        ├── "/"        → <App />
                                        └── "/config"  → <ConfigApp />
```

URLs use the hash form (e.g. `/#/config`), which avoids needing server-side rewrite rules on static hosts (though Netlify's `netlify.toml` includes a defensive SPA-fallback redirect rule regardless — see `docs/design.md` §8.1).

---

## Route 1: Main Application (`/`)

**Component**: [src/App.tsx](../../src/App.tsx)

### Purpose

Primary interface for logging time-stamped work activities, scoped to one logical "day" at a time.

### Screen States

| State | Description | Trigger |
|-------|-------------|---------|
| **Initial Load** | Migrations run, log loaded for the resolved initial date, shortcuts loaded | mount `useEffect` |
| **Day Loaded** | Textarea populated with the active day's lines, filtered from the full log | `loadLogs(date)` |
| **Dirty** | Save-status dot is red (no `saved` class) | user types (non-line-break input) |
| **Saving** | 300ms debounce timer pending | `onInput` |
| **Saved** | Save-status dot is green (`saved` class) | `saveLogs()` completes |
| **Side Menu Open** | `Drawer` visible | toggler button click |
| **Delete Confirm Modal** | confirmation `Modal` shown | "Delete log" menu item |
| **Date-selector Notice Modal** | one-time notice shown to upgrading users with existing data | first load after upgrade, gated by `notice_date_selector` |
| **Help Modal** | fullscreen `Modal` with 3 tabs (home/config/changelog) | help button click |
| **Install Button Visible** | shown inside the `Drawer` | `beforeinstallprompt` fired |

### Navigation Flows

```
"/"  (App)
  ├── [Drawer: Configure]            → "/" → "/config" (client-side route change)
  ├── [Drawer: View Formatted Log]   → opens a popup window (generated HTML)
  ├── [Drawer: Download Formatted Log] → triggers a file download (.html)
  └── [Drawer: Delete Log]           → confirmation Modal → clears the active day, stays on "/"
```

### Key Elements / State

| Element / State | Role |
|------------------|------|
| navbar toggler `<button>` | opens the `Drawer` |
| `.navbar-save-status` `<span>` | save-state indicator (`saved` class toggles green/red) |
| help `<button>` | opens the `HelpModal` |
| `Drawer` | side menu (view/download/configure/delete/version/install) |
| `<input type="date">` | the per-day date picker (`targetDate` state) |
| shortcut `<button>`s (1–9) | append a timestamped log line |
| free-form `<input type="text">` (key `0`) | append custom timestamped text |
| `<textarea ref={textareaRef}>` | the active day's editable log |
| delete confirmation `Modal` | confirm before clearing the active day |
| date-selector notice `Modal` | non-dismissible until acknowledged |
| `HelpModal` | fullscreen, tabbed help content |

---

## Route 2: Configuration (`/config`)

**Component**: [src/ConfigApp.tsx](../../src/ConfigApp.tsx)

### Purpose

Settings management for shortcut button labels, time-rounding unit, and the date roll-over time.

### Screen States

| State | Description | Trigger |
|-------|-------------|---------|
| **Initial Load** | inputs populated from IndexedDB | mount `useEffect` |
| **Editing** | user types in a shortcut input | user input |
| **Auto-saved** | change persisted to IndexedDB and broadcast to other tabs | `onChange`/`onBlur` |
| **Quota Error** | alert shown (`storage_quota_exceeded`) | `QuotaExceededError` |

### Navigation Flows

```
"/config"  (ConfigApp)
    └── [Drawer: Back] → "/" (client-side route change, no full page reload)
```

### Key Elements

| Element | Role |
|---------|------|
| `<select>` | rounding-unit dropdown (1/5/10/15/30/60 min) |
| shortcut `<input>`s (1–9) | shortcut text fields |
| `<input type="time">` | the roll-over-time field |
| `Drawer` | side menu with a `Link` back to `/` and the version display |

There is no longer a separate "early i18n init script in `<head>`" for this route — i18next is initialized once in `main.tsx` before any route renders, and React's render cycle doesn't suffer the translation-flash problem that motivated the old early-init pattern (see `docs/design.md` §6.1).

---

## Generated Window: Formatted Log Viewer

**Module**: [src/lib/download.ts](../../src/lib/download.ts) (`generateFormattedLog()`)
**Trigger**: `App.tsx`'s `handleViewLog()`
**Entry Point**: No — generated dynamically, opened in a popup window, not part of the router.

### Purpose

Read-only display of the parsed log in three formats with clipboard-copy support.

### How It Is Generated

```typescript
// App.tsx — handleViewLog()
if (!logViewerRef.current || logViewerRef.current.closed) {
  logViewerRef.current = window.open('', '_log_viewer'); // opened before any await, to dodge popup blockers
}
const outputStr = generateFormattedLog(log, mins);
viewer.document.open();
viewer.document.write(outputStr);
viewer.document.close();
```

Reusing a named window (`_log_viewer`) means repeated clicks refresh the same tab instead of opening a new one each time.

### Content Sections

| Section ID | Format | Description |
|-----------|--------|--------------|
| `html_summary` | HTML `<table>` | work-time summary, grouped by category |
| `plaintext_log` | `<pre><code>` | the raw log text for the exported range |
| `markdown_summary` | Markdown in `<pre>` | a pipe-table for documentation use |

Each section includes a clipboard-copy button (Font Awesome icon), gated by a `clipboard-write` permission check, with a tooltip confirming the copy.

### External Dependencies (in the generated HTML only)

- Bootstrap CSS/JS (CDN, with SRI `integrity`)
- Font Awesome (CDN, with SRI `integrity`)

These remain CDN-loaded **only** in this exported artifact — the live app shell bundles Bootstrap via npm instead (see [`components.md`](components.md)).

---

## Screen-to-Screen Navigation Map

```
[PWA Launch / Browser Open]
        ↓
   "/" (App) ←───────────────────────────┐
        │                                 │
        ├─[Drawer: Configure]──→ "/config" (ConfigApp)
        │
        ├─[Drawer: View Log]──→ Popup Window (generated HTML)
        │
        └─[Drawer: Download]──→ File Download (.html)
```

---

## Responsive Behavior

Both routes use Bootstrap's responsive grid:

| Breakpoint | Shortcut Layout | Side Menu |
|-----------|------------------|-----------|
| `< 768px` (mobile) | single column (keys 1–9 stacked) | full-width offcanvas-style `Drawer` |
| `≥ 768px` (tablet+) | two columns (1–5 left, 6–9+`0` right) | same `Drawer` |

Playwright E2E coverage (`tests/e2e/screenshot.spec.ts`) exercises three viewport projects defined in `playwright.config.ts`: `mobile` (375×812), `tablet` (768×1024), and `fhd` (1920×1080).
