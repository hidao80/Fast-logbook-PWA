---
name: analyzed-test
description: Current automated-test inventory for Fast-logbook-PWA - Playwright E2E only, no unit tests, and a verified routing bug in the config screenshot test.
type: analysis
commit-hash: ceff98ab997a60d35e564821f2e6bf7b6c284128
---

# Tests

- [Inventory](#inventory)
- [screenshot.spec.ts contents](#screenshotspects-contents)
- [playwright.config.ts settings](#playwrightconfigts-settings)
- [Attempted test run](#attempted-test-run)
- [package.json test scripts](#packagejson-test-scripts)
- [Coverage gaps and risk](#coverage-gaps-and-risk)

## Inventory

| Layer | Tooling | Files | Status |
| --- | --- | --- | --- |
| Unit | none | none | No unit test framework in `package.json` devDependencies (no vitest, jest, etc.) |
| Integration | none | none | Not present |
| E2E / visual | Playwright ^1.62.1 | `tests/e2e/screenshot.spec.ts` | 1 spec file, 2 page targets x 3 viewport projects = 6 test cases, Chromium only |
| CI | GitHub Actions (`.github/workflows/lint.yml`, `.github/workflows/audit.yml`) | — | Only lint (biome) and `pnpm audit` run in CI. No workflow executes Playwright tests. |

## screenshot.spec.ts contents

File read directly: `tests/e2e/screenshot.spec.ts` (23 lines).

- Defines a `PAGES` array with two entries: `{ path: '/', name: 'homepage' }` and `{ path: '/config.html', name: 'config' }`.
- For each page: `page.goto(pageInfo.path)` -> `page.waitForLoadState('networkidle')` -> `page.screenshot({ path: 'screenshots/{name}-{project}.png', fullPage: true })`.
- The only assertion is `expect(page).toHaveTitle(/.+/)` — it just checks the page has a non-empty title. There are no assertions on DOM content, element state, or app behavior.
- Functionally this is a screenshot-generation script, not a behavioral test suite.

**Verified bug — routing mismatch.** I read `src/main.tsx` directly:

```ts
const router = createHashRouter([
  { path: '/', element: <App /> },
  { path: '/config', element: <ConfigApp /> },
]);
```

The app uses React Router's `createHashRouter`. The real config route is `/config`, reachable in the browser only as `/#/config` (confirmed also by the `<Link to="/config">` in `src/App.tsx`). The spec instead navigates to `/config.html`, a path that does not exist as a route or a static file. Under a hash router, everything before `#` is just the document path; `/config.html` and `/` both load the same `index.html` document and the router falls back to whatever the (empty/default) hash resolves to — in practice this means the "config" test case screenshots the same homepage content as the "homepage" test case, not the config screen. The config screen is not actually exercised by this test.

This confirms the prior pass's claim. Rating for fixing it (change `/config.html` to `/#/config` in the `PAGES` array): recommended, rated 5/5 stars — it is a one-line fix and currently the config screen has zero E2E coverage as a direct result.

## playwright.config.ts settings

File read directly: `playwright.config.ts` (36 lines).

- `testDir: './tests/e2e'`, `fullyParallel: true`
- `retries`: 2 on CI (`process.env.CI` truthy), 0 locally
- `workers`: 1 on CI, unset (auto) locally
- `reporter: 'html'`
- `use`: `baseURL: 'http://localhost:3000'`, `browserName: 'chromium'` (Firefox and WebKit are not configured), `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`
- `projects`: three viewport-only projects — `mobile` (375x812), `tablet` (768x1024), `fhd` (1920x1080). All three still run on Chromium; there is no cross-browser matrix.
- `webServer`: `command: 'pnpm run dev'`, `url: 'http://localhost:3000'`, `reuseExistingServer: !process.env.CI` (reuses an already-running dev server locally, always starts fresh on CI)

## Attempted test run

I actually ran `pnpm exec playwright test` in this working tree rather than assuming success or failure.

- The Vite dev server (`pnpm run dev`) auto-started successfully via `webServer`. Note: the working tree currently has an untracked `index.html` (deleted from git at commit `ceff98a` but present locally), which is what let `dev` start at all. Whether `pnpm run dev` / `pnpm run build` succeed from a clean checkout of HEAD alone (without this untracked file) was not re-tested here — treat that as a separate, already-flagged risk, not something this pass re-verified.
- All 6 test cases failed with the same error: `browserType.launch: Executable doesn't exist at .../chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe`. The installed Playwright browser cache on this machine has chromium builds 1208/1223/1228 but not the 1234 headless-shell build that Playwright 1.62.1 expects. `pnpm exec playwright install` was not run (out of scope — would download browser binaries, a side effect beyond this read-only analysis task).
- Consequence: I could not dynamically verify what the "config" test case actually screenshots. The routing-bug conclusion above is based on static analysis of the router and spec code, not on an observed screenshot diff. Static analysis is strong here (the route literally does not exist), but flagging this as **Unconfirmed by dynamic execution**.

## package.json test scripts

```json
"test": "playwright test",
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui",
"test:e2e:headed": "playwright test --headed",
"screenshot": "playwright test tests/e2e/screenshot.spec.ts"
```

- `test` and `test:e2e` are byte-for-byte identical (`playwright test`) — redundant, one is dead weight.
- `screenshot` narrows to the single existing spec file, which currently makes it equivalent to `test:e2e` anyway since that's the only spec present; it only becomes meaningfully different once more spec files exist.
- No `test:unit` or similar script exists, consistent with there being no unit test framework installed.

## Coverage gaps and risk

- **Zero unit test coverage** on `src/lib/*.ts` (`storage.ts`, `download.ts`, `utils.ts`). These files contain the core logic — IndexedDB/localStorage persistence, log formatting/rounding, and file download/export generation. None of it is covered by any automated test. A regression in log parsing, date-boundary math, or export formatting would not be caught by the current E2E suite, since that suite only checks screenshots and a non-empty page title.
- E2E coverage itself is shallow: Chromium only, 2 page loads, 1 trivial assertion each. There are no tests for log entry input, shortcut buttons, date navigation, delete confirmation, or the config screen's actual settings (rounding unit, shortcuts, roll-over time).
- Tests do not run in CI at all (`lint.yml` and `audit.yml` are the only workflows present); a broken test would not block a merge or a push.
- Recommendation, rated 5/5 stars: introduce a unit test framework (vitest is the natural fit given Vite) and add tests for `src/lib/*.ts` before adding further app logic there.
- Recommendation, rated 5/5 stars: fix the `/config.html` -> `/#/config` path in `screenshot.spec.ts` so the config screen is actually exercised.
- Recommendation, rated 3/5 stars: add a CI workflow step that runs `pnpm exec playwright test` (with `playwright install --with-deps` first) so E2E regressions are caught automatically; lower priority than the two items above since the current E2E suite's assertions are minimal anyway.

<!-- commit-hash: ceff98ab997a60d35e564821f2e6bf7b6c284128 -->
