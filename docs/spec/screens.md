# Screen Inventory & Navigation

## Overview

Fast Logbook PWA consists of two HTML screens plus one dynamically generated viewer. Navigation between screens is explicit (no routing library).

---

## Screen 1: Main Application (`index.html`)

**URL**: `/` or `/index.html`
**Entry Point**: Yes (PWA `start_url`)
**Module**: [js/main.js](../../js/main.js)

### Purpose

Primary interface for logging time-stamped work activities.

### Screen States

| State | Description | Trigger |
|-------|-------------|---------|
| **Initial Load** | Empty textarea, shortcuts initialized | `DOMContentLoaded` |
| **Log Loaded** | Textarea populated from localStorage | `loadLogs()` on init |
| **Dirty** | Save status red (●), unsaved changes | User types in textarea |
| **Saving** | Debounce timer active (300ms) | Input event |
| **Saved** | Save status green (●) | `saveLogs()` completes |
| **Sidebar Open** | Offcanvas menu visible | Toggler button click or `[` key |
| **Delete Modal** | Confirmation dialog shown | "Delete log" menu item |
| **Help Modal** | Fullscreen help dialog | Help button (`?` icon) |

### Navigation Flows

```
index.html
    ├── [Configure menu] → config.html
    ├── [View Formatted Log] → opens new browser tab (generated HTML)
    ├── [Download Formatted Log] → triggers file download (.html)
    └── [Delete Log] → confirmation modal → clears data, stays on index.html
```

### Key DOM Elements

| Selector | Role |
|----------|------|
| `.navbar-toggler` | Opens/closes sidebar |
| `.navbar-save-status` | Save state indicator (green/red ●) |
| `#help_button` | Opens help modal |
| `#sideMenu` | Offcanvas sidebar |
| `#view_formatted_log` | View log in new tab |
| `#download_formatted_log` | Download log as HTML |
| `#configure` | Navigate to config.html |
| `#delete_log` | Open delete confirmation |
| `#install_pwa` | PWA install button (hidden until `beforeinstallprompt`) |
| `#version_number` | Displays version from manifest.json |
| `label[data-shortcut-key]` | Shortcut buttons (1-9) |
| `input[type=text]` | Free-form input (key 0) |
| `textarea` | Main log editing area |
| `#deleteConfirmModal` | Delete confirmation dialog |
| `#confirmDeleteButton` | Confirm delete action |
| `#helpModal` | Fullscreen help dialog |

---

## Screen 2: Configuration (`config.html`)

**URL**: `/config.html`
**Entry Point**: No (reached from main screen sidebar)
**Module**: [js/config.js](../../js/config.js)

### Purpose

Settings management for shortcut button labels and time rounding unit.

### Screen States

| State | Description | Trigger |
|-------|-------------|---------|
| **Initial Load** | Inputs populated from localStorage | `DOMContentLoaded` |
| **Editing** | User types in input field | User input |
| **Auto-saved** | Change immediately persisted | `change` event on input/select |
| **Quota Error** | Alert shown for storage full | `QuotaExceededError` |

### Navigation Flows

```
config.html
    └── [Back/Home link in sidebar] → index.html
```

### Early i18n Initialization

Unlike `index.html`, `config.html` runs `Multilingualization.init()` synchronously in `<head>` to prevent translation flicker:

```html
<script type="module">
  import Multilingualization from '/js/lib/multilingualization.js';
  Multilingualization.init();
</script>
```

### Key DOM Elements

| Selector | Role |
|----------|------|
| `select` | Rounding unit dropdown (1/5/10/15/30/60 min) |
| `input[data-translate^="shortcut_"]` | Shortcut text inputs (1-9) |
| `#version_number` | Displays app version |

---

## Screen 3: Formatted Log Viewer (Generated)

**URL**: `javascript:` blob opened in new tab
**Module**: [js/lib/download.js](../../js/lib/download.js)
**Entry Point**: No (generated dynamically)

### Purpose

Read-only display of parsed log data in three formats with copy-to-clipboard functionality.

### How It Is Generated

```javascript
// main.js
const log = localStorage.getItem(LOG_DATA_KEY);
const outputStr = generateFormattedLog(log, mins);
const tab = window.open('', '_blank');
tab.document.write(outputStr);
tab.document.title = Multilingualization.translate('log_viewer');
```

### Content Sections

| Section ID | Format | Description |
|-----------|--------|-------------|
| `html_summary` | HTML table | Work time summary with category breakdown |
| `plaintext_log` | Plain text (`<pre>`) | Raw log entries |
| `markdown_summary` | Markdown in `<pre>` | Table format for documentation |

Each section includes a **copy button** (Font Awesome icon) with clipboard-write permission check and tooltip feedback.

### External Dependencies (in generated HTML)

- Bootstrap 5.3.0 CSS (CDN) — for table styling
- Font Awesome 6.4.0 (CDN) — for copy button icons

---

## Screen-to-Screen Navigation Map

```
[PWA Launch / Browser Open]
        ↓
  index.html ←────────────────────────────┐
        │                                  │
        ├─[Sidebar: Configure]──→ config.html
        │                                  │
        ├─[Sidebar: View Log]──→ New Tab (generated HTML)
        │
        └─[Sidebar: Download]──→ File Download (.html)
```

---

## Responsive Behavior

Both screens use Bootstrap 5.3.0's responsive grid:

| Breakpoint | Shortcut Layout | Sidebar |
|-----------|----------------|---------|
| `< 768px` (mobile) | Single column (keys 1-9 stacked) | Full-width offcanvas |
| `≥ 768px` (tablet+) | Two columns (1-5 left, 6-9+0 right) | Same offcanvas |

---

<!-- commit: ef46e13 -->
