# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Local development
pnpm run dev

# Lint (Biome)
pnpm run lint

# Lint with auto-fix
pnpm run lint:fix

# E2E tests (Playwright — requires dev server running or uses webServer auto-start)
pnpm test

# E2E with interactive UI
pnpm run test:e2e:ui

# Screenshots only (mobile/tablet/fhd viewports → screenshots/)
pnpm run screenshot
```

Playwright tests live in `tests/e2e/` and run against `http://localhost:3000`. The config auto-starts `pnpm run dev` when not in CI.

## Architecture

**Client-only PWA** — no backend, no build step, no bundler. All logic runs in the browser via native ES Modules. Data stays in `localStorage`. Open `index.html` directly in a browser.

### Module structure

```plain
js/
├── main.js        # Entry point for index.html — init, event binding, log CRUD
├── config.js      # Entry point for config.html — settings UI
└── lib/
    ├── analytics.js           # GA4 event tracking (initAnalytics, gtag guard)
    ├── utils.js               # Date/time helpers, localStorage keys, theme, PWA install
    ├── download.js            # Log parsing, time calculation, HTML export generation
    ├── multilingualization.js # i18n: dictionary + MutationObserver-based translation
    └── indolence.min.js       # Minified DOM helpers ($$one, $$all, $$disableConsole)
```

Dependencies are one-way: `main.js / config.js → lib/`. No circular deps within `lib/`.

### Key design patterns

**Log format**: `YYYY-MM-DD HH:MMCategory;Detail\n` — datetime is always 16 chars (`slice(0, 16)`). The `^` prefix marks entries excluded from work-time calculation.

**localStorage keys** (defined in `utils.js`):
- `log` — raw log text
- `rounding_mins` — rounding unit for time display

**i18n**: Elements with `data-translate="key"` are translated by `Multilingualization.init()`, called as an inline `<script type="module">` in `<head>` to prevent flash-of-untranslated-content.

**Export download**: Uses an indirect pattern — generates a Blob URL, stores it in `localStorage`, dispatches a `startDownload` custom event, and an event listener creates and clicks an `<a>` element. This avoids popup-blocker issues from `window.open` contexts.

**Service Worker** (`sw.js`): Stale-while-revalidate + Date header comparison. Cache name is `APP_NAME + "_" + manifest.version` (fetched asynchronously from `manifest.json` at runtime — known race condition with `install` event). When adding new JS files, **also add them to the `assets` array in `sw.js`**. Note: the fetch handler writes to a hard-coded `'my-cache'` key instead of `CACHE_NAME` — a known bug causing a leaked cache entry.

### Linter / CI

- **Biome v2** for lint + format. Config: [biome.json](biome.json). `noStaticOnlyClass` is disabled to preserve the `Multilingualization` static class.
- `indolence.min.js` is excluded from Biome.
- CI runs `pnpm run lint` and `pnpm audit --audit-level=high` on push/PR to `main`/`develop`.

### Code Comments

Write all inline comments in English.

### Documentation

Design rationale → [`docs/design.md`](docs/design.md)
API/function specs → [`docs/spec/`](docs/spec/)
Session history → [`.claude/histories/YYYYMM.md`](.claude/histories/)

## Analyzed Documentation Index

Codebase analysis snapshots under [`.claude/analyzed/`](analyzed/) (generated at commit `d363d07`; note that this analysis reflects the current React + TypeScript + Vite codebase — where it conflicts with the Architecture section above, the analyzed docs are newer):

1. [dependencies](analyzed/dependencies.md) — packages, versions, licenses, audit status
2. [infrastructure](analyzed/infrastructure.md) — CI/CD, Netlify, Docker/Nginx
3. [databases](analyzed/databases.md) — IndexedDB/localStorage architecture and key inventory
4. [screens](analyzed/screens.md) — entry points, hash routing, view structure
5. [configurations](analyzed/configurations.md) — config file map, env-specific settings
6. [components](analyzed/components.md) — app structure, dependency graph, mind map
7. [utilities](analyzed/utilities.md) — `src/lib/` helper inventory
8. [performance](analyzed/performance.md) — processing costs, bottleneck analysis
9. [known_bugs](analyzed/known_bugs.md) — bugs, layer inconsistencies, limitations
10. [security](analyzed/security.md) — OWASP Top 10 assessment, findings ranked
11. [test](analyzed/test.md) — test inventory and gaps
12. [development-workflow](analyzed/development-workflow.md) — dev loop, branching, quality gates
13. [notes](analyzed/notes.md) — cross-cutting observations, doc-freshness warning
14. [todo](analyzed/todo.md) — prioritized action items by category
15. [naming_convention](analyzed/naming_convention.md) — identifier/file/storage-key naming
16. [use_cases](analyzed/use_cases.md) — actor-goal inventory and use case diagram
17. [graphrag.jsonld](analyzed/graphrag.jsonld) — JSON-LD call graph & ontology (models/controllers/views, data keys, user functions, known inconsistencies) for GraphRAG
18. [ADR](analyzed/ADR.md) — git-log-derived decision timeline (2024-07 → 2026-06), supplemental ADR-101…108 for the pre-2026 era, and verification of docs/ADR.md

<!-- commit-hash: d363d07ab70bdbae818bada7838fe13166f4ef08 -->
