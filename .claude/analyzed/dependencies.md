---
name: analyzed-dependencies
description: Inventory and health check of Fast-logbook-PWA's npm dependencies (React 19 + TypeScript + Vite stack), confirmed directly against package.json, pnpm-workspace.yaml, .npmrc, and live pnpm audit/outdated output.
type: analysis
commit-hash: ceff98ab997a60d35e564821f2e6bf7b6c284128
---

# Dependencies

Package manager: **pnpm 10.33.2** (pinned via `packageManager` field in `package.json`). Lockfile format `9.0`. License: **MIT**.

## Production dependencies

| Package | Version (range) | Purpose |
|---|---|---|
| `react` | ^19.2.8 | UI library, core rendering |
| `react-dom` | ^19.2.8 | React DOM renderer |
| `react-router-dom` | ^7.18.2 | Client-side routing (`createHashRouter`, per prior findings — not independently re-verified in this pass) |
| `i18next` | ^26.3.6 | i18n framework, translation engine |
| `react-i18next` | ^17.0.11 | React bindings for i18next |
| `idb` | ^8.0.3 | Promise-based wrapper around IndexedDB, used for local data persistence |
| `bootstrap` | ^5.3.8 | CSS framework for layout/components |
| `bootstrap-icons` | ^1.13.1 | Icon font/SVG set matching Bootstrap |
| `global` | ^4.4.0 | Node.js `global`/`self`/`window` shim — **no import of `'global'` found anywhere in the repo** (`src/**`, and all root `.ts/.tsx/.js/.cjs/.mjs` files searched). Appears to be an unused dependency. |

## Dev dependencies

| Package | Version (range) | Purpose |
|---|---|---|
| `typescript` | ^6.0.3 | TypeScript compiler/type checker |
| `vite` | ^8.2.1 | Build tool / dev server |
| `@vitejs/plugin-react` | ^6.0.5 | React fast-refresh/JSX support for Vite |
| `vite-plugin-pwa` | ^1.3.0 | Generates PWA manifest/service worker via Vite |
| `@types/react` | ^19.2.18 | React type definitions |
| `@types/react-dom` | ^19.2.4 | React DOM type definitions |
| `@biomejs/biome` | ^2.5.8 | Linter/formatter (scripts: `lint`, `lint:fix` target `src/`) |
| `@playwright/test` | ^1.62.1 | E2E test runner (scripts: `test`, `test:e2e*`, `screenshot`) |

## `pnpm-workspace.yaml`

Not a monorepo manifest — contains only an `overrides:` block pinning transitive packages to patched versions: `brace-expansion` (multiple ranges), `fast-uri` (multiple ranges), `nanoid` (<3.3.16/<3.3.17), `postcss` (<=8.5.17/<=8.5.22), and `react-router` (>=7.12.0 <7.18.2 → forced to >=7.18.2). These look like supply-chain vulnerability pins for transitive deps, not direct dependency changes.

## `.npmrc`

- `ignore-scripts=true` — blocks install-time lifecycle scripts (supply-chain hardening).
- `min-release-age=7` — refuses to install a package version published fewer than 7 days ago (protects against just-published/compromised releases).

## Live audit results (run this session)

**`pnpm audit --audit-level=high`**: `No known vulnerabilities found`.

**`pnpm outdated`**:
```
1 outdated packages (of 1)
typescript: 6.0.3 → 7.0.2
```
This confirms the prior pass's claim: `typescript` has a major version bump available (6.0.3 → 7.0.2). Not yet applied in this repo.

## Update / cleanup flags

| Item | Status | Confidence | Recommendation |
|---|---|---|---|
| `typescript` 6.0.3 → 7.0.2 | Confirmed via live `pnpm outdated` | N/A (confirmed fact) | Evaluate TS 7 changelog for breaking changes before bumping; not urgent since audit is clean. Rating: ⭐️⭐️⭐️ (worth doing, not urgent) |
| `global` package unused | Confirmed via repo-wide grep for `'global'`/`"global"` imports — zero matches | N/A (confirmed fact) | Remove from `dependencies` in `package.json` and run `pnpm install` to update the lockfile. Rating: ⭐️⭐️⭐️⭐️⭐️ |

All other version numbers above are taken verbatim from `package.json` and are current as of this analysis; CI (`.github/workflows/audit.yml`) enforces `pnpm audit --audit-level=high` on presumably every push/PR (workflow file itself not re-read in this pass — unconfirmed trigger conditions).

<!-- commit-hash: ceff98ab997a60d35e564821f2e6bf7b6c284128 -->
