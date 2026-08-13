---
name: analyzed-overview
description: Entry-point synthesis of Fast Logbook PWA — stack, structure, request flow, scale, and links to the 16 detailed analysis documents
type: analysis
commit-hash: e021877bb892db6cc019f4e0520449119de3c079
---

# Overview

This is the entry point for the project documentation set under `.claude/analyzed/`. It synthesizes the 16 sibling analysis files and `README.md`; for depth on any topic, follow the links below rather than expecting detail here.

## Project Overview

Fast Logbook PWA is a client-only, installable Progressive Web App for one-tap work-time logging and instant aggregation. A user stamps a category (number keys 1-9 or free text) and the app appends a timestamped, semicolon-delimited log line; totals and grand totals are computed on demand and can be viewed or downloaded as a self-contained HTML file (with embedded HTML/Markdown/plain-text views). There is no backend and no account — all data lives in the browser (IndexedDB, migrated from a legacy `localStorage` scheme). The app supports English and Japanese, offline use via a Service Worker, and dark mode.

## Technology Stack

| Layer | Technology |
|---|---|
| UI framework | React 19.2 + TypeScript ~6.0 |
| Build/dev server | Vite ~8.2 |
| Routing | react-router-dom 7 (`createHashRouter`; routes `/` and `/config`) |
| UI components | Bootstrap 5.3 |
| Offline/PWA | vite-plugin-pwa / Workbox (stale-while-revalidate Service Worker) |
| Storage | IndexedDB via `idb` (migrated from `localStorage`) |
| i18n | i18next / react-i18next (en, ja) |
| Lint/format | Biome 2.5 |
| Test | Playwright (E2E only) |
| Package manager | pnpm 10.33.2 |
| Deployment | Netlify (`netlify.toml`); separate Docker/Nginx self-host path; `docs/` GitHub Pages landing page |
| License | MIT |
| Versioning | CalVer-style (`26.07.19`) |

See [dependencies](dependencies.md) and [infrastructure](infrastructure.md) for full detail.

## Repository Structure

```
src/
├── main.tsx            # React entry point
├── App.tsx              # Main page: log input, keyboard shortcuts, sidebar
├── ConfigApp.tsx         # Settings/config page
├── globals.d.ts
├── components/
│   ├── Drawer.tsx        # Sidebar / hamburger menu
│   └── Modal.tsx         # Modal dialog
├── i18n/
│   ├── index.ts           # i18next setup
│   └── locales/           # en.json, ja.json
└── lib/
    ├── download.ts         # Log parsing, time calculation, HTML export
    ├── storage.ts          # IndexedDB CRUD (idb) + localStorage migration
    └── utils.ts             # Date helpers, storage keys, theme, PWA install
docs/                    # GitHub Pages landing page
```

See [components](components.md), [utilities](utilities.md), [screens](screens.md), [naming_convention](naming_convention.md) for detail.

## Request Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as App.tsx / ConfigApp.tsx
    participant Lib as lib/storage.ts, lib/download.ts, lib/utils.ts
    participant DB as IndexedDB (via idb)
    participant SW as Service Worker (Workbox)

    User->>UI: Tap category key (1-9) or free-text entry
    UI->>Lib: build log line (YYYY-MM-DD HH:MMCategory;Detail)
    Lib->>DB: persist appended log entry
    DB-->>UI: updated log state
    User->>UI: Click "View Log" / "Download Log"
    UI->>Lib: generateFormattedLog() — parse log, compute totals
    Lib-->>User: open new tab (document.write) or trigger file download
    Note over SW: Intercepts asset requests, serves cached app shell offline
```

See [databases](databases.md) for the IndexedDB schema and migration path, and [security](security.md) for the `escapeHtml()` / `document.write()` handling in the export flow.

## Domain Configuration & Scale

Single-user, single-device, single-domain application — no multi-tenant, multi-user, or server-side concerns. Deployed at a single production origin (`fast-logbook.netlify.app`) plus a Docker/Nginx self-host alternative. All state (log entries, category labels, preferences) is scoped to one browser's IndexedDB.

Approximate size: **~659 lines** across `src/**/*.ts` and `src/**/*.tsx` (via `git ls-files 'src/**/*.ts' 'src/**/*.tsx' | xargs wc -l`), spread across 9 source files (excluding locale JSON). This is a small, single-purpose codebase.

## Main Features

- One-tap stamping via number keys 1-9, plus free-text input
- Automatic timestamped log line generation (`YYYY-MM-DD HH:MM`)
- Category totals and grand totals, with `^`-prefixed categories excluded from work-time totals (e.g. breaks)
- View/download logs as a single HTML file bundling HTML table, Markdown table, and plain text
- Offline-capable, installable PWA (Service Worker + manifest)
- Dark mode
- English/Japanese i18n
- No account, no server — all data local to the browser

## Development Workflow

Standard flow is `pnpm install` → `pnpm run dev` (Vite dev server, HTTP on localhost) → Biome lint/format → Playwright E2E tests → `pnpm run build`. CI runs Biome (via reviewdog) and `pnpm audit`, but does **not** run a build step — see [known_bugs](known_bugs.md) #1 for the resulting risk (HEAD has no committed `index.html`, so a fresh clone's `pnpm run build` fails; the working tree's untracked `index.html` currently masks this). Full detail in [development-workflow](development-workflow.md).

## Other Analysis Documents

[dependencies](dependencies.md) · [infrastructure](infrastructure.md) · [databases](databases.md) · [screens](screens.md) · [configurations](configurations.md) · [components](components.md) · [utilities](utilities.md) · [performance](performance.md) · [known_bugs](known_bugs.md) · [security](security.md) · [test](test.md) · [development-workflow](development-workflow.md) · [notes](notes.md) · [todo](todo.md) · [naming_convention](naming_convention.md) · [use_cases](use_cases.md)

<!-- commit-hash: e021877bb892db6cc019f4e0520449119de3c079 -->
