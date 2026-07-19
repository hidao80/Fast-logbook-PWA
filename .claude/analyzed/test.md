---
name: analyzed-test
description: Current automated-test inventory, what it covers, and what it does not.
type: analysis
commit-hash: d363d07ab70bdbae818bada7838fe13166f4ef08
---

# Tests

- [Inventory](#inventory)
- [What Is Actually Verified](#what-is-actually-verified)
- [Gaps](#gaps)
- [How to Run](#how-to-run)

## Inventory

(Factual)

| Layer | Tooling | Files | Status |
| --- | --- | --- | --- |
| Unit | — | — | **None** (no Vitest/Jest configured) |
| Integration | — | — | None |
| E2E / visual | Playwright ^1.49 | [tests/e2e/screenshot.spec.ts](../../tests/e2e/screenshot.spec.ts) | 1 spec × 2 pages × 3 viewport projects (mobile 375×812, tablet 768×1024, fhd 1920×1080), chromium only |
| CI | GitHub Actions | — | Lint + audit only; **tests are not run in CI** |

## What Is Actually Verified

The single spec navigates, waits for `networkidle`, saves a full-page screenshot to `screenshots/`, and asserts only `toHaveTitle(/.+/)` (any non-empty title). It is a screenshot generator more than a test.

**Discrepancy**: the spec's second page is `/config.html`, which predates the hash-router rewrite; the real config screen is `/#/config`. The "config" screenshot therefore does not show the config screen. See [known_bugs.md](known_bugs.md) #2.

## Gaps

Priority order (aligned with [docs/spec/todo.md](../../docs/spec/todo.md) #2):

1. Unit tests for `src/lib/download.ts` `parse()` — midnight wrap, `^` exclusion, `;` splitting, dedup of details, rounding math. ⭐️⭐️⭐️⭐️⭐️
2. Unit tests for `src/lib/utils.ts` — `getRoundingUnit` whitelist, `appendTime`, `trimNewLine`, `escapeHtml`, slice-based time extraction. ⭐️⭐️⭐️⭐️⭐️
3. Functional E2E: enter log → save dot turns green → reload persists; date change filters lines; export produces file. ⭐️⭐️⭐️⭐️
4. Fix `/config.html` → `/#/config` in the screenshot spec. ⭐️⭐️⭐️⭐️⭐️ (one-line)
5. Run tests in CI once they exist. ⭐️⭐️⭐️⭐️

## How to Run

```bash
pnpm test              # all Playwright projects (auto-starts dev server)
pnpm run test:e2e:ui   # interactive UI mode
pnpm run screenshot    # screenshot spec only → screenshots/
```

CI environment sets 2 retries, 1 worker, `forbidOnly` (config: [playwright.config.ts](../../playwright.config.ts)).

d363d07ab70bdbae818bada7838fe13166f4ef08
