# TODO & Future Enhancements

> Rewritten to reflect the current React + TypeScript + Vite + IndexedDB codebase. Most "Immediate Fixes" from the vanilla-JS era are now complete (either fixed directly, or made moot by the rewrite — see [`known_bugs.md`](known_bugs.md) for details and `docs/ADR.md` for the decision history). This document tracks what's left.

## Completed Since the Last Revision

- [x] IME composition handling (Enter-key processing) — fixed pre-rewrite, preserved in `App.tsx`
- [x] Internationalize the storage-quota error message — `storage_quota_exceeded` i18next key now exists
- [x] Service worker cache-name race condition / hardcoded `'my-cache'` key — moot; Workbox (`vite-plugin-pwa`) now owns cache naming entirely
- [x] Add a build process (Vite) — done, though note this made "zero-build" no longer possible (see `docs/design.md` §2.2)
- [x] Migrate to IndexedDB — done (`src/lib/storage.ts`, via `idb`), with a one-time migration from `localStorage`
- [x] i18n system replacement — `Multilingualization` class replaced by `i18next`/`react-i18next`
- [x] E2E test framework — Playwright is configured (`tests/e2e/screenshot.spec.ts`, 3 viewport projects)
- [x] Architecture diagrams / decision history — see `docs/ADR.md` and `docs/design.md`
- [x] Per-day log separation (partial) — date roll-over + per-day view implemented; date-range *export* filtering is still open (see below)
- [x] Remove GA4 analytics — removed entirely, not just made optional (privacy-first decision, see `docs/ADR.md` ADR-005)

## Open Items

### High Priority

#### 1. Resolve the `package.json` / manifest version-string drift
**Issue**: [known_bugs.md#1](known_bugs.md#1-version-string-mismatch-between-packagejson-and-the-pwa-manifest)
**Files**: `package.json`, `vite.config.js`

Generate the manifest `version` from `package.json` at build time instead of hardcoding it separately.

**Effort**: 1 hour

---

#### 2. Add unit tests with Vitest
**Issue**: [known_bugs.md#6](known_bugs.md#6-no-automated-unit-tests-for-srcclibts)
**Target files**: `src/lib/utils.ts`, `src/lib/download.ts` (especially `parse()`, `toHtml()`, `toMarkdown()`)

Cover: date/time helpers with edge-case inputs, rounding-unit validation, midnight-crossing time calculation, category exclusion (`^` prefix), HTML/Markdown formatting output.

**Effort**: 12 hours (initial setup + tests)
**Impact**: Catches regressions in core log-parsing logic before they reach E2E/manual testing

---

#### 3. Add a Content Security Policy
**Issue**: [known_bugs.md#3](known_bugs.md#3-no-content-security-policy)

Since the app shell no longer loads third-party scripts from a CDN, a `script-src 'self'` policy (plus an appropriately scoped `style-src`) is now feasible via Netlify headers / Nginx config.

**Effort**: 2 hours

---

#### 4. Reintroduce production console suppression
**Issue**: [known_bugs.md#2](known_bugs.md#2-no-production-console-suppression)

Configure Vite to strip `console.*` calls in production builds (e.g. via `esbuild.drop` or a small plugin), rather than the old runtime `$$disableConsole()` DOM utility.

**Effort**: 1 hour

---

## Feature Enhancements (Medium/High Value)

### 5. Add date-range export filtering
Filter log entries by date range before formatting, with "Today"/"This Week"/"This Month" presets, in addition to (or replacing) the always-export-everything behavior. Builds on the per-day view's existing date-boundary logic (`getDateBoundaries()` in `App.tsx`).

**Effort**: 6 hours

### 6. Add export format selection
Add checkboxes for HTML/Plaintext/Markdown so users can export only what they need, instead of always bundling all three.

**Effort**: 2 hours

### 7. Add undo/redo functionality
In-memory history stack for log edits and deletions; `Ctrl+Z`/`Ctrl+Shift+Z` shortcuts.

**Effort**: 4 hours

### 8. Add search/filter for logs
Highlight or filter matching lines as the user types, ideally with optional regex support.

**Effort**: 6 hours

### 9. Add log compression
Use the `CompressionStream` API to shrink the stored log before writing to IndexedDB (now relevant to IndexedDB quota, not `localStorage`'s 5-10MB limit, but still worthwhile for very large logs).

**Effort**: 8 hours

### 10. Add import functionality
Allow re-importing a previously exported HTML file's plaintext section, merging it into the existing log with conflict/duplicate handling.

**Effort**: 8 hours

### 11. Add PWA installation instructions for iOS
Detect iOS via user agent and show a modal with manual "Add to Home Screen" instructions, since `beforeinstallprompt` never fires there.

**Effort**: 3 hours

### 12. Add a statistics dashboard
Total work time today/week/month, category breakdown chart (e.g. Chart.js), most-used categories.

**Effort**: 12 hours

### 13. Add export to calendar (ICS)
Convert log entries into calendar events and generate an `.ics` file for import into Google Calendar/Outlook.

**Effort**: 6 hours

---

## Accessibility Improvements

### 14. Add a color-blind-friendly save indicator
Add an icon and/or text label alongside the existing color-only save-status dot.

**Effort**: 30 minutes

### 15. Add screen-reader announcements
ARIA live region announcing save-status changes, log additions, and export/delete actions.

**Effort**: 3 hours

### 16. Add keyboard shortcut configuration
Allow remapping the digit-key shortcuts, with modifier support (`Ctrl`/`Cmd`/`Alt`).

**Effort**: 8 hours

### 17. Accessibility audit & fixes
Automated checks (axe, Lighthouse) + manual screen-reader and keyboard-only navigation testing.

**Effort**: 12 hours

---

## Security & Privacy

### 18. Add optional data encryption
Web Crypto API-based encryption of IndexedDB data behind a user-supplied passphrase, as an opt-in.

**Effort**: 12 hours

---

## UX/UI Enhancements

### 19. Add a manual dark-mode toggle
Currently auto-detects system preference only (`autoSetTheme()`); add an explicit Auto/Light/Dark control in `ConfigApp`, persisted to IndexedDB.

**Effort**: 3 hours

### 20. Add log entry templates
User-defined templates with placeholders (date, time, category), managed from the config screen — a more flexible alternative to the fixed 9 shortcuts.

**Effort**: 8 hours

### 21. Add optional multi-device sync
Cloud-sync (Google Drive/Dropbox/custom server) as an explicit opt-in, with OAuth and conflict resolution. Would be a deliberate exception to the no-backend principle (`docs/design.md` §2.1) and needs careful scoping.

**Effort**: 40 hours

---

## Internationalization

### 22. Add more language support
Candidates: Chinese (Simplified/Traditional), Korean, Spanish, French, German. Translation-only effort given the existing `i18next` infrastructure.

**Effort**: ~4 hours per language

### 23. Add RTL language support
Detect RTL languages (Arabic, Hebrew), apply RTL CSS, mirror layout components.

**Effort**: 8 hours

---

## Documentation

### 24. Create a user guide
Screenshots, feature walkthrough, FAQ, troubleshooting.

**Effort**: 8 hours

### 25. Create a contributor guide
Dev setup, code style (already partly covered by `.claude/rules/code-style.md`), architecture overview, PR guidelines.

**Effort**: 4 hours

---

## Deployment & DevOps

### 26. Add automated version bumping
Script to bump `package.json` and the manifest version together (also resolves item #1 above), create a git tag, generate a changelog.

**Effort**: 3 hours

### 27. Extend CI/CD
**Current**: `lint.yml` (Biome via reviewdog) and `audit.yml` (`pnpm audit --audit-level=high` + Takumi Guard) exist.

**Remaining**: a test-running workflow (once Vitest is added, item #2), a build-and-deploy workflow, release automation.

**Effort**: 4 hours

---

## Priority Roadmap

### Phase 1: Correctness & Hardening (1-2 weeks)
- [ ] #1: Resolve version-string drift
- [ ] #2: Add unit tests with Vitest
- [ ] #3: Add a Content Security Policy
- [ ] #4: Reintroduce production console suppression

### Phase 2: Essential Features (1 month)
- [ ] #5: Date-range export filtering
- [ ] #6: Export format selection
- [ ] #11: PWA installation instructions for iOS

### Phase 3: Quality & Accessibility (1 month)
- [ ] #14: Color-blind-friendly save indicator
- [ ] #15: Screen-reader announcements
- [ ] #17: Accessibility audit & fixes

### Phase 4: Advanced Features (2-3 months)
- [ ] #7: Undo/redo
- [ ] #8: Search/filter
- [ ] #9: Log compression
- [ ] #10: Import functionality
- [ ] #12: Statistics dashboard
- [ ] #13: Export to calendar (ICS)

### Phase 5: Nice-to-Have (Ongoing)
- [ ] #18: Optional data encryption
- [ ] #19: Manual dark-mode toggle
- [ ] #20: Log entry templates
- [ ] #21: Optional multi-device sync
- [ ] #22/#23: More languages / RTL support

---

## Contribution Welcome

All items above are open for contribution. To contribute:
1. Check existing issues on GitHub
2. Comment on an existing issue or open a new one
3. Fork the repository
4. Implement the feature/fix
5. Submit a pull request

---

## Progress Tracking

This document is updated as items are completed. See `docs/ADR.md` for the architectural decision history behind already-completed major changes (IndexedDB migration, the React/Vite rewrite, i18n replacement, etc.).

Last updated: 2026-06-20
