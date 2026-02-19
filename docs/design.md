# Fast Logbook PWA — Technical Design Document

**Version**: 2
**Created**: 2026-02-19
**Target app version**: 26.02.05

---

## Table of Contents

1. [Design Overview](#1-design-overview)
2. [Architecture Principles](#2-architecture-principles)
3. [PWA Design](#3-pwa-design)
4. [Log Format Design](#4-log-format-design)
5. [Export Pipeline Design](#5-export-pipeline-design)
6. [Internationalization (i18n) Design](#6-internationalization-i18n-design)
7. [Toolchain Design](#7-toolchain-design)
8. [Deployment Design](#8-deployment-design)
9. [Security Design](#9-security-design)
10. [Performance Design](#10-performance-design)
11. [Known Constraints & Future Improvements](#11-known-constraints--future-improvements)

---

## 1. Design Overview

### Purpose

This document records the technical design decisions and their rationale for Fast Logbook PWA. Implementation details (API and function specifications) are documented in [`docs/spec/`](spec/). This document supplements those with the "why".

### Problem Statement

Requirements for a timestamped work-log tool:

1. **No server** — personal data must not be transmitted externally
2. **Zero setup** — usable immediately without installation or account registration
3. **Offline operation** — continues to work when the network is disconnected
4. **Cross-device** — supports both PC and smartphones

### Design Trade-off Summary

| Choice | Benefits | Drawbacks |
|--------|----------|-----------|
| Client-only | Privacy protection, no server cost | No cross-device sync, manual backup |
| localStorage | Simple implementation, synchronous API | 5–10 MB quota, performance degrades with large logs |
| Vanilla JS (no framework) | Fast, no dependencies, easy long-term maintenance | Imperative state management |
| CDN-hosted libraries | Zero build step, instant deployment | CDN outage can affect offline behavior |

---

## 2. Architecture Principles

### 2.1 Client-Only Principle

All data processing and storage is completed within the browser. No backend server exists.

```
Browser
├── index.html / config.html   # UI
├── js/ (ES Modules)           # Logic
├── localStorage               # Data persistence
├── Service Worker             # Offline cache
└── Cache API                  # Asset cache
```

**Rationale**: Work logs may contain personal or business information. Eliminating external transmission at the architecture level reduces privacy risk to zero by design.

### 2.2 Zero-Build Principle (Development)

Opening `index.html` directly in a browser is sufficient to run the application. No TypeScript compilation or npm bundling is required.

```bash
# Instant local startup
npx serve .
```

**Rationale**: Adding a build step increases the complexity of CI/CD and onboarding. Vanilla JavaScript ES Modules are natively supported by modern browsers, making a bundler unnecessary.

**Exception**: Production deployment via Docker runs `npm ci` to install devDependencies, but the application itself is not bundled.

### 2.3 Module Structure

```
js/
├── main.js        # Main page entry point (initialization & event binding)
├── config.js      # Config page entry point
└── lib/
    ├── analytics.js           # Google Analytics GA4 event tracking
    ├── utils.js               # Date/time, string, theme, PWA utilities
    ├── download.js            # Log parsing, formatting, and export
    ├── multilingualization.js # i18n dictionary and translation engine
    └── indolence.min.js       # DOM utilities (minified)
```

Dependencies flow one-way: `main.js / config.js → lib/`. Circular dependencies within `lib/` are not permitted.

---

## 3. PWA Design

### 3.1 Web App Manifest

Key design decisions in [manifest.json](../manifest.json):

| Field | Value | Rationale |
|-------|-------|-----------|
| `display` | `standalone` | Hides browser UI for a native-app-like experience |
| `start_url` | `/index.html` | Specifies HTML explicitly rather than root `/` |
| `id` | Fixed UUID string | Stabilizes the identity of the installed PWA |
| `theme_color` | `#62BF04` | Brand color shown in address bar and taskbar |
| `version` | `YY.MM.DD` | Used as the service worker cache key |

Icons are provided in 6 sizes from 48px to 512px to cover Android, iOS, and desktop resolutions.

### 3.2 Service Worker Strategy

[sw.js](../sw.js) adopts a **Stale-While-Revalidate + Date header comparison** strategy.

```
Request received
    ↓
Cache hit?
    ├─ YES → Return cache immediately & fetch network in parallel
    │           ↓
    │         Compare Date headers
    │           ├─ Network is newer → return network response, update cache
    │           └─ Cache is equal/newer → return cached response
    └─ NO  → Fetch from network (fall back to cache on failure)
```

**Cache-Control design (Nginx side)**:

| Resource | Cache-Control | Rationale |
|----------|--------------|-----------|
| `sw.js` | `no-cache` | Always check for the latest SW |
| `index.html` / `config.html` | `no-cache` | Reflect content updates immediately |
| JS / CSS / PNG | `public, immutable, max-age=1y` | Long-term cache for versioned static assets |

**Cache versioning**: The cache name includes the `version` field from `manifest.json` (e.g., `Fast logbook PWA_26.02.05`). When the version changes, the activate event automatically deletes old caches.

### 3.3 Offline Support for CDN Resources

Bootstrap CSS/JS is loaded from CDN (jsDelivr), but is explicitly listed in `assets` so it is cached at install time:

```javascript
const assets = [
  // ...
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js",
];
```

This ensures Bootstrap remains available during CDN outages or when offline.

**Known limitation**: When upgrading the Bootstrap version, the `assets` list in the service worker must also be updated.

### 3.4 PWA Installation Flow

```
beforeinstallprompt fires
    ↓
Store promptEvent on DOM element
    ↓
Show "Install PWA" button (remove d-none)
    ↓
User clicks
    ↓
Call promptEvent.prompt()
    ↓
userChoice.then() → hide button again
```

The install button appears only in environments where `beforeinstallprompt` fires (Chrome/Edge). On unsupported browsers such as iOS Safari, the button remains hidden.

---

## 4. Log Format Design

### 4.1 Format Specification

```
YYYY-MM-DD HH:MMCategory;Detail\n
```

**Design decisions**:

| Element | Specification | Rationale |
|---------|--------------|-----------|
| Datetime format | `YYYY-MM-DD HH:MM` | ISO 8601 compliant, sortable |
| Separator | `;` | Visually distinguishes category from sub-detail |
| Between datetime and category | No space | Datetime is extractable via fixed-length 16 chars (`slice(0, 16)`) |
| Between entries | `\n` | Human-readable plain text format |

### 4.2 Special Prefixes

| Prefix | Meaning | Example |
|--------|---------|---------|
| `^` | Excluded from actual work time | `^Lunch`, `^Break` |
| `@` | Context (convention, optional) | `@work`, `@personal` |
| `+` | Project name (convention, optional) | `+ProjectA` |

Only `^` is interpreted by the application. `@` and `+` are user conventions and are not enforced.

### 4.3 Time Calculation Algorithm

The time difference between two consecutive entries is calculated and attributed to the category of the earlier entry:

```
Entry 1: 2025-12-13 09:00 ProjectA;Meeting
Entry 2: 2025-12-13 10:30 ProjectB;Coding
Entry 3: 2025-12-13 12:00 ^Lunch

→ ProjectA time = 10:30 - 09:00 = 90 min
→ ProjectB time = 12:00 - 10:30 = 90 min
→ Lunch excluded from actual work time
```

**Midnight crossing**: When the time difference is negative (e.g., 23:45 → 00:15), one day is added to correct the calculation.

**Rounding**: `Math.floor(minutes/60) + Math.round(minutes%60/roundingUnit) * roundingUnit/60`

---

## 5. Export Pipeline Design

### 5.1 Indirect Download Mechanism

A normal file download only requires clicking an `<a download>` element. However, triggering a download from a `window.open` context can be blocked by security constraints.

To solve this, an indirect download pattern via localStorage is used:

```
Call download()
    ↓
Generate Blob → Object URL
    ↓
Store { downloadUrl, downloadFilename } in localStorage
    ↓
Dispatch startDownload custom event
    ↓
Event listener (same window context) receives it
    ↓
Create <a> element dynamically → click() → remove
    ↓
URL.revokeObjectURL() to free memory
    ↓
Remove downloadUrl, downloadFilename from localStorage
```

### 5.2 Output Format

A single HTML file bundles 3 formats:

```html
<!-- Section 1: HTML summary table -->
<table id="html_summary-source">...</table>

<!-- Section 2: Plain text (original log) -->
<pre id="plaintext_log-source"><code>...</code></pre>

<!-- Section 3: Markdown table -->
<pre id="markdown_summary-source">...</pre>
```

Each section has a copy button (Font Awesome icon) for clipboard copying. A single self-contained file is easy to attach to email or share.

---

## 6. Internationalization (i18n) Design

### 6.1 Flash Prevention Strategy

With a standard post-DOMContentLoaded translation approach, English text briefly appears on initial render (translation flash). To prevent this, `config.html` runs `Multilingualization.init()` as an inline `<script type="module">` inside `<head>`:

```html
<head>
  <!-- After CSS, before body -->
  <script type="module">
    import Multilingualization from '/js/lib/multilingualization.js';
    Multilingualization.init(); // Start MutationObserver
  </script>
</head>
```

A MutationObserver monitors DOM node additions and translates elements with `data-translate` attributes as soon as they are added. The observer is disconnected after the initial translation to eliminate overhead.

### 6.2 Translation Key Design

Translation keys are specified directly via the HTML `data-translate` attribute, avoiding hard-coded strings in JavaScript:

```html
<button data-translate="help_close_button"></button>
```

**Key naming convention**: `{screen}_{component}_{action}` format (e.g., `help_tab_main_screeen`).

### 6.3 Language Detection

```javascript
const browserLang = navigator.language || navigator.userLanguage;
return browserLang?.startsWith('ja') ? 'ja' : 'en';
```

Japanese environments (`ja-JP`, etc.) use Japanese; everything else falls back to English.

---

## 7. Toolchain Design

### 7.1 Biome (lint + format)

#### Migration History from ESLint

| Aspect | ESLint v4.x (old) | ESLint v10 (interim) | Biome v2 (current) |
|--------|------------------|---------------------|-------------------|
| npm vulnerabilities | 12 (including high) | 4 (moderate) | **0** |
| Config file | `.eslintrc.json` | `eslint.config.js` | `biome.json` |
| Format capability | None (Prettier needed separately) | None | **lint + format combined** |
| Execution speed | Slow (Node.js) | Slow (Node.js) | **Fast (Rust)** |

#### Biome Configuration Policy

Design of [biome.json](../biome.json):

```jsonc
{
  "files": {
    "includes": ["js/**/*.js", "!js/lib/indolence.min.js"]  // Exclude minified file
  },
  "formatter": {
    "indentStyle": "space", "indentWidth": 2, "lineEnding": "lf"
  },
  "javascript": {
    "formatter": { "quoteStyle": "single", "semicolons": "always" }
  },
  "linter": {
    "rules": {
      "recommended": true,
      "correctness": { "noUnusedVariables": "warn" },
      "complexity": { "noStaticOnlyClass": "off" }  // Preserve existing class structure
    }
  }
}
```

Reason for disabling `noStaticOnlyClass`: The `Multilingualization` class uses only static members, but refactoring it is deferred as a separate task.

### 7.2 CI/CD (GitHub Actions)

Two workflows are defined under `.github/workflows/`:

```
push / PR (main, develop)
    ├── lint.yml         npm run lint     (biome check)
    └── audit.yml        npm audit --audit-level=high
```

**Audit level policy**: `--audit-level=high` is specified so that moderate-and-below vulnerabilities (e.g., ajv inside ESLint internals) do not fail CI. Only high and critical vulnerabilities cause failures.

**Self-hosted runner**: Uses `ubuntu-slim` label (lighter than standard `ubuntu-latest`).

---

## 8. Deployment Design

### 8.1 Static Hosting (Netlify)

No build process. Files are served directly on `git push`.

```
GitHub repository
    ↓ (webhook)
Netlify CDN
    → https://fast-logbook.netlify.app/
```

### 8.2 Docker / Nginx Configuration

A Docker image is provided for self-hosted (local or on-premise) deployments. A multi-stage build minimizes the final image size:

```dockerfile
# Stage 1: Builder (node:24-bookworm-slim)
#   npm ci → (run build script if present)

# Stage 2: Production (nginx:alpine)
#   Copy files → Nginx config → EXPOSE 80
```

**Rationale for Nginx cache headers**:

- `sw.js` → `no-cache`: The browser re-fetches the SW if even a single byte changes; caching would delay updates
- `index.html` → `no-cache`: Stale HTML breaks JS/CSS references
- Static assets (JS/CSS/images) → `immutable, 1y`: Maximize browser cache since file content does not change

```nginx
location /sw.js {
    add_header Cache-Control "no-cache";
    add_header Service-Worker-Allowed "/";  # Explicitly declare SW scope
}
location ~* \.(js|css|png|...)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## 9. Security Design

### 9.1 XSS Protection

User-entered log data must always be sanitized with `escapeHtml()` before being included in HTML output:

```javascript
export function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

JavaScript in exported HTML is minimal (copy functionality only) and never dynamically evals user data.

### 9.2 Content Security Policy

No CSP header is configured in the current version. Since Bootstrap is loaded from CDN, `script-src cdn.jsdelivr.net` would need to be permitted. Adding a CSP to the Nginx configuration is recommended for future hardening.

### 9.3 localStorage Privacy

- Storage is scoped to the same origin (protocol + domain + port)
- No data is ever transmitted to a server
- The analytics module (`js/lib/analytics.js`) sends only Google Analytics events; log data is never sent

### 9.4 Console Disabling in Production

`$$disableConsole()` from [js/lib/indolence.min.js](../js/lib/indolence.min.js) is called during `main.js` initialization to suppress console output in production environments (non-localhost).

---

## 10. Performance Design

### 10.1 Debounced localStorage Writes

Writing to localStorage on every keystroke creates contention between DOM operations and synchronous I/O. A 300ms debounce reduces write frequency from O(keystrokes) to O(typing pauses):

```javascript
clearTimeout(debounceTimeout);
debounceTimeout = setTimeout(() => saveLogs(), 300);
```

On IME (Japanese input) confirmation, `compositionend` triggers an immediate save to prevent data loss while a debounce is pending.

### 10.2 Speculation Rules API

Prerender/prefetch rules are embedded in `index.html` to prefetch navigation targets:

```html
<script type="speculationrules">
{
  "prerender": [{ "where": { "href_matches": "/*" }, "eagerness": "moderate" }]
}
</script>
```

Supported in Chrome 108+. Silently ignored by unsupported browsers (progressive enhancement).

### 10.3 Font and Icon Optimization

- Icons use Bootstrap Icons (CSS font), reducing HTTP requests compared to individual SVG loading
- Fonts use the OS default font stack (no `font-family` specified), eliminating font download overhead

---

## 11. Known Constraints & Future Improvements

### 11.1 Current Constraints

| Constraint | Impact | Workaround |
|------------|--------|-----------|
| Synchronous localStorage I/O | Write latency with large logs (>5 MB) | Recommend periodic log cleanup |
| No cross-device sync | Cannot share logs across devices | Manual export → import |
| No data migration logic | Old data may break if localStorage schema changes | Maintain backward-compatible keys |
| No CSP configured | Weaker defense against injection attacks | Add CSP headers to Nginx |
| SW `assets` list managed manually | Risk of missing files when new files are added | Consider adopting Workbox |

### 11.2 Future Improvement Candidates

- **Migrate to IndexedDB**: Async API improves performance with large logs; Dexie.js recommended
- **Data compression**: Use CompressionStream API to gzip-compress logs and reduce localStorage usage
- **Import functionality**: UI to re-import logs from previously exported HTML files
- **Test coverage**: Add Vitest (unit) + Playwright (E2E); no test framework is currently configured
- **Add CSP headers**: Configure `script-src 'self' cdn.jsdelivr.net` etc.
- **Workbox for SW management**: Auto-generate the `assets` list to reduce maintenance overhead

---

*Update this document when implementation changes. For implementation details, refer to [`docs/spec/`](spec/).*

<!-- commit: ef46e13 -->
