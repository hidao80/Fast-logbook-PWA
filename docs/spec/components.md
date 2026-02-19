# UI Components & Page Structure

## Page Architecture

### Main Application Page (index.html)

File: [index.html](index.html)

The main page consists of several key UI components organized hierarchically.

#### Document Structure

```html
<!DOCTYPE html>
<html data-bs-theme="auto">
  <head>
    <!-- Meta tags, PWA manifest, Bootstrap CSS, custom CSS -->
    <script src="/js/main.js" type="module"></script>
    <script type="speculationrules">...</script>
  </head>
  <body class="dc6a3b0594269eefaeb">
    <!-- Navigation bar -->
    <!-- Offcanvas sidebar menu -->
    <!-- Shortcut keys and log output area -->
    <!-- Modals (delete confirmation, help) -->
  </body>
</html>
```

#### Head Section Features

1. **Meta Tags** ([index.html:5-7](index.html#L5-L7)):
   - Charset: UTF-8
   - Viewport: Responsive mobile settings
   - IE compatibility mode

2. **PWA Configuration** ([index.html:9-18](index.html#L9-L18)):
   - Favicon link
   - Web app manifest
   - Open Graph meta tags for social sharing

3. **External Dependencies** ([index.html:20-21](index.html#L20-L21)):
   - Bootstrap 5.3.0 CSS from CDN
   - Bootstrap Icons 1.11.1

4. **Speculation Rules API** ([index.html:27-32](index.html#L27-L32)):
   - Prerender and prefetch rules for performance
   - Moderate eagerness for `/*` paths

### Configuration Page (config.html)

File: [config.html](config.html)

Simpler structure focused on settings management.

#### Key Features

1. **Early i18n Initialization** ([config.html:14-17](config.html#L14-L17)):
   ```html
   <script type="module">
     import Multilingualization from '/js/lib/multilingualization.js';
     Multilingualization.init();
   </script>
   ```
   Prevents translation flicker by running before DOM construction

2. **Settings Form**: Select dropdown and text inputs for configuration
3. **Navigation**: Offcanvas sidebar with back link to main page

## Component Breakdown

### 1. Navigation Bar

**Location**: [index.html:36-51](index.html#L36-L51)

```html
<nav class="navbar navbar-dark bg-dark navbar-overlay">
  <div class="container-fluid">
    <button class="navbar-toggler">...</button>
    <span class="navbar-save-status saved">●</span>
    <a class="navbar-brand" href="#">...</a>
    <a id="help_button" class="btn btn-link">...</a>
  </div>
</nav>
```

**Components**:
- **Toggler Button**: Opens offcanvas sidebar menu
- **Save Status Indicator**: Visual feedback (● symbol)
  - Class `saved`: Green indicator
  - Without `saved`: Red indicator (dirty state)
- **Brand/Title**: App name with i18n support
- **Help Button**: Opens help modal

**Behavior** ([js/main.js:191-205](js/main.js#L191-L205)):
- Click toggler to save logs and toggle sidebar
- Save status updates on textarea input/save events

### 2. Offcanvas Sidebar Menu

**Location**: [index.html:53-72](index.html#L53-L72)

```html
<div class="offcanvas offcanvas-start" id="sideMenu">
  <div class="offcanvas-header">
    <h5 class="offcanvas-title">...</h5>
    <button class="btn-close">...</button>
  </div>
  <div class="offcanvas-body">
    <a id="view_formatted_log">View formatted log</a>
    <a id="download_formatted_log">Download formatted log</a>
    <a id="configure" href="config.html">Configure</a>
    <a id="delete_log">Delete log</a>
    <span id="version_label">ver. <span id="version_number"></span></span>
    <a id="install_pwa" class="d-none">Install PWA</a>
  </div>
</div>
```

**Menu Actions**:

1. **View Formatted Log** ([js/main.js:215-227](js/main.js#L215-L227)):
   - Opens new tab with formatted log (HTML table)
   - Uses `generateFormattedLog()` to create output
   - Tab name: Translated "log_viewer"

2. **Download Formatted Log** ([js/main.js:230-232](js/main.js#L230-L232)):
   - Triggers file download
   - Filename: `Fast logbook PWA_YYYY-MM-DD.html`
   - Contains HTML, plaintext, and Markdown formats

3. **Configure** ([index.html:65-66](index.html#L65-L66)):
   - Navigation link to [config.html](config.html)
   - Styled as success button (green)

4. **Delete Log** ([js/main.js:235-264](js/main.js#L235-L264)):
   - Opens confirmation modal
   - On confirm: Clears textarea and saves
   - Closes sidebar and refocuses textarea

5. **Version Display** ([js/main.js:67-71](js/main.js#L67-L71)):
   - Fetches version from [manifest.json](manifest.json)
   - Displays in sidebar footer

6. **Install PWA** ([js/lib/utils.js:111-130](js/lib/utils.js#L111-L130)):
   - Initially hidden (`d-none`)
   - Shows when `beforeinstallprompt` event fires
   - Triggers PWA installation prompt

### 3. Shortcut Keys Area

**Location**: [index.html:76-123](index.html#L76-L123)

Two-column grid of shortcut buttons (keys 1-9) plus free-form input (key 0).

```html
<div class="container-fluid shortcut-area">
  <div class="row">
    <div class="col-12 col-md-6">
      <div class="input-group input-group-sm pt-2">
        <span class="input-group-text">1</span>
        <label class="form-control" data-translate="shortcut_1" data-shortcut-key="1"></label>
      </div>
      <!-- Keys 2-5 -->
    </div>
    <div class="col-12 col-md-6">
      <!-- Keys 6-9 -->
      <div class="input-group input-group-sm pt-2">
        <span class="input-group-text">0</span>
        <input type="text" class="form-control" placeholder="">
      </div>
    </div>
  </div>
</div>
```

**Layout**:
- Mobile (< 768px): Single column, stacked
- Desktop (≥ 768px): Two columns side-by-side
- Keys 1-5 in left column
- Keys 6-9 + custom input (0) in right column

**Initialization** ([js/main.js:74-89](js/main.js#L74-L89)):
```javascript
for (const node of $$all('label[data-shortcut-key]')) {
  const key = 'shortcut_' + node.dataset.shortcutKey;
  const str = localStorage.getItem(key);
  if (str && str !== 'undefined') {
    node.textContent = str;
  } else {
    node.textContent = Multilingualization.translate(node.dataset.translate);
  }

  node.addEventListener('click', async e => {
    if (!e.target.textContent) return;
    await appendLog(appendTime(e.target.textContent));
    await saveLogs();
  });
}
```

**Click Behavior**:
1. Prevent click if label is empty
2. Append timestamp to label text
3. Add to log textarea
4. Save to localStorage

**Keyboard Shortcuts** ([js/main.js:96-115](js/main.js#L96-L115)):
```javascript
document.body.addEventListener('keydown', async (e) => {
  if (document.activeElement.value) return; // Skip if input has focus

  const matches = e.code.match(/Digit(\d)/);
  if (matches?.length == 2) {
    const inputDigit = matches[1];
    if (inputDigit == '0') {
      // Focus custom input
      e.preventDefault();
      $$one('input').focus();
      $$one('input').value = '';
    } else {
      // Stamp preset tag
      const node = $$one(`label[data-shortcut-key='${inputDigit}']`);
      await appendLog(appendTime(node.textContent));
    }
  }
});
```

**Key 0 Behavior** ([js/main.js:139-148](js/main.js#L139-L148)):
- **PC**: Press Enter to confirm (keydown event with explicit Enter key check, ignore IME composition)
- **Android**: Confirm on blur event
- Calls `processInput()` to append timestamped log and clear input

### 4. Log Textarea

**Location**: [index.html:125-128](index.html#L125-L128)

```html
<div class="textarea-container pt-2">
  <textarea class="form-control" placeholder=""></textarea>
</div>
```

**Features**:

1. **Auto-scroll** ([js/main.js:19](js/main.js#L19), [js/main.js:35](js/main.js#L35)):
   ```javascript
   textarea.scrollTo(0, textarea.scrollHeight);
   ```
   Automatically scrolls to bottom when log is appended or loaded

2. **Placeholder** ([js/main.js:93](js/main.js#L93)):
   - Dynamically set with i18n translation
   - English: "Work logs will be output here. Editable"

3. **Event Listeners**:

   **Input Event** ([js/main.js:162-175](js/main.js#L162-L175)):
   ```javascript
   $$one('textarea').addEventListener('input', async e => {
     // Set dirty state when IME conversion is confirmed
     if (e.isComposing && e.inputType === 'insertCompositionText') {
       $$one('.navbar-save-status').classList.remove('saved');
     } else if (e.inputType !== 'insertLineBreak') {
       $$one('.navbar-save-status').classList.remove('saved');
     }

     // 300ms debounce
     clearTimeout(debounceTimeout);
     debounceTimeout = setTimeout(async () => {
       await saveLogs();
     }, 300);
   });
   ```
   - Updates save status indicator
   - Debounces save operations (300ms)
   - Ignores line breaks for dirty state

   **Composition End** ([js/main.js:178-181](js/main.js#L178-L181)):
   ```javascript
   $$one('textarea').addEventListener('compositionend', async function () {
     clearTimeout(debounceTimeout);
     await saveLogs();
   });
   ```
   - Immediate save when IME composition finishes

   **Blur Event** ([js/main.js:184-188](js/main.js#L184-L188)):
   ```javascript
   [$$one('input'), window].forEach((node) => {
     node.addEventListener('blur', async function () {
       await saveLogs();
     });
   });
   ```
   - Save when focus leaves input or window

   **Storage Sync** ([js/main.js:208-212](js/main.js#L208-L212)):
   ```javascript
   window.addEventListener('storage', (event) => {
     if (event.key === LOG_DATA_KEY) {
       $$one('textarea').value = event.newValue;
     }
   });
   ```
   - Synchronize textarea content across browser tabs

### 5. Delete Confirmation Modal

**Location**: [index.html:131-149](index.html#L131-L149)

```html
<div class="modal fade" id="deleteConfirmModal">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" data-translate="delete_log_confirm_title"></h5>
        <button class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body" data-translate="delete_log_confirm_message"></div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-bs-dismiss="modal" data-translate="cancel"></button>
        <button class="btn btn-danger" id="confirmDeleteButton" data-translate="delete"></button>
      </div>
    </div>
  </div>
</div>
```

**Behavior**:
- Shown when "Delete log" menu item clicked
- Cancel button: Dismiss modal
- Delete button: Clear logs, close modal, close sidebar, refocus textarea

### 6. Help Modal

**Location**: [index.html:152-367](index.html#L152-L367)

Full-screen modal with tabbed content.

```html
<div class="modal fade" id="helpModal">
  <div class="modal-dialog modal-fullscreen">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" data-translate="help_title"></h5>
        <button class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <nav>
          <div class="nav nav-tabs">
            <button class="nav-link active" id="nav-home-tab" data-bs-toggle="tab"
                    data-bs-target="#nav-home" data-translate="help_tab_main_screeen"></button>
            <button class="nav-link" id="nav-config-tab" data-bs-toggle="tab"
                    data-bs-target="#nav-config" data-translate="help_tab_config_screen"></button>
          </div>
        </nav>
        <div class="tab-content">
          <!-- Main screen help -->
          <!-- Config screen help -->
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" data-bs-dismiss="modal" data-translate="help_close_button"></button>
      </div>
    </div>
  </div>
</div>
```

**Tabs**:

1. **Main Screen Help** (default active):
   - Overview
   - Basic operations
   - Shortcut settings
   - Example summary formats (6 code examples)
   - Delete log instructions
   - Offline features
   - Version info

2. **Config Screen Help**:
   - Customizable behavior overview
   - Time rounding unit settings
   - Shortcut configuration
   - Auto-save information

**Content Structure**:
- Sections with `<h2>` and `<h3>` headings
- Ordered/unordered lists
- Code examples in `<pre><code>` blocks
- Alert boxes with `alert-info` class
- All text uses `data-translate` for i18n

## Component Styling

### CSS Organization

1. **[css/main.css](css/main.css)**: Main page specific styles
   - Navbar overlay positioning
   - Textarea container layout
   - Shortcut area grid
   - Save status indicator colors

2. **[css/config.css](css/config.css)**: Config page specific styles
   - Form layout adjustments
   - Input group spacing

3. **Bootstrap 5.3.0**: Base framework
   - Grid system (responsive columns)
   - Navbar and offcanvas components
   - Modal dialogs
   - Form controls and input groups
   - Button styles
   - Typography and spacing utilities

### Responsive Design

**Breakpoints** (Bootstrap defaults):
- `xs` (< 576px): Mobile portrait
- `sm` (≥ 576px): Mobile landscape
- `md` (≥ 768px): Tablets
- `lg` (≥ 992px): Desktops
- `xl` (≥ 1200px): Large desktops

**Layout Adaptations**:
- Shortcut buttons: 1 column on mobile, 2 columns on tablet+
- Help modal: Full-screen on all devices
- Offcanvas menu: Slide from left edge

### Theme Support

**Auto Dark Mode** ([index.html:2](index.html#L2)):
```html
<html data-bs-theme="auto">
```

Implemented via [js/lib/utils.js:135-142](js/lib/utils.js#L135-L142):
- Detects `prefers-color-scheme` media query
- Sets `data-bs-theme="dark"` or `"light"` accordingly
- Bootstrap automatically applies theme styles

## JavaScript Module Integration

### Main Application Logic

File: [js/main.js](js/main.js)

**Imports**:
```javascript
import { initAnalytics } from './lib/analytics.js';
import { downloadLog, generateFormattedLog } from './lib/download.js';
import { $$all, $$disableConsole, $$one } from './lib/indolence.min.js';
import Multilingualization from './lib/multilingualization.js';
import {
  appendTime, autoSetTheme, installPWA,
  LOG_DATA_KEY, ROUNDING_UNIT_MINUTE_KEY, trimNewLine,
} from './lib/utils.js';
/* global bootstrap */
```

**Initialization Sequence** ([js/main.js:58-276](js/main.js#L58-L276)):
1. Disable console (production)
2. Set theme
3. Translate all UI text
4. Fetch and display version
5. Initialize shortcut buttons
6. Set input placeholders
7. Attach event listeners (keyboard, input, blur, storage)
8. Register service worker
9. Load saved logs
10. Initialize PWA install button

### Configuration Page Logic

File: [js/config.js](js/config.js)

**Imports**:
```javascript
import { getRoundingUnit, ROUNDING_UNIT_MINUTE_KEY, autoSetTheme } from './lib/utils.js';
import Multilingualization from './lib/multilingualization.js';
import { $$one, $$all } from './lib/indolence.min.js';
```

**Initialization Sequence** ([js/config.js:8-54](js/config.js#L8-L54)):
1. Set theme
2. Fetch and display version
3. Initialize shortcut input values from localStorage
4. Attach change event listeners for auto-save
5. Initialize rounding unit dropdown
6. Set up cross-tab synchronization

## Accessibility Considerations

### ARIA Attributes

1. **Navigation** ([index.html:38-39](index.html#L38-L39)):
   ```html
   <button class="navbar-toggler" aria-controls="sideMenu"
           aria-expanded="false" aria-label="Open menu">
   ```

2. **Modals** ([index.html:132](index.html#L132)):
   ```html
   <div class="modal fade" id="deleteConfirmModal"
        aria-labelledby="deleteConfirmModalLabel" aria-hidden="true">
   ```

3. **Tabs** ([index.html:166-170](index.html#L166-L170)):
   ```html
   <button class="nav-link active" role="tab"
           aria-controls="nav-home" aria-selected="true">
   ```

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Modal dialogs trap focus
- Tab navigation follows logical order
- Digit keys (0-9) provide shortcut access

### Screen Reader Support

- Semantic HTML elements (`<nav>`, `<button>`, `<label>`)
- Alt text for icons (Bootstrap Icons use aria-hidden)
- Modal titles and descriptions properly associated
- Button labels translated for locale

## Performance Optimizations

### Loading Strategy

1. **Module Scripts**: Deferred execution with `type="module"`
2. **CDN Resources**: Bootstrap loaded from fast CDN
3. **Service Worker**: Caches all assets for instant repeat loads
4. **Speculation Rules**: Prerender/prefetch for faster navigation

### Rendering Optimizations

1. **Debounced Saves**: 300ms delay prevents excessive DOM updates
2. **Event Delegation**: Where appropriate (e.g., shortcut buttons)
3. **Minimal Reflows**: Auto-scroll only when necessary
4. **CSS Containment**: Isolated component styling

### Memory Management

1. **Event Listener Cleanup**: Modals auto-cleanup on close
2. **URL Object Revocation**: Download URLs revoked after use ([js/lib/download.js:44](js/lib/download.js#L44))
3. **Debounce Timeout Clearing**: Prevents timeout accumulation

## Component Dependencies

### External Libraries

1. **Bootstrap 5.3.0**:
   - CSS framework
   - JavaScript for modals, offcanvas, tooltips
   - Loaded from CDN

2. **Bootstrap Icons 1.11.1**:
   - Icon font
   - Used for help button, copy buttons
   - Loaded from CDN

### Internal Modules

1. **analytics.js**: Google Analytics GA4 event tracking (`initAnalytics`)
2. **indolence.min.js**: DOM utility functions (`$$one`, `$$all`)
3. **utils.js**: Date/time, localStorage, theme utilities
4. **multilingualization.js**: i18n translation system
5. **download.js**: Log formatting and export

**Dependency Graph**:
```
index.html
├── main.js
│   ├── analytics.js
│   ├── indolence.min.js
│   ├── utils.js
│   ├── multilingualization.js
│   ├── download.js
│   │   ├── utils.js
│   │   └── multilingualization.js
│   └── bootstrap (CDN, global via gtag)
└── CSS
    ├── main.css
    └── bootstrap (CDN)
```

## Browser API Usage

### Storage API
- `localStorage` for data persistence
- `storage` event for cross-tab sync

### Service Worker API
- Registration in [js/main.js:267-269](js/main.js#L267-L269)
- Cache management in [sw.js](sw.js)

### Clipboard API (in formatted log viewer)
- Used in generated HTML for copy buttons
- Feature detection before enabling

### Media Query API
- `window.matchMedia('(prefers-color-scheme: dark)')` for theme detection

### Custom Events
- `startDownload` event for triggering file downloads ([js/lib/download.js:26-27](js/lib/download.js#L26-L27))

### beforeinstallprompt
- PWA installation prompt handling ([js/lib/utils.js:113-118](js/lib/utils.js#L113-L118))

<!-- commit: ef46e13 -->
