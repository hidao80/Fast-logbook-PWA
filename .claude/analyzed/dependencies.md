---
name: analyzed-dependencies
description: Runtime and development dependencies, versions, licenses, and vulnerability status.
type: analysis
commit-hash: d363d07ab70bdbae818bada7838fe13166f4ef08
---

# Dependencies

- [Runtime Dependencies](#runtime-dependencies)
- [Development Dependencies](#development-dependencies)
- [Vulnerability Status](#vulnerability-status)
- [Update / Hygiene Notes](#update--hygiene-notes)

## Runtime Dependencies

Source: [package.json](../../package.json). Licenses are from general package knowledge (Unconfirmed against `node_modules` metadata).

| Package | Version | License | Purpose |
| --- | --- | --- | --- |
| react / react-dom | ^19.2.7 | MIT | UI framework |
| react-router-dom | ^7.17.0 | MIT | Hash-based routing (`/`, `/config`) |
| i18next | ^26.3.1 | MIT | i18n core |
| react-i18next | ^17.0.8 | MIT | React bindings for i18next |
| idb | ^8.0.3 | ISC | Promise wrapper for IndexedDB (`src/lib/storage.ts`) |
| bootstrap | ^5.3.8 | MIT | CSS framework (bundled via npm, not CDN) |
| bootstrap-icons | ^1.13.1 | MIT | Icon font |
| global | ^4.4.0 | MIT | **Unused** — no import in `src/` (Factual, verified by grep) |

## Development Dependencies

| Package | Version | License | Purpose |
| --- | --- | --- | --- |
| @biomejs/biome | ^2.4.2 | MIT/Apache-2.0 | Lint + format |
| @playwright/test | ^1.49.0 | Apache-2.0 | E2E tests / screenshots |
| typescript | ^6.0.3 | Apache-2.0 | Type checking (no `tsc` script defined) |
| vite | ^8.0.16 | MIT | Dev server / build |
| @vitejs/plugin-react | ^6.0.2 | MIT | React fast refresh / JSX |
| vite-plugin-pwa | ^1.3.0 | MIT | Manifest + Workbox SW generation |
| @types/react, @types/react-dom | ^19.x | MIT | Type definitions |

Package manager: **pnpm 10.33.2** (pinned via `packageManager`).

## Vulnerability Status

- `pnpm audit --audit-level=high` → **No known vulnerabilities found** (Factual, run 2026-07-05 at this commit).
- CI re-runs the same audit on every push to `main`/`develop` ([.github/workflows/audit.yml](../../.github/workflows/audit.yml)), plus `flatt-security/setup-takumi-guard-npm` supply-chain guard.

## Update / Hygiene Notes

- `package.json` `"version": "26.06:20"` contains a colon — not valid semver; manifest uses `26.06.20`. See [known_bugs.md](known_bugs.md).
- `global` is dead weight. Options:
  - Remove it (`pnpm remove global`) — recommendation ⭐️⭐️⭐️⭐️⭐️
  - Keep as-is — ⭐️ (no benefit, small install/audit surface cost)
- No `tsc --noEmit` script exists; TypeScript errors surface only via editor/Vite. See [todo.md](todo.md).

d363d07ab70bdbae818bada7838fe13166f4ef08
