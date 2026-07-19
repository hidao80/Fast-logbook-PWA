---
name: analyzed-configurations
description: Main configuration files and environment-specific settings (summaries and references only).
type: analysis
commit-hash: d363d07ab70bdbae818bada7838fe13166f4ef08
---

# Configurations

- [Configuration File Map](#configuration-file-map)
- [Environment-specific Settings](#environment-specific-settings)
- [Runtime (User) Settings](#runtime-user-settings)

## Configuration File Map

Summaries only — see each file for detail. (Factual)

| File | Summary |
| --- | --- |
| [package.json](../../package.json) | Scripts (`dev`/`build`/`preview`/`lint`/`test`/`screenshot`), pnpm 10.33.2 pinned, `"type": "module"`. Version string has a typo (`26.06:20`) — see [known_bugs.md](known_bugs.md) |
| [vite.config.js](../../vite.config.js) | React plugin + VitePWA (`generateSW`, `sw.js`, `manifest.json`, manifest inline incl. version `26.06.20`, icons, Workbox glob precache); dev/preview port 3000; react/react-router dedupe |
| [tsconfig.json](../../tsconfig.json) | ES2020, `strict: true`, `noUnusedLocals`, bundler resolution, `react-jsx`; scope `src/` only |
| [biome.json](../../biome.json) | Lint+format for `src/**/*.ts(x)`; 2-space, LF, single quotes, semicolons; `noUnusedVariables: warn`; `noDangerouslySetInnerHtml: off` |
| [playwright.config.ts](../../playwright.config.ts) | `tests/e2e/`, chromium only, 3 viewport projects (mobile/tablet/fhd), auto-starts `pnpm run dev`, baseURL `http://localhost:3000` |
| [netlify.toml](../../netlify.toml) | Build + SPA redirect + manifest MIME header |
| [Dockerfile](../../Dockerfile) / [docker-compose.yml](../../docker-compose.yml) | Optional self-host image (Nginx) — see [infrastructure.md](infrastructure.md) |
| `.actrc` | Local GitHub Actions runner (`act`) with Podman settings |
| `.npmrc` | 40 bytes; pnpm-related (content not analysis-critical) |

## Environment-specific Settings

- **No `.env` files, no environment variables, no secrets** anywhere in the app (Factual — client-only, no API keys). The only env sensitivity is `process.env.CI` in `playwright.config.ts` (retries, workers, webServer reuse).
- Dev: Vite on `http://localhost:3000`, PWA dev options enabled (`devOptions.enabled: true` — SW active during dev).
- Prod: static `dist/` on Netlify (or Docker/Nginx).

## Runtime (User) Settings

Persisted per-browser in IndexedDB, edited on the `#/config` screen: rounding unit (1/5/10/15/30/60 min), shortcuts 1–9, date roll-over time (default `05:00`). Full key list → [databases.md](databases.md).

d363d07ab70bdbae818bada7838fe13166f4ef08
