---
name: analyzed-naming_convention
description: Naming conventions for variables, functions, components, files, and storage keys as actually practiced.
type: analysis
commit-hash: d363d07ab70bdbae818bada7838fe13166f4ef08
---

# Naming Conventions

- [Code Identifiers](#code-identifiers)
- [Files](#files)
- [Storage Keys (the "column names")](#storage-keys-the-column-names)
- [Other Names](#other-names)

Derived from the current `src/` tree (Factual). Enforced mechanically only where Biome covers it; the rest is convention.

## Code Identifiers

| Kind | Convention | Examples |
| --- | --- | --- |
| Variables / functions | `camelCase` | `loadLogs`, `rollOverTime`, `handleDateChange` |
| Event handlers | `handle` + Subject + Event | `handleTextareaInput`, `handleConfirmDelete` |
| Module constants | `UPPER_SNAKE_CASE` | `LOG_DATA_KEY`, `DB_NAME`, `TIME_LENGTH` |
| React components | `PascalCase` function components | `App`, `ConfigApp`, `Drawer`, `Modal`, `HelpModal` |
| Types / interfaces | `PascalCase`, no `I` prefix | `DrawerProps`, `ParsedCategory`, `BeforeInstallPromptEvent` |
| Refs | `xxxRef` | `textareaRef`, `bcRef`, `debounceRef` |
| Module-private state | `_` prefix | `_downloadUrl`, `_downloadFilename` |

## Files

| Kind | Convention | Examples |
| --- | --- | --- |
| Components / pages | `PascalCase.tsx` | `App.tsx`, `Drawer.tsx` |
| Non-component modules | lowercase `.ts` | `storage.ts`, `utils.ts`, `download.ts`, `index.ts` |
| Locales | ISO 639-1 `.json` | `en.json`, `ja.json` |

## Storage Keys (the "column names")

No table/column names exist (KV store); keys are the equivalent — and they are **inconsistent** (Factual):

| Style | Keys |
| --- | --- |
| `snake_case` (majority) | `log_buffer`, `log_buffer_date`, `last_edited_date`, `migration_version`, `notice_date_selector`, `rounding_mins`, `shortcut_1`…`shortcut_9` |
| `kebab-case` (legacy carryover) | `date-roll-over-time` |
| bare word | `log` |

New keys should use `snake_case`; `date-roll-over-time` is frozen for backward compatibility (renaming would require a migration step).

## Other Names

- i18n keys: `snake_case`, prefixed by screen/feature (`help_config_screen_…`, `work_time_actual`).
- CSS: Bootstrap vocabulary + a few custom kebab-case classes (`navbar-save-status`, `content-wrapper`, `shortcut-area`).
- Cross-tab channel `fast-logbook-sync`; IndexedDB `fast-logbook-pwa` / store `kv`: kebab-case.

d363d07ab70bdbae818bada7838fe13166f4ef08
