---
name: analyzed-performance
description: Performance characteristics, processing costs, concurrency, and potential bottlenecks.
type: analysis
commit-hash: d363d07ab70bdbae818bada7838fe13166f4ef08
---

# Performance

- [Measured vs. Analytical](#measured-vs-analytical)
- [Processing Costs](#processing-costs)
- [Concurrency](#concurrency)
- [Load-time](#load-time)
- [Potential Bottlenecks](#potential-bottlenecks)

## Measured vs. Analytical

No profiling data exists in the repo; everything below is **static analysis (Speculative unless marked Factual)**. No performance budget or Lighthouse CI is configured.

## Processing Costs

| Operation | Complexity | Trigger frequency |
| --- | --- | --- |
| `loadLogs()` — split full log, `new Date()` per line, filter | O(n) over **entire** log history | On load, date change, cross-tab message |
| `flushBuffer()` — split, filter, merge, **sort** | O(n log n) over entire log | Tab hide, date change, load, sync message |
| `parse()` in download.ts | O(n) single pass | Export / viewer only (user action) |
| Textarea autosave | O(day's text), debounced 300ms | Per keystroke burst (Factual) |

n = total lines ever logged. For a personal work log (~20–50 lines/day → ~18k lines/year), all of these are sub-millisecond-to-low-ms in practice (Speculative but high confidence). Log compression via `CompressionStream` is already a tracked TODO for very large logs.

## Concurrency

- Single-threaded UI; no workers other than the Workbox service worker (cache serving off-main-thread).
- Parallelism used: `Promise.all` for the 9 shortcut reads (Factual, `App.tsx` / `ConfigApp.tsx`).
- Multi-tab writes are coordinated only via BroadcastChannel + last-write-wins merge in `flushBuffer()`; two tabs editing **different** days is safe by design; the same day in two tabs is last-flush-wins (Factual behavior, potential edit-loss noted in [known_bugs.md](known_bugs.md)).

## Load-time

- Vite production build: bundled/minified, Workbox precaches all `js/css/html/png/ico/svg/woff2/json` (Factual) — repeat visits are cache-served.
- Bootstrap CSS + bootstrap-icons woff2 are the heaviest assets (Speculative; no bundle analysis in repo).
- Speculation Rules prerender/prefetch in `index.html` accelerates in-app navigation on Chromium (Factual that it's configured).

## Potential Bottlenecks

Ranked; all currently theoretical:

1. **Full-log rescan on every date change / sync message** (`loadLogs` + `flushBuffer`) — fine now; would degrade with multi-year logs. Fix option: index by day in IndexedDB (⭐️⭐️ now, ⭐️⭐️⭐️⭐️ if logs grow large).
2. **`new Date()` per line in filters** — cheaper to compare the 16-char prefix lexically since the format is sortable (⭐️⭐️⭐️ micro-optimization, only with #1).
3. **Modal/Drawer render help content eagerly** — HelpModal builds a large tab tree on each open; negligible (⭐️).

d363d07ab70bdbae818bada7838fe13166f4ef08
