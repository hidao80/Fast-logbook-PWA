# Architecture Decision Records — Fast Logbook PWA

This document reconstructs Architecture Decision Records (ADRs) by tracing the repository's git log (commit messages, diffs, and `docs/design.md`). Each record reflects the context as it stood *at the time the decision was made*; where a later decision overrides it, that is noted explicitly.

Each ADR follows this format:

```
## ADR-XXX: <Title>
- Status: Accepted / Superseded by ADR-YYY
- Date: YYYY-MM-DD
- Commit(s): <hash>

### Context
### Decision
### Consequences
```

---

## ADR-001: Client-only, no-backend architecture

- Status: Accepted
- Date: 2026-02-05 (since the repository's inception)
- Commit(s): initial commits / `docs/design.md` §2.1

### Context
Work logs may contain personal or business information, so the data should never be transmitted to an external server. A serverless architecture also reduces hosting cost to zero.

### Decision
No backend exists; all data processing and persistence is completed inside the browser. Data persistence is `localStorage` (later migrated to IndexedDB in ADR-010).

### Consequences
- Privacy risk is reduced to zero at the architecture level.
- The trade-off is no cross-device sync; backups depend on manual export.

---

## ADR-002: Vanilla JS, no build step, CDN-hosted libraries

- Status: Superseded by ADR-012
- Date: 2026-02-05 – 2026-02-19
- Commit(s): initial commits, `17f8d3f` (utility function refactor)

### Context
Introducing a build step (bundler/transpiler) increases CI/CD and onboarding complexity. Modern browsers natively support ES Modules.

### Decision
The app is designed to run by opening `index.html` directly in a browser. Bootstrap and similar libraries are loaded from a CDN (jsDelivr), and explicitly listed in the Service Worker's `assets` array so they remain available offline.

### Consequences
- Achieved instant deployment and zero setup.
- CDN outages could affect offline behavior (no impact once cached).
- This policy ended with the React + Vite migration on 2026-06-13 (ADR-012).

---

## ADR-003: Service Worker caching strategy (Stale-While-Revalidate + Date header comparison)

- Status: Superseded by ADR-014 (the core policy carries forward even after the Workbox migration)
- Date: ~2026-02-05 (initial implementation), revised multiple times afterward
- Commit(s): `988e1ed`, `39d1f37` (adding analytics.js to the cache target)

### Context
A trade-off was needed between offline support and "how quickly updates are picked up." The goal was to return the cache immediately while checking for a newer network response in the background.

### Decision
A custom `sw.js` implements Stale-While-Revalidate, comparing the `Date` header and updating the cache only when the network response is newer. The cache name includes the `version` field from `manifest.json`; when the version changes, the `activate` event deletes old caches.

### Consequences
- Balanced offline resilience with timely cache updates.
- The `assets` list had to be maintained by hand, and missing a file when adding new ones was a known source of bugs (documented in `docs/design.md` §11.1). This was resolved by adopting Workbox in ADR-012.

---

## ADR-004: Custom i18n engine (`Multilingualization` class + `MutationObserver`)

- Status: Superseded by ADR-013
- Date: ~2026-02-19
- Commit(s): `17f8d3f` (a ~577-line change)

### Context
When translating elements with a `data-translate` attribute after `DOMContentLoaded`, English text would flash briefly before translation ("translation flash").

### Decision
A static `Multilingualization` class was implemented; an inline `<script type="module">` in `<head>` calls `init()`, which uses a `MutationObserver` to watch for DOM additions and immediately translate `data-translate` elements. The observer disconnects after the initial translation pass to eliminate overhead.

### Consequences
- Resolved the flash problem.
- Because the class consisted solely of static members, Biome's `noStaticOnlyClass` rule had to be disabled (related to ADR-006).
- Replaced by `i18next` / `react-i18next` after the React migration on 2026-06-13 (ADR-013).

---

## ADR-005: Addition, then removal, of Google Analytics 4 (GA4) tracking

- Status: Superseded (removed)
- Date: added 2026-02-19 / removed 2026-06-06
- Commit(s): `988e1ed`, `39d1f37` (added) → `f7aa5a2` (removed: "Remove analytics.js from service worker and add storage.js")

### Context
GA4 event tracking was introduced to understand usage patterns. However, `docs/design.md` had already stated a policy that no log content or PII would ever be transmitted.

### Decision
`js/lib/analytics.js` was initially added and included in the Service Worker's cache targets, but it was removed during the 2026-06-06 refactor (concurrent with the IndexedDB migration), eliminating the tracking feature entirely.

### Consequences
- Strengthened the privacy policy ("no external transmission" became literally true).
- Lost visibility into usage patterns, but the change aligns with the no-backend / no-telemetry principle.

---

## ADR-006: Consolidating lint/format from ESLint to Biome

- Status: Accepted
- Date: ~2026-02-19 (`biome.json` introduced), CI integration on 2026-03-03 (`1eef011`)
- Commit(s): around `17f8d3f`, `1eef011` ("Modernize CI with Biome action and add Playwright E2E testing")

### Context
Per the migration history recorded in `docs/design.md` §7.1: ESLint v4.x had 12 npm vulnerabilities (including high severity), and even ESLint v10 still had 4 (moderate). The formatter also required a separate Prettier setup, and execution speed (Node.js) was slow.

### Decision
Adopted Biome v2 to unify lint and format. `noStaticOnlyClass` was disabled to preserve the `Multilingualization` class; `indolence.min.js` was excluded from linting.

### Consequences
- Zero npm vulnerabilities, and faster execution thanks to the Rust implementation.
- Config files were consolidated: `.eslintrc.json` → `eslint.config.js` → `biome.json`.
- After the React migration, the lint scope changed from `js/**/*.js` to `src/` (see the `lint` script in `package.json`).

---

## ADR-007: Adding `.claude/` project rules to version control

- Status: Accepted
- Date: 2026-03-13
- Commit(s): `f1e1546`, `8b59a81` ("Modernize CI and add Claude Code project rules (#6)")

### Context
The team wanted to share AI coding agent (Claude Code) project rules (`CLAUDE.md`, `rules/code-style.md`, `rules/security.md`).

### Decision
`.claude/` was added to the repository, excluding only `histories/` and `settings.local.json`. `.codex/config.toml` and `.gemini/settings.json` were added at the same time.

### Consequences
- Agent-facing context is now version-controlled alongside the code and reviewable.
- Personal local settings (`settings.local.json`) and history logs are excluded, preventing leakage of sensitive information or individual differences.

---

## ADR-008: Supply-chain hardening (adding Takumi Guard + switching audit CI to pnpm)

- Status: Accepted
- Date: 2026-03-13
- Commit(s): `6c67b13`, `6e3a2b1` ("Add Takumi Guard supply chain scan and switch audit CI to pnpm"), `a14653c`/`b7b43da` (version pinning), `ce1696b` (badge link fix)

### Context
The project needed to address the risk of malware introduced via dependency packages (supply-chain attacks).

### Decision
Added a malware scan via [Takumi Guard](https://github.com/flatt-security/setup-takumi-guard-npm) to the GitHub Actions audit workflow, and switched the audit CI's package manager to pnpm. The `setup-takumi-guard-npm` action is pinned to a specific version (`v1`) rather than `@latest`, for reproducibility and supply-chain protection.

### Consequences
- CI can now detect malicious code in dependency packages.
- A `pnpm-lock.yaml` resulting from this pnpm adoption fed into later package-manager decisions covered by ADR-011 (`.npmrc` settings).

---

## ADR-009: CI review style change (adopting reviewdog) and trigger policy

- Status: Accepted
- Date: 2026-03-13
- Commit(s): `8b59a81`

### Context
Running the Biome CLI directly cannot post inline review comments on a PR.

### Decision
Changed the CI lint step from the Biome CLI to `reviewdog-action-biome` so that lint findings appear as inline PR comments. Also bumped `actions/checkout` to v5 and removed the `pull_request` trigger, limiting workflows to push-only.

### Consequences
- Improved review efficiency, since findings are shown directly on the PR.
- Restricting to push-only triggers means the CI execution path for PRs from forks needs separate consideration (details not determinable from this log alone).

---

## ADR-010: Migrating the persistence layer from `localStorage` to `IndexedDB`

- Status: Accepted
- Date: 2026-06-06
- Commit(s): `817c317` ("Implement IndexedDB storage module and migrate localStorage data"), `b65b443` (migration function implementation), `9f0e664` (changing download logic from `localStorage` dependence to module-variable dependence), `f7aa5a2` (adding `storage.js`)

### Context
As noted in `docs/design.md` §1 / §11.2, `localStorage`'s synchronous API was a known constraint causing degraded write latency with large logs (5–10MB quota, performance degradation). "Migrate to IndexedDB (Dexie.js recommended)" was already listed as a future improvement candidate.

### Decision
Adopted `idb` (an IndexedDB wrapper library, now a dependency in `package.json`) and migrated log data persistence from `localStorage` to IndexedDB. To avoid losing existing users' data, a one-time migration from `localStorage` to IndexedDB runs at startup. The download feature was changed to go through module variables instead of directly referencing `localStorage`.

### Consequences
- Responsiveness improved for large logs thanks to the asynchronous API.
- Migration code must be retained for existing users' backward compatibility (removal timing to be decided separately).
- The storage layer's abstraction was consolidated into `js/lib/storage.js` (later `src/lib/storage.ts`).

---

## ADR-011: Supply-chain hardening via `.npmrc`

- Status: Accepted
- Date: 2026-06-06
- Commit(s): `2c72408` ("Add .npmrc configuration file with script ignoring and release age settings")

### Context
In the same spirit as the Takumi Guard adoption in ADR-008, the project wanted to reduce the risk of automatic script execution during `npm install`/`pnpm install`, and the risk of pulling in package versions that were just published (where malicious code is relatively more likely to be present).

### Decision
Set the following in `.npmrc`:
```
ignore-scripts=true
min-release-age=7
```
This disables script execution (e.g. postinstall) during installation, and avoids automatically adopting package versions published less than 7 days ago.

### Consequences
- Reduced the attack surface from install-time scripts.
- `ignore-scripts=true` may require manual intervention for packages that perform native builds via postinstall.

---

## ADR-012: Full migration to Vite + React + TypeScript (from vanilla JS)

- Status: Accepted (supersedes ADR-002)
- Date: 2026-06-13
- Commit(s): `738e60b` ("Add Japanese localization, implement IndexedDB for storage, and refactor download functionality") — this commit included the Vite setup, a committed `dist/` build artifact, removal of `config.html`, and the addition of TypeScript configuration.

### Context
Changes documented in the commit message body:
- Created a Japanese localization file for the app
- Implemented IndexedDB for storing and retrieving application data (concurrent with ADR-010)
- Extended the download feature to support HTML, Markdown, and plain-text formats
- Set up Vite for build, development, and PWA support
- Removed the legacy Service Worker and integrated a new caching strategy
- Introduced TypeScript for type safety

The "Zero-Build Principle" documented in `docs/design.md` (Version 2, target version 26.02.05) effectively ended at this point.

### Decision
Retired the vanilla-JS structure under `js/` and migrated to a React (`App.tsx`, `ConfigApp.tsx`, `components/`) + TypeScript structure under `src/`. The build/dev server is Vite (`vite.config.js`). PWA support was delegated to `vite-plugin-pwa` (Workbox-based), ending the practice of hand-writing `sw.js`.

### Consequences
- Progress toward resolving the long-standing known constraint of having to manually maintain the SW's `assets` list (ADR-003 / `docs/design.md` §11.1), thanks to Workbox's auto-generation.
- A build step became mandatory, ending ADR-002's "zero-build" principle; the development flow now assumes `npm run dev` / `npm run build`.
- Some statements in `docs/design.md` and the contemporary `CLAUDE.md` ("no build step, no bundler") became outdated and inconsistent with reality after this migration. Documentation updates are needed separately.
- i18n (ADR-013), GA4 removal (ADR-005), and the IndexedDB migration (ADR-010) all happened around the same time, making this effectively a single "major rewrite" commit.

---

## ADR-013: Replacing the i18n engine with i18next / react-i18next

- Status: Accepted (supersedes ADR-004)
- Date: 2026-06-13
- Commit(s): concurrent with `738e60b` (addition of `src/i18n/index.ts`, `src/i18n/locales/{en,ja}.json`)

### Context
Following the React migration (ADR-012), the custom `Multilingualization` class, which manipulated the DOM directly, did not fit well with React's rendering model.

### Decision
Adopted `i18next` + `react-i18next`, which integrate naturally with the React component tree, and consolidated translation resources into `src/i18n/locales/*.json`.

### Consequences
- Translation keys can now be referenced naturally from React Hooks (e.g. `useTranslation`).
- Preventing translation flash (the problem ADR-004 addressed) is now handled by i18next's initialization timing instead.

---

## ADR-014: Iterative fixes to the Service Worker update policy (including Workbox dev options)

- Status: Accepted
- Date: 2026-06-13
- Commit(s): `d1f1562` ("Fix service worker reload behavior and update workbox glob patterns for JSON files"), `89a18ff` ("Update service worker behavior to only reload on updates in production and remove unused runtime caching configuration"), `90c66b2` ("Update service worker logic to always check for updates and enable Workbox dev options")

### Context
Immediately after migrating to a Workbox-based SW in ADR-012, the project needed to balance "when should a reload be prompted" against "should SW behavior be verifiable in development too." Issues were found incrementally in the initial implementation, such as unnecessary reloads outside production and JSON assets being missed from the cache target.

### Decision
After three rounds of fixes, the policy converged on:
1. Include JSON files in Workbox's `globPatterns`.
2. Trigger automatic reload on SW update only in production.
3. Enable `devOptions` so Workbox behavior can be verified in development too, with update checks always running.

### Consequences
- SW behavior can now be verified in development, matching production.
- Prevents unwanted reloads in production that would interrupt a user's in-progress work.

---

## ADR-015: Migrating/adding static hosting on Netlify

- Status: Accepted
- Date: 2026-06-13
- Commit(s): `fa782ee` ("Add Netlify configuration for build process, headers, and redirects")

### Context
`docs/design.md` §8.1 already described static delivery via Netlify (no build, served directly on `git push`), but once a build step was introduced in ADR-012, Netlify's build process, headers, and redirect rules needed to be made explicit via `netlify.toml`.

### Decision
Added `netlify.toml`, defining the build command, response headers (cache control, etc.), and redirect rules.

### Consequences
- The Vite-built output (`dist/`) can now be served correctly on Netlify.
- Two hosting setups — the Docker/Nginx self-hosted configuration (`docs/design.md` §8.2) and the Netlify configuration — now both need to be maintained.

---

## ADR-016: Consolidating PWA manifest configuration into `vite.config.js` and removing the static `manifest.json`

- Status: Accepted
- Date: 2026-06-13
- Commit(s): `113ee31` ("Update manifest configuration in vite.config.js and remove obsolete manifest.json file")

### Context
`vite-plugin-pwa` (ADR-012) can dynamically generate the manifest from a configuration object, which had created duplicate management alongside the manually edited static `manifest.json`.

### Decision
Consolidated the manifest definition into the `VitePWA` plugin configuration in `vite.config.js`, and removed the repository's root-level `manifest.json`.

### Consequences
- Manifest and build configuration are now unified; the practice described in `docs/design.md` §3.1 of using the `version` field as the cache key has shifted to Workbox's own versioning mechanism.
- External documentation that directly referenced the old `manifest.json` (including `docs/design.md`) needed updating.

---

## ADR-017: Fixing PWA install button visibility control and install event handling

- Status: Accepted
- Date: 2026-06-13
- Commit(s): `2afbf5b` ("Fix PWA install button visibility and handle app installation event")

### Context
The flow documented in `docs/design.md` §3.4 (`beforeinstallprompt` → show button → `prompt()` → hide again based on the result) had a bug in the post-React-migration implementation: the button's visibility was toggled at unintended times, and the `appinstalled` event was not handled.

### Decision
Fixed the `beforeinstallprompt` capture and button-visibility logic, and explicitly handled the `appinstalled` event to hide the button once installation completes.

### Consequences
- Improved the UX of the install flow.
- The existing constraint that the button remains hidden in environments where `beforeinstallprompt` never fires (e.g. iOS Safari) is unchanged.

---

## ADR-018: Removing the unused `@juliusbrussee/caveman-code` dependency and standardizing on pnpm

- Status: Accepted
- Date: 2026-06-20

### Context
A CI run of `npm audit --audit-level=high` failed with a high-severity advisory in `undici` and a moderate one in `protobufjs`. Tracing the dependency graph (`npm ls protobufjs undici`) showed both came in transitively through `@juliusbrussee/caveman-code` (a `dependencies` entry in `package.json`), which itself pulled in `@juliusbrussee/caveman-agent`, `@juliusbrussee/caveman-ai`, `@juliusbrussee/caveman-tui`, and `@google/genai` — none of which are imported anywhere under `src/`. These are AI-agent-tooling packages unrelated to a client-only work-logging PWA, and confirmed unused via a project-wide search.

Separately, the project had been running two package managers in parallel: npm for local/Docker/Netlify installs (`package-lock.json` committed) and pnpm only for the audit CI step (`pnpm-lock.yaml` present locally but gitignored, stemming from ADR-008's CI switch). The two lockfiles could drift, and in this instance `npm audit` and `pnpm audit` reported different results against them — `pnpm install` after removing the dependency immediately resolved to "no known vulnerabilities found," while the stale `package-lock.json` still showed the failure.

### Decision
1. Removed `@juliusbrussee/caveman-code` from `package.json`'s `dependencies`.
2. Removed `package-lock.json` and regenerated a fresh `pnpm-lock.yaml` via `pnpm install` (363 packages dropped from the dependency tree).
3. Pinned the package manager via `"packageManager": "pnpm@10.33.2"` in `package.json`.
4. Updated `.gitignore` to track `pnpm-lock.yaml` and ignore `package-lock.json` instead (reversing the prior state).
5. Updated every `npm run`/`npm ci`/`npm install`/`npm audit` reference to its `pnpm` equivalent across `.github/workflows/audit.yml` (added `pnpm/action-setup`), `Dockerfile` (added `corepack enable`), `netlify.toml`, `playwright.config.ts`, `README.md`, `.claude/CLAUDE.md`, `.claude/rules/security.md`, and `docs/design.md`/`docs/spec/overview.md`/`docs/spec/todo.md`.

### Consequences
- `pnpm audit --audit-level=high` now reports zero vulnerabilities, unblocking CI.
- A single lockfile (`pnpm-lock.yaml`) is now the source of truth for installs everywhere (local dev, CI, Docker, Netlify), removing the class of bug where two lockfiles disagree about what's actually installed.
- Anyone relying on `npm` locally must switch to `pnpm` (`corepack enable` or a global `pnpm` install) — this is a workflow change for contributors, documented in the updated `README.md`/`CLAUDE.md`.
- This incident is a concrete illustration of why `docs/ADR.md`/`docs/design.md` flag supply-chain hygiene (ADR-008, ADR-011) as an ongoing concern: an unused dependency, added without a clear record of why, was the actual vector for the vulnerable transitive packages.

---

## Addendum: Items not yet finalized and not reflected in this log

- While tracing `git log`, two commit objects were found that are not part of the current branch (`develop`)'s history and are unreachable locally: `feat: add pnpm workspace configuration and update App component for improved date handling` (`871e8ae`) and `fix: update version number to 26.06.20 in package.json` (`cd4c079`). These belong to no branch and are not contained in `develop`/`main`/`origin/*`, so they have not been turned into ADRs as finalized decisions. If their content (pnpm workspace adoption, improved date-handling in the App component) is formally merged in the future, a separate ADR should be added at that time.
