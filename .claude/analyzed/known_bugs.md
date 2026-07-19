---
name: analyzed-known_bugs
description: Known bugs, inconsistencies between layers, design issues, and analysis limitations.
type: analysis
commit-hash: d363d07ab70bdbae818bada7838fe13166f4ef08
---

# Known Bugs & Inconsistencies

- [Confirmed Bugs](#confirmed-bugs)
- [Layer Inconsistencies](#layer-inconsistencies)
- [Architectural / Design Issues](#architectural--design-issues)
- [Compatibility Issues](#compatibility-issues)
- [Analysis Limitations](#analysis-limitations)

Canonical upstream list: [docs/spec/known_bugs.md](../../docs/spec/known_bugs.md) (already React-era, verified consistent with `src/`). This file adds findings from the current analysis.

## Confirmed Bugs

1. **`package.json` version typo `"26.06:20"`** (colon, not dot) vs. manifest `26.06.20` in [vite.config.js](../../vite.config.js#L17). The old "version drift" issue was fixed by syncing values, but the sync introduced a typo. (Factual)
2. **E2E test targets a dead URL**: [tests/e2e/screenshot.spec.ts](../../tests/e2e/screenshot.spec.ts#L5) captures `/config.html`, but the config screen now lives at `#/config` (hash routing). The "config" screenshot is not the config screen. Per the source-of-truth rule, the test encodes the *old* contract — implementation moved and the test wasn't updated. (Factual that the URL no longer matches routing)
3. **Exported HTML pins Bootstrap CSS `5.3.0-alpha1`** (an alpha release) and Bootstrap JS `5.2.3` — mismatched with each other and with the bundled app's 5.3.8 ([src/lib/download.ts](../../src/lib/download.ts#L218-L219)). SRI is present, so integrity is fine; versions are just stale/mixed. (Factual)

## Layer Inconsistencies

4. **Stale AI-guidance docs describe the deleted vanilla-JS codebase**: `.claude/CLAUDE.md`, `.claude/rules/code-style.md`, `.claude/rules/security.md` still reference `js/main.js`, hand-written `sw.js` (`'my-cache'` bug), `Multilingualization`, `$$one()`, `indolence.min.js` — none of which exist. `docs/spec/*` and `docs/design.md` were rewritten; the `.claude/` layer was not. (Factual)
5. **CI trigger mismatch**: workflows run only on `push` to `main`/`develop`, yet `lint.yml` uses reviewdog reporter `github-pr-review`, which needs a pull-request context; on plain pushes it likely no-ops or fails (Speculative — behavior not verified in Actions logs). Old CLAUDE.md claims "push/PR" triggers.
6. **Dead code / dead dependency**: `installPWA()` in [src/lib/utils.ts](../../src/lib/utils.ts#L129) has no importers; npm package `global` is never imported. (Factual, grep-verified)

## Architectural / Design Issues

(carried from docs/spec, still valid at this commit)

- **No CSP** on Netlify/Nginx responses — medium priority, now easy since the app shell is CDN-free.
- **`log_buffer` reconciliation window**: crash between debounced localStorage write and `flushBuffer()` leaves edits unmerged (not lost). Same-day editing in two tabs is last-flush-wins.
- **No unit tests** for `src/lib/` pure logic; E2E asserts almost nothing (title regex only).
- **Docker image ships the full source tree**: `COPY --from=builder /app /usr/share/nginx/html/` then overlays `dist/` — `node_modules` excluded only via [.dockerignore](../../.dockerignore) (content unverified), and source/config files are publicly served. (Factual for the COPY; Unconfirmed how much `.dockerignore` mitigates)
- **`saveLogs` closes over `t`** with an empty dependency array in [src/App.tsx](../../src/App.tsx#L105-L119) — quota-error alert may use a stale translation after a language change. Cosmetic. (Factual)

## Compatibility Issues

- `beforeinstallprompt` unsupported on iOS/desktop Safari and limited on Firefox → install button never appears there; no manual instructions offered.
- Speculation Rules API: Chromium 108+ only (progressive enhancement, safe elsewhere).
- iOS service-worker cache eviction is more aggressive (platform-inherent).

## Analysis Limitations

- No Actions run logs inspected — CI finding #5 is inference from reviewdog documentation.
- `.dockerignore`, `.npmrc`, `css/main.css` contents not read in detail.
- No runtime profiling performed ([performance.md](performance.md) is static analysis).
- License fields in [dependencies.md](dependencies.md) are from package knowledge, not `node_modules` inspection.

d363d07ab70bdbae818bada7838fe13166f4ef08
