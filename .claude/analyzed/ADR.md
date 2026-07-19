---
name: analyzed-ADR
description: Git-log-derived architecture decision timeline, supplemental ADRs for the pre-2026 era, and verification of docs/ADR.md against actual history.
type: analysis
commit-hash: 39843709093825c8ffe02e61d8b0d66a45783f68
---

# Architecture Decision Records (git-log reconstruction)

- [Relation to docs/ADR.md](#relation-to-docsadrmd)
- [Decision Timeline](#decision-timeline)
- [Supplemental ADRs (pre-2026-02 era)](#supplemental-adrs-pre-2026-02-era)
- [Supplemental ADRs (2026-07 era, not yet in docs/ADR.md)](#supplemental-adrs-2026-07-era-not-yet-in-docsadrmd)
- [Verification: docs/ADR.md vs. git log](#verification-docsadrmd-vs-git-log)

## Relation to docs/ADR.md

[docs/ADR.md](../../docs/ADR.md) (ADR-001 … ADR-018) is the **canonical** decision record and covers 2026-02-19 onward, but not yet the 2026-07-05/2026-07-19 commits below. This file is derived from the complete git history (195 commits reachable from `develop` including merges, 2024-07-06 → 2026-07-19, all hashes verified — Factual) and adds: (1) a one-page timeline, (2) supplemental ADRs numbered **ADR-101+** for eras docs/ADR.md does not cover (numbered separately to avoid collision), (3) discrepancy findings. Where the two disagree on dates, **this file follows commit dates**.

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
| 2026-06-20 | pnpm unification; caveman-code dependency removed; TypeScript consolidation of lib modules; `.actrc` | `5b8968c`, `67b881f`, `d363d07` | docs ADR-018 |
| 2026-07-05 | GitHub Pages landing page (`docs/index.html`) added; CI hardening: `actions/checkout@v6`, Node 24 for audit workflow | `b7c61f6`, `2e39c80`, `7ee4625`, `d8eeb5f` | ADR-109 (not yet in docs/ADR.md) |
| 2026-07-19 | IME `isComposing` guard extended from `App.tsx` to `ConfigApp.tsx` shortcut inputs | `3c1d5dd`, `3984370` | ADR-110 (not yet in docs/ADR.md) |

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
- Status: Superseded by docs ADR-006/008/009 (Biome, Takumi Guard, reviewdog) and docs ADR-018 (pnpm)
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

## Verification: docs/ADR.md vs. git log

Per the source-of-truth rule, discrepancies found when checking every commit reference in docs/ADR.md against the actual log:

1. **Inception date wrong in docs ADR-001/002** — they state 2026-02-05; the root commit `82668d8` is **2024-07-06**, with v1 released the same day. 2026-02-05 is when GA4 analytics were first added (`d7f57b3`). (Factual)
2. **docs ADR-005 GA4 "added 2026-02-19" is 2 weeks late** — analytics first landed 2026-02-05 (`d7f57b3`, `ef46e13`); `988e1ed`/`39d1f37` (02-19) formalized it as `analytics.js`. Removal date 2026-06-06 is correct. (Factual)
3. **`8b59a81` (ADR-007/009 reference) exists only on `main`** — it is the squash-merge of PR #6; `develop` carries the equivalent unsquashed commits `f1e1546`…`e0b341f`. Not an error, but hash lookups from `develop` need `--all`. (Factual)
4. **Orphan commits** `871e8ae` / `cd4c079` (docs ADR.md addendum): `871e8ae` re-verified as still reachable by no branch. (Factual)
5. All other commit hashes cited in docs ADR-001…018 resolve and match their described content. (Factual)
6. **docs/ADR.md has no entry for the 2026-07-05 commits** (`b7c61f6`, `2e39c80`, `7ee4625`, `d8eeb5f` — landing page + CI hardening, see ADR-109 above). (Factual)
7. **docs/ADR.md has no entry for the 2026-07-19 commits** (`3c1d5dd`, `3984370` — ConfigApp IME guard, see ADR-110 above). (Factual)

Correction options for docs/ADR.md (report only — not applied):
- Fix the two date errors in docs ADR-001/002/005. ⭐️⭐️⭐️⭐️⭐️
- Note the `8b59a81`-is-on-main caveat in docs ADR-007. ⭐️⭐️⭐️
- Back-fill the 2024–2025 era into docs/ADR.md from ADR-101…108 above. ⭐️⭐️⭐️
- Add an ADR-019 for the 2026-07-05 landing-page/CI-hardening commits (ADR-109 above). ⭐️⭐️⭐️
- Add an ADR-020 for the 2026-07-19 ConfigApp IME-guard commits (ADR-110 above). ⭐️⭐️

39843709093825c8ffe02e61d8b0d66a45783f68
