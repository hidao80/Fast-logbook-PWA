---
name: analyzed-utilities
description: Global helper functions and shared library modules under src/lib/.
type: analysis
commit-hash: d363d07ab70bdbae818bada7838fe13166f4ef08
---

# Utilities

- [src/lib/utils.ts](#srclibutilsts)
- [src/lib/storage.ts](#srclibstoragets)
- [src/lib/download.ts](#srclibdownloadts)
- [Notes](#notes)

No classes/traits — all helpers are exported functions (Factual). JSDoc with `@example` is the house style.

## src/lib/utils.ts

| Export | Purpose |
| --- | --- |
| `LOG_DATA_KEY` / `ROUNDING_UNIT_MINUTE_KEY` | Storage key constants (`'log'`, `'rounding_mins'`) |
| `getTodayString()` | `YYYY-MM-DD` for today |
| `fetchHourFromTime()` / `fetchMinFromTime()` | Extract HH/MM by string slicing (avoids Safari `Invalid Date`); overloaded number/string return |
| `getRoundingUnit()` | Whitelist-validate rounding value → 1/5/10/15/30/60, default 1 |
| `appendTime(tag, date?)` | Prefix tag with `YYYY-MM-DD HH:MM` (current time, given or today's date) |
| `trimNewLine()` | Collapse blank lines, trim leading/trailing newline |
| `escapeHtml()` | 5-char HTML escaper (`& < > " '`) |
| `installPWA(elem)` | Legacy imperative install-button wiring — **unused**; `App.tsx` re-implements the flow with refs (Factual, verified: no importer) |
| `autoSetTheme()` | Resolve `data-bs-theme="auto"` against `prefers-color-scheme` |

## src/lib/storage.ts

`getItem` / `setItem` / `removeItem` — async string KV over IndexedDB (`idb`), plus `migrateFromLocalStorage(keys)` one-time copy-and-delete. Details → [databases.md](databases.md).

## src/lib/download.ts

| Export | Purpose |
| --- | --- |
| `parse(text, mins)` | Log text → `{category: {time, detail, round}}`; time = diff between consecutive timestamps (midnight-wrap handled); details de-duplicated |
| `toHtml(log, mins)` | Bootstrap table + actual/total sums (`^`-prefixed categories excluded from "actual") |
| `toMarkdown(log, mins)` | Same summary as a Markdown table |
| `generateFormattedLog(log, mins)` | Full standalone HTML page (3 sections + clipboard-copy script; CDN Bootstrap/Font Awesome with SRI) |
| `download(str, ext?, mime?)` | Blob URL + module-level state + `startDownload` CustomEvent → `<a download>` click |
| `downloadLog(log?)` | Reads log/rounding from storage, generates page, triggers download |

## Notes

- `installPWA()` in `utils.ts` is dead code — candidate for removal (recommendation ⭐️⭐️⭐️⭐️).
- Rounding arithmetic (`Math.floor(t/60) + Number(((Math.round((t%60)/mins)*mins)/60).toFixed(2))`) is duplicated 5× across `parse`/`toHtml`/`toMarkdown` — extraction candidate (⭐️⭐️⭐️).
- The pure functions here (`parse`, `getRoundingUnit`, time helpers) are the prime unit-test targets — see [test.md](test.md).

d363d07ab70bdbae818bada7838fe13166f4ef08
