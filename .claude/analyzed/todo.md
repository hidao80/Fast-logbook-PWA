---
name: analyzed-todo
description: Prioritized action items by category, derived from this analysis and docs/spec/todo.md.
type: analysis
commit-hash: d363d07ab70bdbae818bada7838fe13166f4ef08
---

# TODO (Analysis-derived)

- [Security (High Priority)](#security-high-priority)
- [Test](#test)
- [Database](#database)
- [Code Quality](#code-quality)
- [Infrastructure](#infrastructure)
- [Developer Experience](#developer-experience)
- [Performance](#performance)

Product-feature roadmap lives in [docs/spec/todo.md](../../docs/spec/todo.md); this list is the analysis-side view. Ratings = recommendation strength.

## Security (High Priority)

- [ ] Add CSP + security headers (Netlify `_headers` / nginx conf) — `script-src 'self'` now feasible. ⭐️⭐️⭐️⭐️⭐️
- [ ] Docker: copy only `dist/` into the nginx stage (stop serving the source tree). ⭐️⭐️⭐️⭐️
- [ ] Update exported-artifact CDN pins (Bootstrap 5.3.0-alpha1 CSS / 5.2.3 JS → current stable) **with regenerated SRI hashes**. ⭐️⭐️⭐️⭐️

## Test

- [ ] Fix stale E2E URL `/config.html` → `/#/config` (one line). ⭐️⭐️⭐️⭐️⭐️
- [ ] Add Vitest + unit tests for `parse()`, `getRoundingUnit()`, time helpers, `escapeHtml()`. ⭐️⭐️⭐️⭐️⭐️
- [ ] Add functional E2E (input → save → reload persistence; export). ⭐️⭐️⭐️⭐️
- [ ] Run tests in CI. ⭐️⭐️⭐️⭐️

## Database

- [ ] Optional: flush `log_buffer` on `pagehide`/`beforeunload` to shrink the reconciliation window. ⭐️⭐️⭐️
- [ ] Defer: per-day keying / compression only if logs grow large. ⭐️⭐️

## Code Quality

- [ ] Fix `package.json` version `26.06:20` → `26.06.20`; then derive manifest version from `package.json` at build time. ⭐️⭐️⭐️⭐️⭐️
- [ ] Remove unused dep `global` and dead `installPWA()` in `src/lib/utils.ts`. ⭐️⭐️⭐️⭐️
- [ ] Extract the 5×-duplicated rounding formula in `download.ts`. ⭐️⭐️⭐️
- [ ] Rewrite stale `.claude/CLAUDE.md` and `.claude/rules/{code-style,security}.md` for the React codebase. ⭐️⭐️⭐️⭐️⭐️

## Infrastructure

- [ ] Add `pull_request` trigger to workflows (reviewdog `github-pr-review` needs PR context). ⭐️⭐️⭐️⭐️
- [ ] Add a build-verification step (`pnpm run build`) to CI. ⭐️⭐️⭐️
- [ ] Version-bump automation (package.json + manifest + tag). ⭐️⭐️⭐️

## Developer Experience

- [ ] Add `"typecheck": "tsc --noEmit"` script and run it in CI. ⭐️⭐️⭐️⭐️
- [ ] Strip `console.*` in prod builds (`esbuild.drop`). ⭐️⭐️⭐️

## Performance

- [ ] Nothing urgent. If multi-year logs appear: lexical prefix comparison instead of `new Date()` per line, then per-day storage keys. ⭐️⭐️

d363d07ab70bdbae818bada7838fe13166f4ef08
