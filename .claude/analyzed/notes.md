---
name: analyzed-notes
description: Cross-cutting observations and documentation-freshness warnings synthesized from the other 12 analysis files for Fast-logbook-PWA, covering the broken build entry point, stale AGENTS.md content, CI coverage gaps, and duplicated version strings.
type: analysis
commit-hash: ceff98ab997a60d35e564821f2e6bf7b6c284128
---

# Notes

Synthesis file. Does not re-derive findings already detailed in the 12 sibling files (`dependencies.md`, `infrastructure.md`, `databases.md`, `screens.md`, `configurations.md`, `components.md`, `utilities.md`, `performance.md`, `known_bugs.md`, `security.md`, `test.md`, `development-workflow.md`) — see those for full evidence and line numbers.

## The single biggest cross-cutting risk: root `index.html`

Four independent files (`known_bugs.md`, `screens.md`, `infrastructure.md`, `configurations.md`) converge on the same fact from different angles:

- Commit `ceff98a` deleted root `index.html` with nothing restoring it.
- The current working tree has it back only as an **untracked** file — locally, `pnpm run build` succeeds and masks the problem.
- A clean clone/checkout of HEAD fails the Vite build (`[UNRESOLVED_ENTRY]`), which cascades to **Netlify** (`netlify.toml` runs the same `pnpm run build`) and **Docker** (`Dockerfile`'s builder stage runs the same command, and its "fallback" path would then silently serve `node_modules`/source instead of failing loudly).
- No CI workflow runs `pnpm run build`, so none of the three deploy paths (Netlify, Docker, or a hypothetical CI merge gate) would catch this before it reaches production.
- Fix is trivial (`git add index.html && git commit`), rated ⭐️⭐️⭐️⭐️⭐️ consistently across all four files. This is the single highest-priority action item in the entire analysis set.

## Documentation freshness: AGENTS.md is self-contradicting

`development-workflow.md` confirms `AGENTS.md`'s own "Architecture" section (lines 29–61) still describes the deleted vanilla-JS `js/lib/` layout, `index.html`+`config.html` two-page structure, and old localStorage key names (`log`, `rounding_mins`) — despite the repo having fully migrated to React 19 + TypeScript + Vite (confirmed independently by `screens.md`, `configurations.md`, `dependencies.md`). `AGENTS.md` even contains a later section acknowledging this section is outdated and pointing readers to `.claude/analyzed/` instead of fixing it. This is a known, self-flagged, unresolved gap — not new information, but worth restating here since it affects how any AI agent or new contributor should weight `AGENTS.md` vs. this `.claude/analyzed/` directory: **treat `.claude/analyzed/*.md` as authoritative over `AGENTS.md`'s Architecture section** until that section is rewritten. Rating: ⭐️⭐️⭐️⭐️ (high value, low effort).

The project's own `.claude/rules/code-style.md` and `.claude/rules/security.md` (checked into git, read as part of this session's system context) similarly describe the old vanilla-JS module system (`js/lib/`, `$$one()`/`$$all()` DOM helpers, `escapeHtml()` from `js/lib/utils.js`) rather than the current `src/lib/*.ts` React structure. These rule files were **not in scope to edit** in this pass, but they are additional instances of the same stale-vanilla-JS-documentation pattern already flagged for `AGENTS.md`. Flagging for future cleanup: ⭐️⭐️⭐️.

## CI: documented behavior does not match actual workflow files

Three files (`infrastructure.md`, `development-workflow.md`, `test.md`) independently confirm the same three gaps in `.github/workflows/*.yml`:

1. Both `lint.yml` and `audit.yml` trigger on `push` only — no `pull_request` trigger — contradicting `AGENTS.md`'s claim of push/PR triggers.
2. `lint.yml` uses `reviewdog-action-biome` with a PR-review reporter (`github-pr-review`) on a non-PR trigger, which is plausibly a no-op for comment-posting purposes (unconfirmed by execution).
3. Neither workflow runs `pnpm run build`, `pnpm exec playwright test`, or a TypeScript type-check. This is the same root cause that let the `index.html` deletion reach `main`/`develop` unnoticed, and also means the (currently non-functional) E2E config-route test would not block a merge even if it existed.

## Test coverage is effectively zero outside screenshots

`test.md` confirms no unit test framework is installed at all (`src/lib/storage.ts`, `download.ts`, `utils.ts` — the core persistence/parsing/export logic — have zero automated coverage), and the one Playwright spec navigates to `/config.html`, a path that doesn't exist under the app's `createHashRouter` setup (`screens.md` confirms the real route is `/#/config`). So the config screen currently has **no working E2E coverage**, and the only existing test assertion is "page has a non-empty title." Combined with the CI gap above, this means the project currently has no automated safety net for regressions in log parsing, storage, or the config screen.

## Version string duplication already caused a real bug

`development-workflow.md` traces a concrete incident: `da702ec` introduced a typo (`26.07/19` instead of `26.07.19`) into one of the three manually-duplicated copies of the version string (`package.json`, `src/i18n/locales/en.json`, `src/i18n/locales/ja.json`), fixed in the very next commit (`68aa9d2`). This is not speculative — it is observed, recent history. No automated single-source-of-truth mechanism exists. Rating: ⭐️⭐️⭐️⭐️⭐️ (already caused a bug; cheap to fix via a build-time define or CI consistency check).

## Deployment target ambiguity

`configurations.md` and `infrastructure.md` both note that Netlify (`netlify.toml`) and Docker/nginx (`Dockerfile` + `docker-compose.yml`) are two fully independent, seemingly redundant deployment paths, with a third possible target (`docs/` — a hand-authored static page, possibly for GitHub Pages, not wired into any build pipeline). Which of these is the actual production deployment is **unconfirmed from repository contents alone** (Netlify dashboard / GitHub Pages settings are not visible to static analysis). Speculative recommendation: consolidate or document intent. Rating: ⭐️⭐️⭐️.

## Security posture: consistent, low actual risk

`security.md` and `known_bugs.md` agree: all 17 `dangerouslySetInnerHTML` sites in `App.tsx` are sourced from static, bundled i18next translation keys (not user/log data), and the one `document.write()` call path is fully escaped via `escapeHtml()`. The one real gap — `toMarkdown()` not escaping category/detail text, unlike `toHtml()` — is currently masked because its only caller re-escapes the whole block downstream, but both files flag it as an architectural fragility that would become exploitable the moment `toMarkdown()` gets a second, more direct caller (e.g. a standalone `.md` export feature). No secrets, no backend, `pnpm audit` clean, SRI present on all CDN references in exported HTML. This is a coherent, low-risk picture across both independent audits — no contradictions found between the two files.

## Analysis basis and scope of this pass

This synthesis, and the 12 sibling files it draws from, reflect a single snapshot at commit `ceff98ab997a60d35e564821f2e6bf7b6c284128` (branch `develop`), including the specific working-tree state at that time (notably the untracked `index.html`). Re-running this analysis after further commits should treat all of the above as potentially stale, especially the `index.html` build-breakage finding, which depends on working-tree/git state rather than committed content alone.

**Explicitly out of scope for this update pass** (not touched, not verified, not re-synthesized here):
- `overview.md`
- `todo.md`
- `naming_convention.md`
- `use_cases.md`
- The pre-existing `ADR.md` and `graphrag.jsonld` files under `.claude/analyzed/`

These files were not read or updated as part of this session and may still reflect an older (possibly vanilla-JS-era) state of the repository. Anyone relying on them should independently verify freshness before trusting their content, given the same stale-documentation pattern already confirmed in `AGENTS.md` and the project's `.claude/rules/*.md` files.

<!-- commit-hash: ceff98ab997a60d35e564821f2e6bf7b6c284128 -->
