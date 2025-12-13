# Configuration System

## Overview

Fast Logbook PWA uses browser `localStorage` for configuration persistence. All settings are stored client-side and synchronized across browser tabs using the Storage API.

## Configuration Storage

### localStorage Keys

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `log` | string | `''` | Raw time-stamped log entries (newline-separated) |
| `rounding_mins` | number | `1` | Time rounding unit in minutes |
| `shortcut_1` to `shortcut_9` | string | i18n default | User-defined shortcut button texts |

### Storage Constants

Defined in [js/lib/utils.js:1-2](js/lib/utils.js#L1-L2):

```javascript
export const LOG_DATA_KEY = 'log';
export const ROUNDING_UNIT_MINUTE_KEY = 'rounding_mins';
```

## Configuration UI

### Config Page Structure

File: [config.html](config.html)

The configuration page provides:
1. **Rounding Unit Selector**: Dropdown to select time rounding precision
2. **Shortcut Items**: 9 text inputs for customizing shortcut button labels
3. **Version Display**: Shows current app version from manifest.json
4. **Back Navigation**: Link to return to main application

### Rounding Unit Options

Available values (defined in `<select>` dropdown):
- 1 minute
- 5 minutes
- 10 minutes
- 15 minutes
- 30 minutes
- 60 minutes

These values affect how work time is rounded during summary calculation.

### Default Shortcut Values

Defined in [js/lib/multilingualization.js:80-88](js/lib/multilingualization.js#L80-L88) (English):

```javascript
'shortcut_1': '@work +PromotionalExams;Study',
'shortcut_2': '@wrivate +housework;Cleaning',
'shortcut_3': '@work +PromotionalExams;Research',
'shortcut_4': '@work +PromotionalExams;Report',
'shortcut_5': '@work +PromotionalExams;Presentation',
'shortcut_6': '',
'shortcut_7': '',
'shortcut_8': '',
'shortcut_9': '',
```

## Configuration Logic

### Initialization

Implemented in [js/config.js:8-43](js/config.js#L8-L43):

1. **Theme Setup**: Automatically detect and apply dark/light theme
2. **Version Display**: Fetch version from manifest.json
3. **Shortcut Initialization**:
   - Load saved values from localStorage
   - Fall back to i18n defaults if not set
   - Attach change event listeners for auto-save
4. **Rounding Unit Initialization**:
   - Load saved value from localStorage
   - Validate and apply default if invalid

### Auto-save Behavior

**Shortcut Inputs** ([js/config.js:25-33](js/config.js#L25-L33)):
- Trigger: `change` event (when input loses focus or value changes)
- Action: Save trimmed value to localStorage with key `data-translate` attribute
- Error Handling: Alert user if `QuotaExceededError` occurs

**Rounding Unit** ([js/config.js:41-43](js/config.js#L41-L43)):
- Trigger: `change` event on `<select>` dropdown
- Action: Save value to localStorage with key `ROUNDING_UNIT_MINUTE_KEY`

### Cross-tab Synchronization

Implemented in [js/config.js:46-53](js/config.js#L46-L53):

```javascript
window.addEventListener('storage', (event) => {
  if (event.storageArea === localStorage) {
    const target = event.key === ROUNDING_UNIT_MINUTE_KEY
      ? $$one('select')
      : $$one(`[data-translate='${event.key}']`);
    if (target) {
      target.value = event.newValue;
    }
  }
});
```

When configuration changes in another tab:
- Detect changes via `storage` event
- Update corresponding UI element with new value
- Maintains consistency across all open tabs

## Validation Functions

### getRoundingUnit()

Defined in [js/lib/utils.js:55-67](js/lib/utils.js#L55-L67):

```javascript
export function getRoundingUnit(value) {
  let mins = 1;
  switch (Number(value)) {
    case 1:
    case 5:
    case 10:
    case 15:
    case 30:
    case 60:
      mins = Number(value);
  }
  return mins;
}
```

**Purpose**: Validates rounding unit value
**Input**: Any value (number, string, NaN)
**Output**: Valid rounding unit (1, 5, 10, 15, 30, or 60)
**Default**: Returns 1 if input is invalid

## Error Handling

### Storage Quota Exceeded

When localStorage quota is exceeded (typically 5-10MB):

```javascript
try {
  localStorage.setItem(key, value);
} catch (e) {
  if (e.name === 'QuotaExceededError') {
    alert('ストレージ容量が不足しています'); // Japanese: "Storage capacity is insufficient"
  }
}
```

**Location**:
- [js/config.js:29-31](js/config.js#L29-L31)
- [js/main.js:48-51](js/main.js#L48-L51)

**User Impact**: Alert displayed, data not saved
**Recovery**: User must clear old logs or browser data

## Configuration Usage in Main App

### Loading Shortcuts

Implemented in [js/main.js:74-82](js/main.js#L74-L82):

```javascript
for (const node of $$all('label[data-shortcut-key]')) {
  const key = 'shortcut_' + node.dataset.shortcutKey;
  const str = localStorage.getItem(key);
  if (str && str !== 'undefined') {
    node.textContent = str;
  } else {
    node.textContent = Multilingualization.translate(node.dataset.translate);
  }
  // ... event listener attachment
}
```

### Loading Rounding Unit

Used in log formatting ([js/main.js:217-222](js/main.js#L217-L222)):

```javascript
let mins = localStorage.getItem(ROUNDING_UNIT_MINUTE_KEY);
if (!mins) {
  // Set default value to 1 if not set
  mins = 1;
  localStorage.setItem(ROUNDING_UNIT_MINUTE_KEY, mins);
}
const outputStr = generateFormattedLog(log, mins);
```

## Multilingual Support

### Language Detection

Implemented in [js/lib/multilingualization.js](js/lib/multilingualization.js):

```javascript
static language() {
  const browserLang = navigator.language || navigator.userLanguage;
  return browserLang?.startsWith('ja') ? 'ja' : 'en';
}
```

**Supported Languages**:
- Japanese (`ja`)
- English (`en`, default)

### Translation System

**Early Translation Prevention** ([config.html:14-17](config.html#L14-L17)):

```html
<script type="module">
  import Multilingualization from '/js/lib/multilingualization.js';
  Multilingualization.init();
</script>
```

This script runs synchronously in `<head>` to prevent translation flicker by:
1. Setting up global translation function `window.__i18n_t`
2. Creating MutationObserver to translate elements as they're added to DOM
3. Translating existing `[data-translate]` elements on DOMContentLoaded

### Configuration Text Translation

All UI text is marked with `data-translate` attribute:
- Dropdown option labels
- Input placeholders
- Help text
- Button labels

Example:
```html
<option value="1" data-translate="1min" selected></option>
<input type="text" class="form-control" data-translate="shortcut_1">
```

## Theme Configuration

### Auto-theme Detection

Implemented in [js/lib/utils.js:135-142](js/lib/utils.js#L135-L142):

```javascript
export function autoSetTheme() {
  const theme = document.documentElement.getAttribute('data-bs-theme') ?? 'light';
  if (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-bs-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-bs-theme', theme);
  }
}
```

**Behavior**:
- Reads `data-bs-theme` attribute from `<html>` element
- If set to `auto`, detects system preference via media query
- Sets Bootstrap theme to `dark` or `light` accordingly
- Called on both main and config pages during initialization

## Best Practices

### Data Integrity
1. Always validate values before applying (e.g., `getRoundingUnit()`)
2. Handle `undefined` and `'undefined'` string cases
3. Trim user input before saving
4. Provide fallback to i18n defaults

### Performance
1. Use event delegation where possible
2. Debounce localStorage writes (300ms in main app)
3. Only update UI when values actually change

### User Experience
1. Auto-save on blur/change (no manual save button needed)
2. Cross-tab synchronization for consistency
3. Visual feedback for save status (in main app)
4. Graceful degradation if localStorage unavailable

## Migration & Versioning

Currently, there is no configuration migration logic. The app relies on:
1. Backward-compatible localStorage keys
2. Validation functions that provide safe defaults
3. Version displayed to user but not used for data migration

**Future Consideration**: Add version-based migration if localStorage schema changes.
