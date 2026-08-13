---
name: analyzed-configurations
description: Summary of build, lint, test, PWA, and deployment configuration files for the React/TypeScript/Vite version of Fast-logbook-PWA.
type: analysis
commit-hash: ceff98ab997a60d35e564821f2e6bf7b6c284128
---

# Configurations

Stack: React 19 + TypeScript + Vite 8, package manager pnpm (`packageManager: pnpm@10.33.2`).

## Config file overview

| File | Role | Key points |
|---|---|---|
| `package.json` | Project manifest, scripts, dependencies | `dev`/`build`/`preview` via Vite; `lint`/`lint:fix` via Biome (scoped to `src/`); `test`/`test:e2e*` via Playwright; version `26.07.19`; `"type": "module"` |
| `vite.config.js` | Build tool config | React plugin + `vite-plugin-pwa` (see PWA section); dedupe/optimizeDeps for react/react-dom/react-router(-dom); dev server and preview both on port 3000 |
| `tsconfig.json` | TypeScript compiler config | `target: ES2020`, `module: ESNext`, `moduleResolution: bundler`, `jsx: react-jsx`, `strict: true`, `noUnusedLocals: true`, `isolatedModules: true`; only `include: ["src"]` — no `tests/` or root-level `.ts` files are type-checked by this config |
| `biome.json` | Lint/format config | Schema `2.4.2`; scope limited to `src/**/*.ts(x)`; formatter: 2-space indent, LF, single quotes, semicolons always; linter recommended rules on, `noUnusedVariables` downgraded to warn, `noDangerouslySetInnerHtml` explicitly off |
| `playwright.config.ts` | E2E test config | `testDir: ./tests/e2e`; `baseURL: http://localhost:3000`; chromium only; 3 viewport projects (mobile/tablet/fhd); CI-conditional behavior — `forbidOnly`/`retries`/`workers` all keyed off `process.env.CI`; `webServer` auto-starts `pnpm run dev` and reuses an existing server outside CI |
| `.editorconfig` | Editor defaults | 2-space indent, LF, UTF-8, trim trailing whitespace, final newline; single quotes for `.js/.jsx/.ts/.tsx` |
| `.npmrc` | Package-manager policy | `ignore-scripts=true` (supply-chain hardening — blocks install-time scripts) and `min-release-age=7` (delays picking up packages published <7 days ago) |
| `pnpm-workspace.yaml` | Dependency override pins | Forces minimum versions for `brace-expansion`, `fast-uri`, `nanoid`, `postcss`, `react-router` — all look like transitive-dependency CVE/bug patches, not first-party version pins |
| `netlify.toml` | Netlify deploy config | Build command `pnpm run build`, publish dir `dist`; sets `Content-Type: application/manifest+json` for `/manifest.json`; SPA fallback rewrites `/*` to `/index.html` (200) |
| `Dockerfile` | Container build | Multi-stage: `node:24.11.1-bookworm-slim` builder (pnpm via corepack, `--frozen-lockfile` if lockfile present) → `nginx:alpine` runtime; `TZ=Asia/Tokyo`; copies `dist/` (falls back to copying the whole build context if `dist` is missing — a defensive/legacy branch); inlines an nginx config with SPA fallback, no-cache for `sw.js`, and long-cache immutable headers for static assets |
| `docker-compose.yml` | Local container orchestration | Single service, maps host `8080` → container `80`; `TZ=Asia/Tokyo`; wget-based healthcheck against `http://localhost/`; volume bind-mount for live-reload is present but commented out |
| `.github/workflows/lint.yml` | CI lint | Runs on push to `main`/`develop`; uses `flatt-security/setup-takumi-guard-npm` and `reviewdog-action-biome` for PR review comments |
| `.github/workflows/audit.yml` | CI dependency audit | Runs on push to `main`/`develop`; Node 24 + pnpm; `pnpm install --frozen-lockfile` then `pnpm audit --audit-level=high` |

## PWA manifest (via `vite-plugin-pwa` in `vite.config.js`)

No static `manifest.json` exists in the repo — it is generated at build time from the `VitePWA({...})` options:
- `registerType: 'autoUpdate'`, `strategies: 'generateSW'`, service worker emitted as `sw.js`, manifest emitted as `manifest.json`
- App identity: `name: "Fast logbook PWA"`, `short_name: "Fast logbook"`, `version: "26.07.19"` (matches `package.json`), `lang: 'ja'`
- `start_url: '/index.html'`, `scope: '/'`, `display: 'standalone'`
- Theme: `background_color: '#ffffff'`, `theme_color: '#62BF04'`
- Fixed `id` (GUID-suffixed) to keep install identity stable across updates
- 6 PNG icon sizes (48–512px) under `img/android-launchericon-*.png`
- Workbox `globPatterns` precache `**/*.{js,css,html,png,ico,svg,woff2,json}`
- `devOptions.enabled: true` — service worker is active in dev mode too, not just production builds

## Environment-specific differences

- **CI vs local**: `playwright.config.ts` changes retry count, worker count, and dev-server reuse based on `process.env.CI`. GitHub Actions workflows (`lint.yml`, `audit.yml`) run only on push to `main`/`develop`, not on arbitrary branches or PR events from the config as written.
- **Netlify vs Docker/nginx are two independent, seemingly redundant deployment paths** — both build via `pnpm run build` and serve the `dist/` SPA output with a `/* -> /index.html` fallback, but configured completely separately (`netlify.toml` vs `Dockerfile`/`docker-compose.yml`/nginx inline config). Unconfirmed which one (if either) is the actual production target; no CI workflow deploys to either.
- **Timezone**: Docker image sets `TZ=Asia/Tokyo` explicitly; no equivalent found for Netlify (platform default applies, effectively environment-dependent).
- **Vite base path**: not overridden in `vite.config.js` (no `base` option set), so it defaults to `/` in both dev and prod builds — consistent with `netlify.toml`'s root-relative redirect and the PWA manifest's `scope: '/'`.

## Known discrepancy (not a config bug — a working-tree state issue)

Root `index.html` was deleted in commit `ceff98a` (this HEAD commit), but the current working tree has it back as an **untracked** file, per `git status`. This means `pnpm run build` currently succeeds locally against the working tree, even though the committed tree at HEAD lacks `index.html` (which Vite requires as its default build entry point). This is a git-tracking state fact, not a flaw in any config file reviewed here; a full write-up belongs in `known_bugs.md`.

## Speculative observations

- The dual Netlify + Docker/nginx deployment setup may be legacy/experimental duplication rather than an intentional multi-target strategy — Unconfirmed without maintainer input. Recommend consolidating to one primary deployment path. Rating: ⭐️3 (worth asking, not urgent).
- `Dockerfile`'s fallback branch that copies the entire build context when `dist/` is absent looks defensive but would silently serve `node_modules` and source files if the build step failed rather than erroring loudly. Recommend making the build step fail hard instead of guarding downstream. Rating: ⭐️3.

<!-- commit-hash: ceff98ab997a60d35e564821f2e6bf7b6c284128 -->
