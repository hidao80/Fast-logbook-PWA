---
name: analyzed-security
description: OWASP Top 10-style security audit of the client-only Fast-Logbook PWA (React 19 + TypeScript + IndexedDB), covering XSS injection points, dependency vulnerabilities, and missing security headers.
type: analysis
commit-hash: ceff98ab997a60d35e564821f2e6bf7b6c284128
---

# Security Audit — Fast-Logbook PWA

Client-only, backend-less PWA (React 19.2 + TypeScript + Vite). All data is stored locally in IndexedDB (via `idb`, migrated from `localStorage`). No server component exists in this repository; Netlify is used purely as a static host.

## Findings by severity

### Medium

**M1 — No security headers configured (CSP / HSTS / X-Frame-Options / X-Content-Type-Options)**
`netlify.toml` (repo root) defines only a `Content-Type` header override for `/manifest.json` and an SPA fallback redirect:
```toml
[[headers]]
  for = "/manifest.json"
  [headers.values]
    Content-Type = "application/manifest+json"
```
No `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, or `X-Content-Type-Options` headers are set anywhere in the repo (checked `netlify.toml`, `vite.config.ts`, `public/`, `index.html`). Netlify's platform defaults do not add these automatically. Given the app embeds 17 `dangerouslySetInnerHTML` call sites (see L1 below), a CSP would be meaningful defense-in-depth against any future regression that lets untrusted content reach one of those sinks. Confirmed by direct file read, not speculative.

**M2 — `toMarkdown()` does not escape interpolated values (defense-in-depth gap)**
`src/lib/download.ts:174-201`, specifically line 184:
```ts
output += `${category} | ${dataJson[category].detail} | ${dataJson[category].round} | ${dataJson[category].time}\n`;
```
`category` and `detail` come from user-entered log text (parsed in `parse()`, `src/lib/download.ts:64-119`) and are inserted into the Markdown table with no `escapeHtml()` call, unlike the equivalent `toHtml()` function (`src/lib/download.ts:124-169`, lines 140-141) which does escape both fields.

**Verified this is NOT currently exploitable**: `toMarkdown()`'s output is only consumed by `generateFormattedLog()` (`src/lib/download.ts:206-238`), where the Markdown section is placed in the `isCode: true` branch and the *entire* section content — including the unescaped category/detail text — is passed through `escapeHtml()` before being embedded in the HTML page (`src/lib/download.ts:229`: `` `<pre><code id='${section.title}-source'>${escapeHtml(section.content)}</code></pre>` ``). So the current single call path is safe. This is rated Medium rather than Low because `toMarkdown()` is an exported function with no internal escaping guarantee — any future caller (e.g., a plain `.md` file download or a raw clipboard-copy feature) that uses it without re-escaping would reintroduce a stored-XSS-via-Markdown-viewer risk if that Markdown is later rendered as HTML elsewhere. Recommend adding escaping inside `toMarkdown()` itself for API safety, matching `toHtml()`.

### Low / Informational

**L1 — `dangerouslySetInnerHTML` usage (17 call sites) — confirmed NOT user-controlled**
Enumerated every occurrence in `src/App.tsx`. All 17 sites pass `{ __html: t('<fixed-key>') }` or `{ __html: t(k) }` where `k` is drawn from a hardcoded array of string literal i18n keys (never runtime/user data):
- Line 635-637: `t('notice_date_selector_content')`
- Line 721-723: `t('help_main_screen_memo')`
- Line 726-728: `t('help_main_screen_shortcut')`
- Line 731-733: `t('help_main_screen_save_status')`
- Line 744-746: `t('help_main_screen_show_formated_log')`
- Line 749-751: `t('help_main_screen_download_formated_log')`
- Line 754-756: `t('help_main_screen_config')`
- Line 759-761: `t('help_main_screen_delete_log')`
- Line 764-766: `t('help_main_screen_install_pwd')`
- Line 787-789: `t('help_main_screen_example_1')`
- Line 793-795: `t('help_main_screen_example_2')`
- Line 798-800: `t('help_main_screen_example_3')`
- Line 851-853: `t('help_main_screen_hint')`
- Line 861-863: `t('help_main_screen_delete_log_content')`
- Line 907: `t(k)` where `k` ∈ a fixed array `['help_config_screen_example_1' … '_6']`
- Line 937-939: `t('help_config_screen_hint')`
- Line 962: `t('help_changelog')`

All translation values are static content in `src/i18n/locales/en.json` / `ja.json`, not derived from user input, URL parameters, or stored log data at any of these sites. **Confirms the prior finding**: this is not an XSS vector under current code. Residual risk is only theoretical — if i18next were ever configured to load remote/user-supplied translation bundles, or a new call site interpolated log content directly, this pattern would become exploitable. No such configuration was found (`react-i18next` is initialized with local bundled JSON resources only).

**L2 — `viewer.document.write()` with user-derived content — confirmed escaped**
`src/App.tsx:399`: `viewer.document.write(outputStr)`, where `outputStr = generateFormattedLog(log, Number(mins))` (line 396) and `log` is the user's raw log text from IndexedDB. Inside `generateFormattedLog()` → `toHtml()` (`src/lib/download.ts:140-141`), category and detail fields are wrapped in `escapeHtml()` before insertion into the `<table>` HTML. The raw-log and Markdown sections are also escaped via the `isCode` branch (see M2 above). No unescaped user data reaches `document.write()` on this path.

**L3 — External CDN resources embedded in exported HTML (no SRI risk found — SRI is present)**
`generateFormattedLog()` (`src/lib/download.ts:218-220`) embeds Bootstrap JS/CSS and Font Awesome CSS from `cdnjs.cloudflare.com` into the *user-downloaded, standalone* HTML file (not the live app). All three `<script>`/`<link>` tags carry `integrity` (SRI hash) and `crossorigin='anonymous'` attributes, consistent with `.claude/rules/security.md`'s CDN policy. This is not a vulnerability but is noted because it is an external network dependency: if the downloaded HTML file is opened later, it fetches from cdnjs at that time (mild availability/tracking consideration, not a security flaw per se, and out of scope for the app's own "no data leaves the browser" claim since no log data is sent to the CDN — only static library files are fetched).

### Not applicable

- **Authentication & Authorization**: No auth mechanism exists in the codebase (no login, tokens, or session logic found via grep for `password`, `token`, `secret`, `apikey` case-insensitive across `src/` — zero relevant matches beyond this audit's own search). Not applicable — no backend.
- **CORS**: No API endpoints or cross-origin requests to first-party infrastructure exist. Not applicable — no backend.
- **Rate Limiting**: Not applicable — no backend, no server-side endpoints.
- **File Upload validation**: No file upload feature found in the codebase (grep for `<input type=.file.` and `FileReader` found no matches in `src/`). Not applicable.
- **SQL Injection**: No SQL/database server; persistence is via IndexedDB (`idb` library) accessed through parameterized JS APIs, not string-concatenated queries. Not applicable.
- **Command Injection / Path Traversal**: No server-side file or shell access exists in the client bundle. Not applicable.

## Secret & credential leakage

Grepped `src/` (case-insensitive) for `API_KEY`, `SECRET`, `PASSWORD`, `TOKEN`, `apikey`. Matches were limited to `src/App.tsx` and `src/lib/download.ts`, and on inspection these were false positives from the word "token" not appearing in code identifiers relevant to secrets — no hardcoded credentials, API keys, or tokens were found. `.npmrc` sets `ignore-scripts=true` and `min-release-age=7` (supply-chain hardening), confirmed present:
```
ignore-scripts=true
min-release-age=7
```

## Dependency vulnerabilities

Ran `pnpm audit --audit-level=high` directly against the current lockfile at HEAD:
```
No known vulnerabilities found
```
CI also runs `pnpm audit --audit-level=high` (`audit.yml`) and `flatt-security/setup-takumi-guard-npm` (`lint.yml`) as supply-chain gates — not independently re-verified beyond confirming the audit command itself is clean locally.

## Transport security

`netlify.toml` contains no explicit HTTPS-enforcement redirect, but Netlify's platform serves all sites over HTTPS by default with automatic HTTP→HTTPS redirection at the edge (platform behavior, not verifiable from this repo's config alone — **unconfirmed** whether this project has that platform default disabled, since no Netlify dashboard access was available). No HTTP-only endpoints or mixed-content resource references were found in the codebase (all CDN references in `src/lib/download.ts` use `https://`).

## Data exposure (stack traces / error paths)

Did not find any error boundary or catch block that serializes raw exception objects (including stack traces) into UI-visible output within `src/App.tsx` or `src/lib/*.ts` beyond what was already reviewed above; a full line-by-line audit of every try/catch block was not performed as part of this pass — **flagged as not exhaustively verified**, recommend a dedicated follow-up if deeper coverage is desired.

<!-- commit-hash: ceff98ab997a60d35e564821f2e6bf7b6c284128 -->
