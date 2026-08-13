---
name: analyzed-naming_convention
description: Documents the naming conventions actually used across the React 19.2 + TypeScript codebase — variables, functions, types/components, constants, storage keys, and i18n keys — and flags inconsistencies against Biome's configured lint rules.
type: analysis
commit-hash: e021877bb892db6cc019f4e0520449119de3c079
---

# Naming Convention

This is a client-only React 19.2 + TypeScript PWA (no backend, no relational database). There are no "tables"/"columns" in the traditional sense — the closest analogues are the IndexedDB flat key-value store (`kv`) and its string keys, documented in `.claude/analyzed/databases.md`. This document covers code-level naming (variables, functions, types, components, files) plus storage-key and i18n-key naming style.

## Variables and functions: camelCase

Confirmed throughout `src/`. Examples from `src/lib/utils.ts`, `src/App.tsx`, `src/lib/storage.ts`:

- Functions: `getTodayString`, `fetchHourFromTime`, `fetchMinFromTime`, `getRoundingUnit`, `appendTime`, `trimNewLine`, `escapeHtml`, `installPWA`, `autoSetTheme`, `getItem`, `setItem`, `removeItem`, `migrateFromLocalStorage`, `getDateBoundaries`, `getDateWithRollOver`, `loadLogs`, `processInput`.
- Local variables: `allLog`, `rollOver`, `targetDate`, `isDirty`, `debounceRef`, `bcRef`, `deferredPromptRef`.
- React state setters follow the standard `[value, setValue]` camelCase pair, e.g. `[isDirty, setIsDirty]`, `[shortcuts, setShortcuts]`, `[isSideMenuOpen, setIsSideMenuOpen]`.
- Boolean-flavored names consistently use `is`/`has`-style prefixes: `isDirty`, `isSideMenuOpen`, `isDeleteModalOpen`, `isDateNoticeModalOpen`, `isHelpModalOpen`, `isInt` (parameter in `fetchHourFromTime`/`fetchMinFromTime`).
- `useRef` variables consistently suffixed `Ref`: `textareaRef`, `targetDateRef`, `debounceRef`, `bcRef`, `deferredPromptRef`, `logViewerRef`.

No exceptions found — camelCase is applied uniformly for variables and functions across `App.tsx`, `ConfigApp.tsx`, `src/lib/*.ts`, and the components.

## Types, interfaces, and components: PascalCase

- Interfaces: `DrawerProps`, `ModalProps`, `ParsedCategory` (`src/lib/download.ts`), `BeforeInstallPromptEvent`.
- React components: `App`, `ConfigApp`, `Drawer`, `Modal`, `HelpModal` (a locally-defined sub-component inside `App.tsx`).
- Prop-type interfaces follow the common React convention `<ComponentName>Props` (`DrawerProps` for `Drawer`, `ModalProps` for `Modal`).

## Module-scope constants: UPPER_SNAKE_CASE

Consistent across all files that define file-local constants:

- `src/lib/utils.ts`: `LOG_DATA_KEY`, `ROUNDING_UNIT_MINUTE_KEY`.
- `src/lib/storage.ts`: `DB_NAME`, `STORE_NAME`, `DB_VERSION`.
- `src/lib/download.ts`: `HTML_SUMMARY`, `PLAINTEXT_LOG`, `MARKDOWN_SUMMARY`, and function-local `TIME_LENGTH`, `FIELD_SEPARATOR`, `RECORD_SEPARATOR` (block-scoped inside `parse()`, still UPPER_SNAKE_CASE despite not being module-scope — the convention is applied to "this is a fixed/magic value" rather than strictly to scope level).
- `src/App.tsx` / `src/ConfigApp.tsx`: `DATE_ROLL_OVER_TIME_KEY`, `LAST_EDITED_DATE_KEY`, `MIGRATION_VERSION_KEY`, `NOTICE_DATE_SELECTOR_KEY`.

## Files: mixed by role — PascalCase for components, camelCase for libs/entry points

- Components: `src/components/Drawer.tsx`, `src/components/Modal.tsx`, `src/App.tsx`, `src/ConfigApp.tsx` — PascalCase, matching the default component they export.
- Libraries/utilities/entry points: `src/main.tsx`, `src/lib/storage.ts`, `src/lib/utils.ts`, `src/lib/download.ts`, `src/i18n/index.ts` — camelCase (or all-lowercase for single-word names like `index.ts`).
- This is the standard React convention (component files mirror the PascalCase component name; non-component modules are camelCase/lowercase) and is applied consistently — no kebab-case source files were found in `src/`. Note this differs from the project's documented (and now largely superseded) `.claude/rules/code-style.md` guidance, which describes a kebab-case file convention — that rule predates the React/TypeScript migration and reflects the vanilla-JS era; it is stale for `src/`.

## Storage keys (IndexedDB `kv` store / localStorage): snake_case and kebab-case, mixed

Per `.claude/analyzed/databases.md`'s key inventory, the actual string values used as storage keys are **not** uniformly styled:

- snake_case: `log`, `rounding_mins`, `shortcut_1`…`shortcut_9`, `migration_version`, `last_edited_date`, `notice_date_selector`, `log_buffer`, `log_buffer_date`.
- kebab-case: `date-roll-over-time` (and the legacy `date-roll-over-time-value`).

This is a confirmed inconsistency: one key (`date-roll-over-time`) uses kebab-case while every other key in the same flat `kv` store uses snake_case. It is long-standing (present in the legacy localStorage key set that was carried through the migration unchanged), so fixing it would require a migration step, not just a rename. Recommendation: leave as-is unless a future storage-schema migration is already planned, in which case rename to `date_roll_over_time` for consistency. ⭐️2 (cosmetic; no functional impact, and forcing a rename purely for style would add migration-code risk for no user-facing benefit).

The TypeScript-side *constant identifiers* that hold these key strings are consistently UPPER_SNAKE_CASE regardless of the underlying string's casing (e.g. `DATE_ROLL_OVER_TIME_KEY = 'date-roll-over-time'`), so the inconsistency is confined to the literal string values, not the code-level naming convention.

Two of these constants (`DATE_ROLL_OVER_TIME_KEY`) are independently redefined with identical name and value in both `src/App.tsx` and `src/ConfigApp.tsx` rather than shared from `src/lib/utils.ts` alongside `LOG_DATA_KEY`/`ROUNDING_UNIT_MINUTE_KEY`. Not a naming-convention defect (the name is consistent between the two definitions), but it is duplication that could drift. ⭐️2 suggestion: hoist into `src/lib/utils.ts` for a single source of truth.

Similarly, `interface BeforeInstallPromptEvent` is defined twice with identical shape — once in `src/globals.d.ts` and once (non-exported) at the bottom of `src/lib/utils.ts`. Same PascalCase name both places (no naming inconsistency), but duplicate definitions are worth consolidating. ⭐️2.

## i18n keys (`src/i18n/locales/en.json`, `ja.json`): flat snake_case, no nesting

Confirmed by reading `en.json`:

- All keys are snake_case: `app_name`, `popup_title`, `date_selector_feature_notice_ok`, `shortcut_items_title`, `help_main_screen_shortcut`, etc.
- The object is **flat** — no nested namespacing (e.g. not `{ help: { main_screen: { shortcut: ... } } }`). Hierarchy is instead encoded directly into the key name via underscore-joined prefixes, e.g. `help_main_screen_example_of_summary_format`, `help_config_screen_setting_shortcut`. This produces very long keys (`help_main_screen_example_of_customer_summary_format`) but keeps the lookup mechanism (`react-i18next` / `t('key')`) simple with no dot-path traversal.
- A few keys are numeric-suffixed enumerations rather than semantically named: `help_main_screen_example_1` through `_16`, `help_config_screen_example_1` through `_11`. This is a pattern, not an inconsistency — consistently applied for ordered example lists.
- One key, `shortcut_2`'s English value, contains a typo ("wrivate" instead of "private") — this is a content/copy issue, not a naming-convention issue, out of scope here but worth flagging. Unconfirmed whether `ja.json` has the equivalent issue (not read in this pass).
- Key set was only cross-checked against `en.json`; `ja.json` was not read in this pass — assumed (not verified) to have an identical key set since `i18n/index.ts` merges both under the same `resources.en.translation` / `resources.ja.translation` shape and any key-set mismatch would show as a missing-translation fallback rather than a build error.

## Biome-enforced naming rules: none configured

`biome.json` (schema 2.4.2) enables `linter.rules.recommended: true` plus two explicit overrides (`correctness.noUnusedVariables: "warn"`, `security.noDangerouslySetInnerHtml: "off"`). It does **not** enable Biome's `style` rule group, and specifically does not turn on `useNamingConvention` (Biome's naming-convention linter, off by default under `recommended`). This means:

- All naming conventions described above are informal/organic (consistently followed in practice) rather than lint-enforced.
- Biome's `recommended` preset does not include `useNamingConvention`, so no automated check currently guards against camelCase/PascalCase/UPPER_SNAKE_CASE drift in `src/**/*.{ts,tsx}`.
- Recommendation: if enforcement is desired, enable `linter.rules.style.useNamingConvention` in `biome.json`. ⭐️3 (would formalize an already-consistent convention; not urgent since no violations were found).

## Summary of inconsistencies found

1. Storage key casing: `date-roll-over-time` (kebab-case) vs. every other `kv` key (snake_case). Confirmed. ⭐️2 to fix (migration risk vs. cosmetic gain).
2. Duplicate `DATE_ROLL_OVER_TIME_KEY` constant defined independently in `App.tsx` and `ConfigApp.tsx` instead of shared. Confirmed. ⭐️2 to fix.
3. Duplicate `BeforeInstallPromptEvent` interface in `src/globals.d.ts` and `src/lib/utils.ts`. Confirmed. ⭐️2 to fix.
4. `.claude/rules/code-style.md`'s stated file-naming convention (kebab-case files) does not match actual `src/` file naming (PascalCase for components, camelCase/lowercase for libs). Confirmed stale documentation, not a code defect.

No inconsistencies were found in variable/function (camelCase), type/component (PascalCase), or module constant (UPPER_SNAKE_CASE) naming — those three conventions are applied uniformly across every file examined.

<!-- commit-hash: e021877bb892db6cc019f4e0520449119de3c079 -->
