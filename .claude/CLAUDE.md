# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Local development (no build step needed)
npx serve .

# Lint (Biome)
npm run lint

# Lint with auto-fix
npm run lint:fix

# E2E tests (Playwright — requires dev server running or uses webServer auto-start)
npm test

# E2E with interactive UI
npm run test:e2e:ui

# Screenshots only (mobile/tablet/fhd viewports → screenshots/)
npm run screenshot
```

Playwright tests live in `tests/e2e/` and run against `http://localhost:3000`. The config auto-starts `npm run dev` when not in CI.

## Architecture

**Client-only PWA** — no backend, no build step, no bundler. All logic runs in the browser via native ES Modules. Data stays in `localStorage`. Open `index.html` directly in a browser or serve with `npx serve .`.

### Module structure

```
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
- CI runs `npm run lint` and `npm audit --audit-level=high` on push/PR to `main`/`develop`.

### Code Comments

Write all inline comments in English.

### Documentation

Design rationale → [`docs/design.md`](docs/design.md)
API/function specs → [`docs/spec/`](docs/spec/)
Session history → [`.claude/histories/YYYYMM.md`](.claude/histories/)
