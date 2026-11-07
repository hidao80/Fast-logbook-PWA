---
name: analyzed-ADR
description: Git-log-derived architecture decision timeline, supplemental ADRs for the pre-2026 era, and verification of docs/ADR.md against actual history.
type: analysis
commit-hash: ccf3240
---

# Architecture Decision Records (git-log reconstruction)

- [Relation to docs/ADR.md](#relation-to-docsadrmd)
- [Decision Timeline](#decision-timeline)
- [Supplemental ADRs (pre-2026-02 era)](#supplemental-adrs-pre-2026-02-era)
- [Supplemental ADRs (2026-07 era, not yet in docs/ADR.md)](#supplemental-adrs-2026-07-era-not-yet-in-docsadrmd)
- [Supplemental ADRs (2026-08 era, not yet in docs/ADR.md)](#supplemental-adrs-2026-08-era-not-yet-in-docsadrmd)
- [Supplemental ADRs (2026-08-13 → 2026-11-08)](#supplemental-adrs-2026-08-13--2026-11-08)
- [Verification: docs/ADR.md vs. git log](#verification-docsadrmd-vs-git-log)

## Relation to docs/ADR.md

[docs/ADR.md](../../docs/ADR.md) (ADR-001 … ADR-018) is the **canonical** decision record and covers 2026-02-19 onward, but not yet the 2026-07-05/2026-07-19 commits below. This file is derived from the complete git history (195 commits reachable from `develop` including merges, 2024-07-06 → 2026-07-19, all hashes verified — Factual) and adds: (1) a one-page timeline, (2) supplemental ADRs numbered **ADR-101+** for eras docs/ADR.md does not cover (numbered separately to avoid collision), (3) discrepancy findings. Where the two disagree on dates, **this file follows commit dates**.

> **Update (2026-11-08):** The canonical ADR-001 … ADR-018 file was deleted from `docs/` in `b46f0b7` (2026-07-19), and this reconstruction was moved from `.claude/analyzed/ADR.md` to `docs/ADR.md` in `0b17e74` (2026-08-13) — see ADR-115. References below to "docs ADR-0xx" therefore point to the historical file, readable with `git show b46f0b7^:docs/ADR.md`. (Factual)

## Decision Timeline

| Date | Decision | Commit(s) | Record |
| --- | --- | --- | --- |
| 2024-07-06 | Inception: client-only vanilla-JS PWA, localStorage, no build | `82668d8`, `209b255` | ADR-101; docs ADR-001/002 (dates corrected below) |
| 2024-07-09 | `escapeHtml()` + sanitize categories/details (XSS defense) | `6c89ed6`, `c160786` | ADR-102 |
| 2024-07-14 | Bootstrap 5.3 dark theme; install button added then **removed** | `81a1425`, `133b89f`, `31f6ce2`→`560585d` | ADR-103 |
| 2024-08-11 | Save-status lamp (dirty/saved) — PR #1; Bootstrap delete dialog — PR #2 | `669543b`…`2630cc6`, `57cc93c` | ADR-104 |
| 2024-08-17 | Android IME Enter-key handling (`keyCode 229`) | `d05adc5`, `c94d078`, `99eb95c` | ADR-105 |
| 2025-03-06 | Help screen + multilingual support — PR #3 | `12e5489`, `b6662b4` | ADR-106 |
| 2025-08-05 | Speculation Rules API preloading | `c411cb6` | ADR-107 |
| 2025-11-14 | PWA display mode fullscreen → standalone | `dbd0dbf` | ADR-107 |
| 2025-12-09…17 | ESLint CI, Dockerfile; Bootstrap ES-module import tried then reverted to global load | `a9a35b4`, `5bb781d`, `9390f2a`→`14c2fa0` | ADR-108 |
| 2026-01-17 | CI split audit/docker/lint; Docker workflow removed same day | `6004114`, `380cee2` | ADR-108 |
| 2026-02-05 | GA4 analytics first added | `d7f57b3`, `ef46e13` | docs ADR-005 (date corrected below) |
| 2026-02-19 | ESLint→Biome; design doc added; GA4 formalized as analytics.js | `562e061`, `16ac153`, `39d1f37` | docs ADR-004/005/006 |
| 2026-03-03 | Playwright E2E + Biome CI action | `1eef011` | docs ADR-006 |
| 2026-03-13 | `.claude/` tracked; Takumi Guard; push-only CI; reviewdog (PR #6 = `8b59a81` on main) | `f1e1546`…`e0b341f` | docs ADR-007/008/009 |
| 2026-06-06 | IndexedDB migration; GA4 **removed**; `.npmrc` hardening; date roll-over feature | `817c317`, `f7aa5a2`, `2c72408`, `c7bc733` | docs ADR-005/010/011 |
| 2026-06-13 | React + TypeScript + Vite full rewrite; Workbox SW; i18next; Netlify config; manifest into vite.config | `738e60b`…`2afbf5b` | docs ADR-012…017 |
| 2026-06-20 | pnpm unification (superseded by bun, ADR-116); caveman-code dependency removed; TypeScript consolidation of lib modules; `.actrc` | `5b8968c`, `67b881f`, `d363d07` | docs ADR-018 |
| 2026-07-05 | GitHub Pages landing page (`docs/index.html`) added; CI hardening: `actions/checkout@v6`, Node 24 for audit workflow | `b7c61f6`, `2e39c80`, `7ee4625`, `d8eeb5f` | ADR-109 (not yet in docs/ADR.md) |
| 2026-07-19 | IME `isComposing` guard extended from `App.tsx` to `ConfigApp.tsx` shortcut inputs | `3c1d5dd`, `3984370` | ADR-110 (not yet in docs/ADR.md) |
| 2026-07-19 | Version-string correction: `26.07/19` → `26.07.19` (invalid slash separator) across `package.json` and locale files | `160b39b`, `da702ec`, `68aa9d2` | ADR-111 (not yet in docs/ADR.md) |
| 2026-08-13 | `pnpm-workspace.yaml` overrides (moved to `package.json` `overrides` on 2026-08-14, ADR-116) pin transitive deps (`brace-expansion`, `fast-uri`, `nanoid`, `postcss`, `react-router`) past known-vulnerable ranges; direct deps bumped | `ceff98a` | ADR-112 (not yet in docs/ADR.md) |
| 2026-08-13 | Agent-instruction file renamed `.claude/CLAUDE.md` → `AGENTS.md`; `.claude/rules/*` (assistant-style, code-style, security) deleted; root `CLAUDE.md` now a 1-line `@AGENTS.md` pointer | `ceff98a` | ADR-113 (not yet in docs/ADR.md) |
| 2026-08-13 | Navbar wrapped in `<form>` carrying non-standard `toolname`/`tooldescription` attributes (AI-agent tool discoverability) | `ceff98a` | ADR-114 (not yet in docs/ADR.md) |
| 2026-08-13 | Analysis reports untracked; this reconstruction promoted to `docs/ADR.md`; `docs/design.md` → `docs/DESIGN.md`; `docs/llms.txt` added; root `index.html` restored | `ccbe3b3`, `992c35b`, `0b17e74`, `1c9e92a`, `4d388cc` | ADR-115 |
| 2026-08-14 | Package manager pnpm → bun (`bun.lock`, `packageManager: bun@1.3.14`); overrides moved into `package.json`; Dockerfile, Playwright `webServer`, Netlify, docs follow | `d5c2a6c`, `c298ebf`, `53ebde6`, `2a29f70`, `c0c5f81`, `4a0da9d` | ADR-116 |
| 2026-08-16 | Landing page made multilingual (en/ja/zh/es/ru) via `multilanguagejs` from unpkg | `df5bbb3` | ADR-117 |
| 2026-08-16 | Project-local agent skills under `.claude/skills/` (later removed, 2026-11-08) | `bc8df62` → `def9b85` | ADR-118 |
| 2026-09-05 | Dependency refresh incl. **TypeScript 6 → 7** major; `fast-uri` added as direct dependency | `751cd1a` | ADR-119 |
| 2026-09-05 | Dependabot for GitHub Actions; reviewdog-action-biome v1 → v2 | `ab8203c`, `0da2ea1` | ADR-120 |
| 2026-09-12 | Landing page social preview image; OGP/Twitter image URLs made absolute | `de8779c`, `83ad86f`, `76cf312` | ADR-117 |
| 2026-11-08 | `.npmrc` replaced by `bunfig.toml` (`ignoreScripts`, `minimumReleaseAge`) | `29e37d7` | ADR-121 |
| 2026-11-08 | Playwright E2E workflow in CI; all workflow actions pinned to commit SHAs | `2294334` | ADR-122, ADR-120 |
| 2026-11-08 | Root `CLAUDE.md` pointer and `.claude/skills/*` removed | `def9b85` | ADR-118 |
| 2026-11-08 | Landing page adds zh-TW/de, localized log sample, categorized tech-stack list; `llms.txt` lists tech stack | `ccf3240`, `18df046` | ADR-117 |

## Supplemental ADRs (pre-2026-02 era)

All Factual (reconstructed from commit messages; rationale beyond messages is inference marked Speculative).

### ADR-101: Client-only vanilla-JS PWA (inception)
- Status: Superseded by docs ADR-012 (React rewrite) for implementation; the client-only principle itself still stands (docs ADR-001)
- Date: 2024-07-06 — Commits: `82668d8` (first commit), `209b255` (1st release)
- Decision: Ship a same-day-releasable work logger as static vanilla JS + localStorage, no server. Released as v1 the day the repo was created.
- Consequence: Zero-infra distribution; every later era (lint, CI, IndexedDB, React) is layered on this baseline.

### ADR-102: Escape user content at HTML generation time
- Status: Accepted (carried into `src/lib/utils.ts` today)
- Date: 2024-07-09 — Commits: `6c89ed6` (add `escapeHtml()`), `c160786` (sanitize categories/details)
- Decision: Fix the exported-HTML injection path 3 days after release with a 5-char escaper applied to all user-controlled fields.
- Consequence: The pattern (escape at output, not input) survives unchanged through the React rewrite.

### ADR-103: Bootstrap 5.3 theming; install button withdrawn
- Status: Theme accepted; install button re-introduced 2026-06-13 (`2afbf5b`, docs ADR-017)
- Date: 2024-07-14 — Commits: `81a1425`, `133b89f` (dark theme); `31f6ce2` → `560585d` (install button added, then removed because `beforeinstallprompt` did not fire)
- Decision: Adopt Bootstrap 5.3's `data-bs-theme` for dark mode; postpone the PWA install button after the event proved unreliable.
- Consequence: `autoSetTheme()` still implements this. The install button took ~23 months to return.

### ADR-104: Save-status lamp and Bootstrap-native dialogs
- Status: Accepted (today's `navbar-save-status` dot and `Modal.tsx` are the descendants)
- Date: 2024-08-11 — Commits: PR #1 (`2630cc6` merge) for the dirty/saved lamp incl. IME timing fix (`e83e50c`); PR #2 (`57cc93c`) rebuilt the delete confirmation on Bootstrap.
- Decision: Show unsaved-state visually instead of a save button; standardize dialogs on Bootstrap markup.
- Consequence: Color-only lamp remains an open accessibility item ([todo.md](todo.md)).

### ADR-105: Android IME Enter-key handling via `isComposing` + `keyCode === 229`
- Status: Accepted — **do not simplify** ([notes.md](notes.md))
- Date: 2024-08-17 — Commits: `d05adc5`, `c94d078`, `6a079bb`, `99eb95c` (plus a same-day debugging series `1a75812`…`bf18d66`)
- Decision: After a day-long debugging session, gate Enter-key log submission on `!isComposing && keyCode !== 229` to stop Android IMEs from swallowing or double-firing entries.
- Consequence: Preserved verbatim in `App.tsx` (`handleInputKeydown` / `handleTextareaKeydown`). The commit density here is why the rule "test the IME path when touching key handlers" matters.

### ADR-106: Help screen with multilingual content
- Status: Accepted (now `HelpModal` in `App.tsx`, content in i18n JSON)
- Date: 2025-03-06 — Commits: PR #3 (`12e5489`), `b6662b4`
- Decision: In-app help (usage + examples) rather than external docs, translated via the then-custom i18n engine.
- Consequence: Help content migrated into `i18next` resources at the React rewrite; its size is why `dangerouslySetInnerHTML`-from-static-JSON is used.

### ADR-107: Progressive platform enhancements (Speculation Rules; standalone display)
- Status: Accepted
- Date: 2025-08-05 (`c411cb6`), 2025-11-14 (`dbd0dbf`)
- Decision: Add Chromium-only Speculation Rules preloading as progressive enhancement; change manifest display from `fullscreen` to `standalone` for normal OS chrome.
- Consequence: Speculation Rules still present in `index.html`; harmless elsewhere.

### ADR-108: First CI/CD & containerization era (ESLint workflow, Dockerfile, CI split)
- Status: Superseded by docs ADR-006/008/009 (Biome, Takumi Guard, reviewdog) and docs ADR-018 (pnpm; itself superseded by bun, ADR-116)
- Date: 2025-12-09 … 2026-01-17 — Commits: `a9a35b4` (eslint workflow), `5bb781d` (Dockerfile), `6004114` (audit/docker/lint CI split), `380cee2` (Docker workflow removed same day)
- Decision: Introduce lint CI on ESLint, a Docker/Nginx self-host option, and separate audit/lint workflows. A Bootstrap ES-module import attempt (`9390f2a`, 2025-12-13) was reverted to a global `<script>` load (`14c2fa0`, 2025-12-17) after breakage.
- Consequence: The ESLint→Biome migration two months later (docs ADR-006) cites this era's vulnerability pain. The Docker image build workflow was abandoned but the Dockerfile itself survives.

## Supplemental ADRs (2026-07 era, not yet in docs/ADR.md)

### ADR-109: GitHub Pages landing page and CI action-version hardening
- Status: Accepted
- Date: 2026-07-05 — Commits: `b7c61f6` (`docs/index.html`, 397 lines, responsive + multilingual landing page), `2e39c80` (`docs/img/icon_256.png`, `.nojekyll`), `7ee4625` (audit workflow Node 20→24), `d8eeb5f` (`actions/checkout@v5`→`v6` in audit + lint workflows)
- Decision: Publish a static marketing/landing page under `docs/` for GitHub Pages, separate from the app itself (`docs/` is not part of the Vite build); bump CI action/runtime pins opportunistically in the same session.
- Consequence: `docs/` now serves two purposes — Pages source and design-doc storage (`docs/design.md`, `docs/spec/`). No collision today since `index.html` is new, but future `docs/*.md` additions should confirm they don't get swept into the Pages site unintentionally.

### ADR-110: IME composing-guard extended to ConfigApp shortcut inputs
- Status: Accepted
- Date: 2026-07-19 — Commits: `3c1d5dd` (guard `handleShortcutChange` on `isComposing`, defer persistence), `3984370` (replace a shared composition ref with a native `(e.nativeEvent as InputEvent).isComposing` check)
- Decision: Apply the ADR-105 principle (never persist a value mid-IME-conversion) to the config screen's 9 shortcut text inputs, which had no such guard; drop a shared mutable ref in favor of reading `isComposing` directly off the native input event per keystroke.
- Consequence: Second known call site for the IME-guard pattern, alongside `App.tsx`'s Enter-key handling (ADR-105). Confirms the "do not simplify the IME check" guidance in [notes.md](notes.md) generalizes beyond the original textarea — any future text input taking IME (Japanese/Chinese/Korean) input should be checked for the same gap.

## Supplemental ADRs (2026-08 era, not yet in docs/ADR.md)

### ADR-111: Version-string separator fix
- Status: Accepted
- Date: 2026-07-19 — Commits: `160b39b` (sync commit hashes in analyzed docs), `da702ec` (bump `package.json` to `26.07/19`), `68aa9d2` (correct to `26.07.19` in `package.json`, i18n locale files, `vite.config.js`)
- Decision: A same-day version bump first used a slash separator (`26.07/19`), which was not valid semver-adjacent formatting for this project; corrected to dot-separated (`26.07.19`) 11 minutes later.
- Consequence: Confirms the release-versioning convention is `YY.MM.DD` with dots throughout, including i18n locale metadata and `vite.config.js`.

### ADR-112: pnpm workspace overrides for transitive-dependency CVEs
- Status: Accepted in intent; mechanism superseded by ADR-116 (overrides moved from `pnpm-workspace.yaml` to `package.json` `overrides` in `d5c2a6c`)
- Date: 2026-08-13 — Commit: `ceff98a`
- Decision: Add `pnpm-workspace.yaml` with an `overrides:` block pinning `brace-expansion`, `fast-uri`, `nanoid`, `postcss`, and `react-router` to patched version ranges regardless of what direct/transitive dependencies request; bump direct devDependencies (`@biomejs/biome`, `@playwright/test`, `@types/react*`, `@vitejs/plugin-react`, `vite`) and dependencies (`i18next`, `react`, `react-dom`, `react-i18next`, `react-router-dom`) to their latest patch/minor versions in the same commit.
- Consequence: Closes the audit gap the CI `pnpm audit --audit-level=high` step would otherwise flag; `pnpm-lock.yaml` was regenerated (1191-line diff). Future dependency bumps should check whether these override ranges are still needed or can be dropped once upstream packages naturally satisfy them.

### ADR-113: Agent-instruction file consolidated into `AGENTS.md`
- Status: Accepted; the root `CLAUDE.md` pointer was later removed (ADR-118)
- Date: 2026-08-13 — Commit: `ceff98a`
- Decision: Rename `.claude/CLAUDE.md` to root-level `AGENTS.md` (the emerging cross-tool convention for agent instructions, also read by Codex per this project's own `AGENTS.md` header); replace it with a 1-line root `CLAUDE.md` containing `@AGENTS.md`. Delete `.claude/rules/assistant-style.md`, `.claude/rules/code-style.md`, and `.claude/rules/security.md` (137 lines total) without replacement content elsewhere in `.claude/`.
- Consequence: Single canonical instruction file (`AGENTS.md`) now serves both Claude Code and Codex, referenced by `@AGENTS.md` import syntax. The deleted `.claude/rules/*` content is not preserved in `AGENTS.md` verbatim — if any of assistant-style/code-style/security guidance was still load-bearing, it needs to be confirmed present in `AGENTS.md` or intentionally dropped.

### ADR-114: Navbar `<form>` wrapper with AI-agent tool attributes
- Status: Accepted
- Date: 2026-08-13 — Commit: `ceff98a`
- Decision: Wrap the navbar (and everything through the end of the component tree) in `App.tsx` with `<form toolname="fast_logbook" tooldescription="...">`, plus a matching `#root > form` flex layout rule in `css/main.css`. `toolname`/`tooldescription` are non-standard HTML attributes intended for AI browser agents to discover available in-page operations (view/add/edit/export/edit-shortcuts).
- Consequence: First instance of AI-agent-discoverability markup in this codebase; establishes a pattern (`<form toolname=... tooldescription=...>` as an agent-affordance wrapper) that may recur if more AI-agent-facing surfaces are added. Not part of any W3C spec — a browser or extension that does not understand it will simply ignore it.

## Supplemental ADRs (2026-08-13 → 2026-11-08)

Reconstructed from commits after `e021877`. Commit messages rarely state rationale; inferred context is marked Speculative.

### ADR-115: Documentation restructure — analysis reports untracked, ADR reconstruction promoted to `docs/`
- Status: Accepted
- Date: 2026-08-13 — Commits: `ccbe3b3` (delete tracked `.claude/analyzed/*` reports), `992c35b` (`.gitignore` adds `.claude/analyzed/`, `.claude/histories/`), `0b17e74` (`.claude/analyzed/ADR.md` → `docs/ADR.md`; `docs/design.md` → `docs/DESIGN.md`), `1c9e92a` (`docs/llms.txt`), `4d388cc` (restore root `index.html`, fixing the build broken by its deletion in `ceff98a`)
- Context (Speculative): Generated analysis reports churned on every re-analysis and did not belong in history; the ADR reconstruction was the one report worth publishing.
- Decision: Keep machine-generated analysis local-only; publish this file as the project's ADR; add an `llms.txt` index for LLM consumers of the Pages site.
- Consequence: `docs/llms.txt` and `AGENTS.md` still link `design.md` (lower-case) although the file is now `docs/DESIGN.md` — broken on case-sensitive hosts such as GitHub Pages. (Factual for the link text; impact on Pages Speculative)

### ADR-116: Package manager pnpm → bun
- Status: Accepted; supersedes docs ADR-018 (pnpm unification, 2026-06-20)
- Date: 2026-08-14 — Commits: `d5c2a6c` (drop `pnpm-lock.yaml`/`pnpm-workspace.yaml`, add `bun.lock`, `packageManager: bun@1.3.14`, overrides into `package.json`), `c298ebf` (Dockerfile), `53ebde6` (Playwright `webServer`), `2a29f70` (AGENTS.md), `c0c5f81` (Netlify build), `4a0da9d` (README, DESIGN.md)
- Decision: Use bun for install, scripts, and audit everywhere (local, CI, Docker, Netlify).
- Consequence: `4a0da9d` also ran a pnpm→bun text replacement over this file, rewriting historical entries (2026-06-20 row, ADR-108, ADR-112) as if bun had been used at the time; those entries were restored to pnpm in this update. CI `bun-version` (1.3.14) is pinned separately from `packageManager`, so the two must be bumped together.

### ADR-117: Landing page client-side i18n via `multilanguagejs`
- Status: Accepted
- Date: 2026-08-16 (`df5bbb3`); extended 2026-09-12 (`de8779c`, `83ad86f`, `76cf312`) and 2026-11-08 (`ccf3240`, `18df046`)
- Decision: Localize `docs/index.html` with `<template type="language-group">` blocks switched by `multilanguagejs@2.0.1` loaded from unpkg, with the choice persisted in `localStorage` (`landing_lang`). Languages: en/ja/zh/es/ru, then zh-TW and de (2026-11-08; `zh-TW`/`zh-HK`/`zh-MO`/`zh-Hant` browser locales map to zh-TW). The 2026-11-08 change also localized the log-format sample, replaced the "Built with React + TypeScript + Vite" sentence with a categorized tech-stack list, and fixed mobile horizontal overflow (nav wrap, image `max-width`). Absolute OGP/Twitter image URLs and a social preview image were added on 2026-09-12.
- Consequence: The landing page now has a third-party runtime script from a CDN without Subresource Integrity (Factual: no `integrity` attribute). It is separate from the app's own i18next-based i18n, which still supports only en/ja.

### ADR-118: Project-local agent skills added, then removed with the root `CLAUDE.md`
- Status: Removed (2026-11-08)
- Date: 2026-08-16 (`bc8df62`: `.claude/commands/*.md` → `.claude/skills/*/SKILL.md`, plus `make-lp`, `setup-act`); 2026-11-08 (`def9b85`: delete all four skills and the root `CLAUDE.md`)
- Context (Speculative): The skills moved to the maintainer's user-level configuration, so the repo copies became duplicates.
- Decision: Do not ship agent skills in the repository; `AGENTS.md` is the only checked-in agent instruction file.
- Consequence: Claude Code no longer picks up `AGENTS.md` through a root `CLAUDE.md` `@AGENTS.md` import; whether it is still loaded depends on tool-side `AGENTS.md` support or user configuration. (Speculative)

### ADR-119: TypeScript 7 major upgrade
- Status: Accepted
- Date: 2026-09-05 — Commit: `751cd1a`
- Decision: Bump `typescript` `^6.0.3` → `^7.0.2` alongside routine minor bumps; raise the `fast-uri` override to `>=4.1.4` and add `fast-uri` as a direct dependency, although nothing in `src/` imports it.
- Context (Speculative): The direct `fast-uri` entry looks like a way to force the patched version into the lockfile.
- Consequence: Type checking now uses TypeScript 7. The unused direct dependencies `fast-uri` and `global` (since `738e60b`) are candidates for removal.

### ADR-120: GitHub Actions supply chain — Dependabot and SHA pinning
- Status: Accepted
- Date: 2026-09-05 (`ab8203c`: Dependabot `github-actions` ecosystem, weekly; `0da2ea1`: reviewdog-action-biome v1 → v2 via Dependabot); 2026-11-08 (`2294334`: every `uses:` pinned to a full commit SHA with a version comment)
- Decision: Pin third-party actions immutably and let Dependabot propose updates, rather than trusting mutable major tags.
- Consequence: Tag-hijack attacks on actions no longer affect CI; version bumps arrive as Dependabot PRs that update both the SHA and the comment.

### ADR-121: `.npmrc` hardening moved to `bunfig.toml`
- Status: Accepted; supersedes the 2026-06-06 `.npmrc` hardening (`2c72408`)
- Date: 2026-11-08 — Commit: `29e37d7`
- Context: Bun's documentation lists `ignore-scripts` as a supported `.npmrc` option but not npm's `min-release-age`, so the 7-day release-age gate was probably not enforced after the move to bun (ADR-116). (Based on Bun docs read 2026-11-08; not verified empirically.)
- Decision: Configure `[install] ignoreScripts = true` and `minimumReleaseAge = 604800` (7 days, in seconds) in `bunfig.toml`, and delete `.npmrc`.
- Consequence: Supply-chain settings now live in bun's own config file. `bun install --frozen-lockfile` succeeds with the new settings.

### ADR-122: E2E tests in CI
- Status: Accepted
- Date: 2026-11-08 — Commit: `2294334`
- Decision: Add `.github/workflows/e2e.yml` that runs on push to `main`/`develop` on `ubuntu-latest`: install with `bun install --frozen-lockfile`, run `bunx playwright install --with-deps chromium` and `bun run test:e2e` with `CI=true`, and upload `playwright-report/`, `test-results/`, `screenshots/` as a 7-day artifact.
- Context (Speculative): `ubuntu-latest` instead of the other workflows' `ubuntu-slim`, because Playwright's `--with-deps` needs apt access that the slim container runner may lack.
- Consequence: First workflow in the repository's history that runs Playwright (Factual: no earlier `e2e`/`test` workflow file in `git log --all`). It currently runs only the screenshot spec across mobile/tablet/FHD viewports. PRs are not covered, matching the push-only CI policy adopted on 2026-03-13.

## Verification: docs/ADR.md vs. git log

Per the source-of-truth rule, discrepancies found when checking every commit reference in docs/ADR.md against the actual log:

1. **Inception date wrong in docs ADR-001/002** — they state 2026-02-05; the root commit `82668d8` is **2024-07-06**, with v1 released the same day. 2026-02-05 is when GA4 analytics were first added (`d7f57b3`). (Factual)
2. **docs ADR-005 GA4 "added 2026-02-19" is 2 weeks late** — analytics first landed 2026-02-05 (`d7f57b3`, `ef46e13`); `988e1ed`/`39d1f37` (02-19) formalized it as `analytics.js`. Removal date 2026-06-06 is correct. (Factual)
3. **`8b59a81` (ADR-007/009 reference) exists only on `main`** — it is the squash-merge of PR #6; `develop` carries the equivalent unsquashed commits `f1e1546`…`e0b341f`. Not an error, but hash lookups from `develop` need `--all`. (Factual)
4. **Orphan commits** `871e8ae` / `cd4c079` (docs ADR.md addendum): `871e8ae` re-verified as still reachable by no branch. (Factual)
5. All other commit hashes cited in docs ADR-001…018 resolve and match their described content. (Factual)
6. **docs/ADR.md has no entry for the 2026-07-05 commits** (`b7c61f6`, `2e39c80`, `7ee4625`, `d8eeb5f` — landing page + CI hardening, see ADR-109 above). (Factual)
7. **docs/ADR.md has no entry for the 2026-07-19 commits** (`3c1d5dd`, `3984370` — ConfigApp IME guard, see ADR-110 above). (Factual)
8. **`index.html` was deleted in `ceff98a` (ADR-113/114 era) but exists again as an untracked working-tree file as of this update** — `git show ceff98a -- index.html` shows a full -34 line deletion; `git status` currently shows `index.html` as untracked (`??`). Content differs from the pre-deletion version (new `<title>` block, OGP/Twitter Card meta tags). Not yet committed — no ADR entry until it lands in a commit. (Factual) **Resolved:** restored in `4d388cc` (2026-08-13, ADR-115).
9. **docs/ADR.md has no entries for the 2026-07-19 version-string fix or the 2026-08-13 commit** (`ceff98a` — pnpm overrides, `AGENTS.md` rename, `<form toolname>` wrapper; see ADR-111…114 above). (Factual)
10. **`4a0da9d` rewrote history in this file** — a pnpm→bun text replacement changed the 2026-06-20 row, ADR-108, and ADR-112, although `67b881f` ("switch to pnpm") and `ceff98a` (`pnpm-workspace.yaml`, `pnpm-lock.yaml`) show that pnpm was in use until 2026-08-14. Restored to pnpm in this update. (Factual)
11. **The canonical docs ADR-001…018 file no longer exists in the tree** — deleted in `b46f0b7` (2026-07-19); this reconstruction took its path in `0b17e74`. (Factual)
12. **Commit message of `ccf3240` does not match its content** — "Implement new feature for user authentication and improve error handling" only changes `docs/index.html` (zh-TW/de languages, tech-stack list, localized log sample, mobile overflow fix). The app has no authentication. (Factual)
13. **Stale links to `design.md`** in `AGENTS.md` and `docs/llms.txt` after the rename to `docs/DESIGN.md` in `0b17e74`. (Factual)

Correction options for docs/ADR.md (report only — not applied):
- Fix the two date errors in docs ADR-001/002/005. ⭐️⭐️⭐️⭐️⭐️
- Note the `8b59a81`-is-on-main caveat in docs ADR-007. ⭐️⭐️⭐️
- Back-fill the 2024–2025 era into docs/ADR.md from ADR-101…108 above. ⭐️⭐️⭐️
- Add an ADR-019 for the 2026-07-05 landing-page/CI-hardening commits (ADR-109 above). ⭐️⭐️⭐️
- Add an ADR-020 for the 2026-07-19 ConfigApp IME-guard commits (ADR-110 above). ⭐️⭐️
- Add an ADR-021 for the 2026-08-13 `AGENTS.md` consolidation + pnpm security overrides (ADR-112/113 above). ⭐️⭐️⭐️
- Fix the `design.md` → `DESIGN.md` links in `AGENTS.md` and `docs/llms.txt`. ⭐️⭐️⭐️⭐️ — **Applied 2026-11-08 (uncommitted).**
- Add `integrity`/`crossorigin` (SRI) to the `multilanguagejs` script in `docs/index.html` (ADR-117). ⭐️⭐️⭐️ — **Applied 2026-11-08 (uncommitted).**
- Remove the unused direct dependencies `fast-uri` and `global` (ADR-119), keeping the `fast-uri` override. ⭐️⭐️

<!-- commit-hash: ccf3240 -->
