# Code Style Rules

Coding conventions for this project, based on `biome.json` settings and existing code patterns.

## Formatting

- Indent: **2 spaces** (no tabs)
- Line ending: **LF**
- Quotes: **single quotes** (string literals)
- Semicolons: **required**

## Naming Conventions

- Variables and functions: `camelCase`
- Module-scope constants: `UPPER_SNAKE_CASE` (e.g. `LOG_DATA_KEY`, `CACHE_NAME`)
- Classes: `PascalCase` (e.g. `Multilingualization`)
- Files: `kebab-case` (e.g. `multilingualization.js`)

## Module Structure

- `js/main.js` and `js/config.js` are page entry points; they may depend on `lib/`
- Modules inside `js/lib/` must not depend on each other (one-way dependency only)
- Use relative paths for imports (e.g. `'./lib/utils.js'`)

## DOM Manipulation

- Use `$$one()` / `$$all()` (`indolence.min.js` utilities) for element selection
- Do not write `document.querySelector` / `querySelectorAll` directly

## JSDoc

- Write JSDoc for all `export`ed functions
- Include `@param`, `@returns`, and `@example` (follow the style in `utils.js`)
- Not required for internal functions (e.g. inside `DOMContentLoaded`), but write it for anything that acts as a public API

## i18n

- Do not hardcode UI strings; use `Multilingualization.translate('key')`
- Hardcoded Japanese strings are forbidden (the existing `'ストレージ容量が不足しています'` is a known unfixed bug)
- Translate HTML elements via the `data-translate="key"` attribute

## Log Format

Log entries strictly follow the format `YYYY-MM-DD HH:MMCategory;Detail`.
- The datetime portion is always 16 characters (extracted with `slice(0, 16)`)
- Field separator: `;`
- Record separator: `\n`
- The `^` prefix marks entries excluded from work-time calculation

## Service Worker

Whenever a new JS/CSS/image file is added, **also add it to the `assets` array in `sw.js`**.
Omitting it will prevent the file from loading when offline.

## Biome Lint

- `noStaticOnlyClass` is disabled (to preserve the `Multilingualization` static class)
- `noUnusedVariables` is set to `warn`
- `js/lib/indolence.min.js` is excluded from linting
- Lint scope is `js/**/*.js` only (`sw.js` is not linted)
