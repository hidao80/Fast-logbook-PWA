---
name: analyzed-todo
description: Prioritized action-item list synthesized from the Security, Test, Database, Code Quality, Infrastructure, Developer Experience, and Performance analysis passes for Fast-logbook-PWA.
type: analysis
commit-hash: ceff98ab997a60d35e564821f2e6bf7b6c284128
---

# Todo

Synthesized from the 12 sibling analysis files under `.claude/analyzed/`. Grouped by category, most important first within each group. Ratings are taken verbatim from the source file where one was given; where a source made a recommendation without an explicit star rating, a rating is added here in *italics* and marked as added-by-this-pass.

## Security

- Commit the untracked root `index.html` (or otherwise fix the Vite entry point) — while framed as a build issue, an uncommitted fix sitting in the working tree is also a supply-chain/reproducibility risk (anyone relying on a clean clone gets a different, broken artifact). Source: `known_bugs.md`, `screens.md`, `infrastructure.md`. ⭐️⭐️⭐️⭐️⭐️
- Add `escapeHtml()` calls for `category`/`detail` inside `toMarkdown()` (`src/lib/download.ts:184`) for defense-in-depth consistency with `toHtml()`; not currently exploitable (the sole caller re-escapes downstream) but a latent XSS trap for any future caller. Source: `security.md` (M2), `known_bugs.md` (#3), `utilities.md`. ⭐️⭐️⭐️
- Add security headers (`Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`) via `netlify.toml`; meaningful defense-in-depth given 17 `dangerouslySetInnerHTML` call sites in `App.tsx`, even though all are currently sourced from static i18n keys, not user input. Source: `security.md` (M1). *⭐️⭐️⭐️ (added by this pass)*
- Treat the "all `dangerouslySetInnerHTML` sites use static `t()` keys" property as a protected invariant — document it (e.g. in a code comment or dev guideline) so a future change interpolating user/log data into a translation key doesn't silently introduce 17 simultaneous XSS vectors. Source: `security.md` (L1), `known_bugs.md` (#5). ⭐️⭐️⭐️
- Confirm whether Netlify's HTTPS/HSTS platform defaults are actually enabled for this site (unconfirmed from repo contents alone). Source: `security.md` (Transport security). *⭐️⭐️ (added by this pass)*

## Test

- Fix the routing bug in `tests/e2e/screenshot.spec.ts`: change `/config.html` to `/#/config` (the app uses `createHashRouter`) — currently the "config" test case screenshots the same content as the homepage test, giving the config screen zero real E2E coverage. One-line fix. Source: `test.md`. ⭐️⭐️⭐️⭐️⭐️
- Introduce a unit test framework (vitest is the natural fit given Vite) and add tests for `src/lib/*.ts` (`storage.ts`, `download.ts`, `utils.ts`) — currently zero unit test coverage on the core log-parsing, storage, and export logic. Source: `test.md`. ⭐️⭐️⭐️⭐️⭐️
- Add a CI workflow step that runs `pnpm exec playwright test` (with `playwright install --with-deps` first) so E2E regressions are caught automatically; lower priority since current E2E assertions are minimal (non-empty title only). Source: `test.md`. ⭐️⭐️⭐️
- Remove the redundant `test`/`test:e2e` script duplication in `package.json` (byte-for-byte identical commands). Source: `test.md`. *⭐️⭐️ (added by this pass)*

## Database

- Wrap `setItem`/`migrateFromLocalStorage` calls in `storage.ts` itself with try/catch (matching the existing `QuotaExceededError`-handling pattern already used around `localStorage.setItem` calls in `App.tsx`/`ConfigApp.tsx`), since an IndexedDB write failure during `flushBuffer` or migration is currently uncaught and could throw unhandled in an async IIFE. Source: `databases.md` (item 2). ⭐️⭐️⭐️
- Consider a `beforeunload` best-effort flush or explicit documentation of the window where a buffered draft (`log_buffer`/`log_buffer_date` in `localStorage`) can be lost between `saveLogs()` and the next `flushBuffer()` (e.g. on crash or storage-clearing event). Source: `databases.md` (item 1). ⭐️⭐️

## Code Quality

- Remove the unused `global` package from `package.json` dependencies (zero imports found anywhere in the repo) and refresh the lockfile. Source: `dependencies.md`. ⭐️⭐️⭐️⭐️⭐️
- Single-source the version string (currently manually duplicated across `package.json`, `src/i18n/locales/en.json`, `src/i18n/locales/ja.json`) — this already caused a real typo bug (`26.07/19`) that needed a follow-up fix commit. Generate the locale copies from `package.json` at build time or add a CI check that asserts all copies match. Source: `development-workflow.md`. ⭐️⭐️⭐️⭐️⭐️
- Split `App.tsx` (973 lines, ~4x the next-largest file, over this project's own 800-line file-size guideline) — extract custom hooks (`useInstallPrompt`, `useTheme`, `useLogEntries`) first as a low-risk, mechanical refactor; consider splitting presentational sub-components afterward if JSX portion remains large. Source: `components.md`. ⭐️⭐️⭐️⭐️
- Bump `typescript` from 6.0.3 to 7.0.2 (major version behind, confirmed via live `pnpm outdated`); evaluate the TS 7 changelog for breaking changes first — not urgent since `pnpm audit` is currently clean. Source: `dependencies.md`. ⭐️⭐️⭐️
- Rewrite the stale "Architecture" section of `AGENTS.md` (lines 29–61), which still describes the old vanilla-JS `js/main.js`/`js/config.js`/`js/lib/*.js` layout and contradicts the file's own later "Analyzed Documentation Index" section. Source: `development-workflow.md`. ⭐️⭐️⭐️⭐️
- Deduplicate the redundant double `parse()` call in `generateFormattedLog()` (`src/lib/download.ts`) — `toHtml()` and `toMarkdown()` each independently re-parse the same log text; pass pre-parsed data into both instead. Source: `performance.md`, `known_bugs.md` (#2). ⭐️⭐️⭐️
- Clarify/update `.claude/rules/code-style.md`'s "modules inside `js/lib/` must not depend on each other" rule, which is stale (refers to the removed vanilla-JS `js/lib/`) and is currently contradicted by `src/lib/download.ts`'s imports of both `storage.ts` and `utils.ts`. Source: `components.md`. *⭐️⭐️ (added by this pass)*

## Infrastructure

- Add a `build.yml` CI workflow (or extend an existing one) that runs `pnpm run build` on push/PR — neither `lint.yml` nor `audit.yml` currently builds the app, so the missing-`index.html` entry-point break at HEAD would not have been caught. Source: `infrastructure.md`, `development-workflow.md`, `known_bugs.md` (#1). ⭐️⭐️⭐️⭐️⭐️
- Add a `pull_request` trigger to CI workflows — both `lint.yml` and `audit.yml` currently trigger only on `push` to `main`/`develop`, contradicting `AGENTS.md`'s documented claim that CI runs "on push/PR." This also means lint/audit findings don't block PR merges. Source: `development-workflow.md`. ⭐️⭐️⭐️⭐️
- Investigate/fix the `lint.yml` `reviewdog-action-biome` `github-pr-review` reporter, which is designed to post inline PR review comments but the workflow has no `pull_request` trigger to attach comments to — plausible misconfiguration, not confirmed by execution. Source: `development-workflow.md`. ⭐️⭐️⭐️
- Verify whether GitHub Pages is actually enabled for this repo and document `docs/`'s intended purpose (appears to be a standalone landing page, separate from the Vite/Netlify build output) to avoid future ambiguity. Source: `infrastructure.md`. ⭐️⭐️⭐️
- Clarify/consolidate the dual Netlify + Docker/nginx deployment paths, which look like possible legacy/experimental duplication rather than an intentional multi-target strategy. Source: `configurations.md`. ⭐️⭐️⭐️
- Make the `Dockerfile`'s build step fail hard instead of silently falling back to copying the entire build context (including `node_modules`/source) when `dist/` is absent. Source: `configurations.md`. ⭐️⭐️⭐️

## Developer Experience

- Fix the mismatch between `AGENTS.md`'s documented dev commands and the actual `package.json` scripts (it omits `build`, `preview`, `test:e2e`, `test:e2e:headed`). Source: `development-workflow.md`. *⭐️⭐️⭐️ (added by this pass)*
- Document the project's commit-message convention (currently an undocumented mix of Conventional Commits and older gitmoji-prefixed messages, with no `CONTRIBUTING.md` or commitlint enforcement). Source: `development-workflow.md`. ⭐️⭐️

## Performance

- No route-level code splitting (`React.lazy`) exists for `/` vs `/config` — both are statically imported into the initial bundle. Low priority given the app's small size; worth revisiting if a bundle audit shows `ConfigApp` adding meaningful weight. Source: `performance.md`. ⭐️⭐️
- Bootstrap CSS/icon fonts are statically imported in full (`main.tsx`) rather than scoped/tree-shaken. Source: `performance.md`. ⭐️
- `flushBuffer` does an O(n log n) sort on the full log on every buffer flush; no action needed without evidence real-world logs grow large enough to matter. Source: `performance.md`. ⭐️

<!-- commit-hash: ceff98ab997a60d35e564821f2e6bf7b6c284128 -->
