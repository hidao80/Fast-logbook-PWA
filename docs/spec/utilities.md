# Utility Functions & Libraries

## Module Overview

The application uses five core utility modules located in [js/lib/](js/lib/):

1. **analytics.js**: Google Analytics GA4 event tracking
2. **utils.js**: Date/time, localStorage constants, PWA installation, theme management
3. **download.js**: Log parsing, formatting, and export functionality
4. **multilingualization.js**: Internationalization (i18n) system
5. **indolence.min.js**: Minimized DOM utility functions

---

## 0. analytics.js

File: [js/lib/analytics.js](js/lib/analytics.js)

### initAnalytics()
**Location**: [js/lib/analytics.js:2-65](js/lib/analytics.js#L2-L65)

```javascript
export function initAnalytics()
```

**Purpose**: Registers GA4 event tracking listeners for key user interactions.

**Behavior**:
- Wraps `gtag()` calls in `sendGAEvent()` (no-op if `gtag` is undefined)
- Attaches click listeners to menu items and the help button
- Listens to `appinstalled` on `window` for PWA install events

**Tracked Events**:

| Event Name | Trigger | Category |
|---|---|---|
| `view_formatted_log` | Click `#view_formatted_log` | engagement |
| `configure` | Click `#configure` | engagement |
| `help` | Click `#help_button` | engagement |
| `export_log` | Click `#download_formatted_log` | engagement |
| `pwa_install` | `window appinstalled` | engagement |

**Usage**: Called in [js/main.js](js/main.js) during DOMContentLoaded initialization.

**Note**: `gtag` is expected as a global variable loaded via Google Analytics script tag in `index.html`.

---

## 1. utils.js

File: [js/lib/utils.js](js/lib/utils.js)

### Constants

#### LOG_DATA_KEY
```javascript
export const LOG_DATA_KEY = 'log';
```
**Purpose**: localStorage key for raw log data
**Usage**: Throughout app for reading/writing log entries

#### ROUNDING_UNIT_MINUTE_KEY
```javascript
export const ROUNDING_UNIT_MINUTE_KEY = 'rounding_mins';
```
**Purpose**: localStorage key for time rounding configuration
**Valid Values**: 1, 5, 10, 15, 30, 60

---

### Date/Time Functions

#### getTodayString()
**Location**: [js/lib/utils.js:10-16](js/lib/utils.js#L10-L16)

```javascript
export function getTodayString()
```

**Returns**: `string` - Current date in `YYYY-MM-DD` format

**Example**:
```javascript
getTodayString() // → '2023-05-01'
```

**Implementation**:
- Gets current date via `new Date()`
- Pads year to 4 digits, month and day to 2 digits
- Uses zero-based month index (adds 1)

---

#### fetchHourFromTime()
**Location**: [js/lib/utils.js:27-31](js/lib/utils.js#L27-L31)

```javascript
export function fetchHourFromTime(time = null, isInt = true)
```

**Parameters**:
- `time` (string|null): Date-time string in 'YYYY-MM-DD HH:MM:SS' format (default: current time)
- `isInt` (boolean): Return as integer or zero-padded string (default: true)

**Returns**: `number|string` - Hour value (0-23)

**Examples**:
```javascript
fetchHourFromTime('2021-01-01 09:04:56')        // → 9
fetchHourFromTime('2021-01-01 09:04:56', false) // → '09'
fetchHourFromTime()                             // → 9 (current hour)
```

---

#### fetchMinFromTime()
**Location**: [js/lib/utils.js:42-46](js/lib/utils.js#L42-L46)

```javascript
export function fetchMinFromTime(time = null, isInt = true)
```

**Parameters**:
- `time` (string|null): Date-time string in 'YYYY-MM-DD HH:MM:SS' format (default: current time)
- `isInt` (boolean): Return as integer or zero-padded string (default: true)

**Returns**: `number|string` - Minute value (0-59)

**Examples**:
```javascript
fetchMinFromTime('2021-01-01 12:04:56')        // → 4
fetchMinFromTime('2021-01-01 12:34:56', false) // → '34'
fetchMinFromTime()                             // → 4 (current minute)
```

---

#### appendTime()
**Location**: [js/lib/utils.js:76-81](js/lib/utils.js#L76-L81)

```javascript
export function appendTime(tag)
```

**Parameters**:
- `tag` (string): Work category or description text

**Returns**: `string` - Formatted log entry with timestamp

**Format**: `YYYY-MM-DD HH:MMtag`

**Example**:
```javascript
appendTime('Project A;Meeting')
// → '2023-01-01 00:00Project A;Meeting'
```

**Usage**: Called when user clicks shortcut button or enters custom text

---

### Validation Functions

#### getRoundingUnit()
**Location**: [js/lib/utils.js:55-67](js/lib/utils.js#L55-L67)

```javascript
export function getRoundingUnit(value)
```

**Parameters**:
- `value` (number|string|NaN): User input or localStorage value

**Returns**: `number` - Valid rounding unit (1, 5, 10, 15, 30, or 60)

**Default**: Returns `1` if input is invalid

**Example**:
```javascript
getRoundingUnit(20)   // → 1 (invalid, defaults to 1)
getRoundingUnit('15') // → 15 (valid)
getRoundingUnit(NaN)  // → 1 (invalid, defaults to 1)
```

**Implementation**: Switch statement with enumerated valid values

---

### String Manipulation

#### trimNewLine()
**Location**: [js/lib/utils.js:89-91](js/lib/utils.js#L89-L91)

```javascript
export function trimNewLine(text)
```

**Parameters**:
- `text` (string): Raw log data or user input

**Returns**: `string` - Cleaned text

**Behavior**:
- Replaces multiple consecutive newlines with single newline
- Removes leading and trailing newlines

**Examples**:
```javascript
trimNewLine('aa\nbb\ncc\n')      // → 'aa\nbb\ncc'
trimNewLine('aa\n\n\nbb')        // → 'aa\nbb'
trimNewLine('\naa\nbb\n')        // → 'aa\nbb'
```

**Usage**: Called before saving logs to localStorage

---

#### escapeHtml()
**Location**: [js/lib/utils.js:98-105](js/lib/utils.js#L98-L105)

```javascript
export function escapeHtml(unsafe)
```

**Parameters**:
- `unsafe` (string): Potentially dangerous HTML content

**Returns**: `string` - HTML-escaped string

**Escapes**:
- `&` → `&amp;`
- `<` → `&lt;`
- `>` → `&gt;`
- `"` → `&quot;`
- `'` → `&#039;`

**Usage**: Sanitizes user input before rendering in HTML table output

---

### PWA Functions

#### installPWA()
**Location**: [js/lib/utils.js:111-130](js/lib/utils.js#L111-L130)

```javascript
export function installPWA(elem)
```

**Parameters**:
- `elem` (HTMLElement): Install button element

**Behavior**:
1. Listens for `beforeinstallprompt` event
2. Stores prompt event on element
3. Shows install button (removes `d-none` class)
4. On click, triggers install prompt
5. Hides button after user choice

**Event Handling**:
```javascript
window.addEventListener('beforeinstallprompt', function (event) {
  event.preventDefault();
  elem.promptEvent = event;
  elem.classList.remove('d-none');
  return false;
});

elem.addEventListener('click', () => {
  if (elem.promptEvent) {
    elem.promptEvent.prompt();
    elem.promptEvent.userChoice.then(function () {
      elem.classList.add('d-none');
      elem.promptEvent = null;
    });
  }
});
```

**Usage**: Called in [js/main.js:275](js/main.js#L275) with `#install_pwa` element

---

### Theme Management

#### autoSetTheme()
**Location**: [js/lib/utils.js:135-142](js/lib/utils.js#L135-L142)

```javascript
export function autoSetTheme()
```

**Purpose**: Applies dark/light theme based on system preference

**Behavior**:
1. Reads `data-bs-theme` attribute from `<html>` element
2. If set to `'auto'`, checks system preference via media query
3. Sets `data-bs-theme` to `'dark'` or `'light'` accordingly
4. Defaults to `'light'` if attribute not set

**Implementation**:
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

**Media Query**: `(prefers-color-scheme: dark)`

**Usage**: Called in both [js/main.js:62](js/main.js#L62) and [js/config.js:10](js/config.js#L10)

---

## 2. download.js

File: [js/lib/download.js](js/lib/download.js)

### Constants

```javascript
const HTML_SUMMARY = 'html_summary';
const PLAINTEXT_LOG = 'plaintext_log';
const MARKDOWN_SUMMARY = 'markdown_summary';
```

**Purpose**: Section identifiers for formatted log output

---

### Export Functions

#### download()
**Location**: [js/lib/download.js:16-28](js/lib/download.js#L16-L28)

```javascript
export function download(outputDataString, extension = 'html', mimeType = 'text/html')
```

**Parameters**:
- `outputDataString` (string): Content to download
- `extension` (string): File extension (default: 'html')
- `mimeType` (string): MIME type (default: 'text/html')

**Behavior**:
1. Creates Blob from data string
2. Generates object URL
3. Creates filename: `App Name_YYYY-MM-DD.extension`
4. Stores URL and filename in localStorage
5. Dispatches `startDownload` custom event

**Rationale**: Indirect download via event allows cross-context triggering

---

#### Download Event Listener
**Location**: [js/lib/download.js:31-50](js/lib/download.js#L31-L50)

```javascript
window.addEventListener('startDownload', () => {
  const url = localStorage.getItem('downloadUrl');
  const filename = localStorage.getItem('downloadFilename');

  if (url && filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url); // Release memory

    localStorage.removeItem('downloadUrl');
    localStorage.removeItem('downloadFilename');
  }
});
```

**Memory Management**: Revokes object URL after download to prevent memory leaks

---

#### downloadLog()
**Location**: [js/lib/download.js:89-94](js/lib/download.js#L89-L94)

```javascript
export async function downloadLog()
```

**Behavior**:
1. Retrieves log data from localStorage
2. Gets rounding unit preference
3. Generates formatted HTML
4. Triggers download

**Usage**: Bound to "Download formatted log" menu item ([js/main.js:230](js/main.js#L230))

---

### Formatting Functions

#### generateFormattedLog()
**Location**: [js/lib/download.js:59-87](js/lib/download.js#L59-L87)

```javascript
export function generateFormattedLog(log, mins)
```

**Parameters**:
- `log` (string): Raw newline-separated log entries
- `mins` (number): Rounding unit for time calculation

**Returns**: `string` - Complete HTML document

**Sections Generated**:
1. **HTML Summary**: Formatted table with work time calculations
2. **Plaintext Log**: Original raw log data in `<pre><code>`
3. **Markdown Summary**: Markdown table format

**Features**:
- Bootstrap 5.3.0 styling (loaded from CDN)
- Font Awesome 6.4.0 icons for copy buttons
- Copy-to-clipboard functionality with tooltip feedback
- Minified JavaScript for copy behavior (inline)

**Copy Button Logic**:
- Checks clipboard-write permission
- Converts HTML newlines back to tabs for proper formatting
- Shows tooltip on successful copy (1-second duration)

---

#### parse()
**Location**: [js/lib/download.js:103-152](js/lib/download.js#L103-L152)

```javascript
export function parse(text, mins)
```

**Parameters**:
- `text` (string): Raw log data
- `mins` (number): Rounding unit

**Returns**: `object` - Category-wise summary data

**Log Format**:
```
YYYY-MM-DD HH:MMCategory;Detail
```

**Parsing Logic**:
1. Split by newline (`\n`)
2. Extract timestamp (first 16 characters)
3. Extract category (up to `;` or end of line)
4. Extract detail (after `;`)
5. Store in object keyed by category

**Time Calculation**:
- Calculates time difference between consecutive entries
- Handles midnight crossing (negative hour difference)
- Accumulates minutes per category
- Rounds to specified unit: `Math.floor(time/60) + (Math.round(time%60/mins) * mins/60)`

**Detail Aggregation**:
- Collects all details for each category
- Removes duplicates using `Set`
- Joins with comma-space separator

**Data Structure**:
```javascript
{
  "Category A": {
    time: 90,        // Total minutes
    round: 1.5,      // Rounded hours
    detail: "Detail 1, Detail 2"
  },
  "Category B": { ... }
}
```

---

#### toHtml()
**Location**: [js/lib/download.js:161-199](js/lib/download.js#L161-L199)

```javascript
export function toHtml(log, mins)
```

**Parameters**:
- `log` (string): Raw log data
- `mins` (number): Rounding unit

**Returns**: `string` - HTML table markup

**Table Structure**:
```html
<table class='table table-striped-columns'>
  <thead class='table-light'>
    <tr>
      <th>Work Category</th>
      <th>Work Detail</th>
      <th>Work Time (hour)</th>
      <th>Work Time (min)</th>
    </tr>
  </thead>
  <tbody id='html_summary-source' class='table-group-divider'>
    <tr>
      <td>Category</td>
      <td>Detail 1, Detail 2</td>
      <td class='text-end'>1.5</td>
      <td class='text-end'>90</td>
    </tr>
    <!-- ... more rows ... -->
  </tbody>
</table>
<p>
  Work Time (Actual)： 7.5 h (450 mins)<br>
  Work Time (Total)： 8.0 h (480 mins)
</p>
```

**Special Behavior**:
- Categories starting with `^` are excluded from "actual" work time
- All categories included in "total" work time
- Empty categories display as `-`
- Rows sorted alphabetically by category

---

#### toMarkdown()
**Location**: [js/lib/download.js:208-228](js/lib/download.js#L208-L228)

```javascript
export function toMarkdown(log, mins)
```

**Parameters**:
- `log` (string): Raw log data
- `mins` (number): Rounding unit

**Returns**: `string` - Markdown table format

**Output Format**:
```markdown
Work Category | Work Detail | Work Time (hour) | Work Time (min)
--- | --- | --: | --:
Category A | Detail 1, Detail 2 | 1.5 | 90
Category B | Detail 3 | 2.0 | 120

Work Time (Actual)： 3.5 h (210 mins)
Work Time (Total)： 3.5 h (210 mins)
```

**Alignment**: Hours and minutes columns right-aligned (`--:`)

---

## 3. multilingualization.js

File: [js/lib/multilingualization.js](js/lib/multilingualization.js)

### Class Structure

```javascript
export default class Multilingualization {
  static init() { ... }
  static language() { ... }
  static translate(key) { ... }
  static translateAll() { ... }
  static dictionaries = { ... }
}
```

---

### Methods

#### init()
**Location**: [js/lib/multilingualization.js:11-66](js/lib/multilingualization.js#L11-L66)

**Purpose**: Early i18n initialization to prevent translation flicker

**Behavior**:
1. Detects current language
2. Sets global translation function `window.__i18n_t`
3. Creates MutationObserver to translate elements as they're added to DOM
4. Translates existing `[data-translate]` elements on DOMContentLoaded
5. Disconnects observer after initial translation

**Implementation Details**:
```javascript
static init() {
  const currentLang = this.language();

  // Global translation function
  window.__i18n_t = (key) => {
    const dict = this.dictionaries[currentLang];
    return dict ? dict[key] || key : key;
  };

  // Translate element
  const translateElement = (elem) => {
    if (elem.nodeType !== 1) return; // Element nodes only

    if (elem.hasAttribute && elem.hasAttribute('data-translate')) {
      const key = elem.dataset.translate;
      const translated = window.__i18n_t(key);
      if (elem.tagName === 'TITLE') {
        elem.textContent = translated;
      } else {
        elem.innerHTML = translated;
      }
    }

    // Translate children
    if (elem.querySelectorAll) {
      elem.querySelectorAll('[data-translate]').forEach(translateElement);
    }
  };

  // MutationObserver for dynamic elements
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach(translateElement);
    });
  });

  // Start observing
  if (document.documentElement) {
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  // Translate existing elements
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('[data-translate]').forEach(translateElement);
      observer.disconnect();
    });
  } else {
    document.querySelectorAll('[data-translate]').forEach(translateElement);
    observer.disconnect();
  }
}
```

**Usage**: Called in config.html `<head>` ([config.html:14-17](config.html#L14-L17)) to prevent flicker

---

#### language()
**Location**: Inferred from usage pattern

```javascript
static language() {
  const browserLang = navigator.language || navigator.userLanguage;
  return browserLang?.startsWith('ja') ? 'ja' : 'en';
}
```

**Returns**: `string` - Language code ('ja' or 'en')

**Detection**: Checks `navigator.language` for Japanese, defaults to English

---

#### translate()
**Location**: Inferred from usage pattern

```javascript
static translate(key)
```

**Parameters**:
- `key` (string): Translation key

**Returns**: `string` - Translated text or key if not found

**Usage**:
```javascript
Multilingualization.translate('shortcut_1')
// → '@work +PromotionalExams;Study' (en)
// → '@仕事 +昇進試験;勉強' (ja)
```

---

#### translateAll()
**Location**: Inferred from usage pattern

```javascript
static translateAll()
```

**Purpose**: Translates all elements with `data-translate` attribute

**Usage**: Called in [js/main.js:64](js/main.js#L64) on DOMContentLoaded

---

### Dictionary Structure

**Location**: [js/lib/multilingualization.js:70+](js/lib/multilingualization.js#L70)

```javascript
static dictionaries = {
  'en': {
    'app_name': 'Fast logbook PWA',
    'popup_title': 'Fast logbook PWA',
    'shortcut_1': '@work +PromotionalExams;Study',
    // ... 100+ keys
  },
  'ja': {
    'app_name': 'Fast logbook PWA',
    'popup_title': 'Fast logbook PWA',
    'shortcut_1': '@仕事 +昇進試験;勉強',
    // ... 100+ keys (same keys, Japanese values)
  }
}
```

**Key Categories**:
1. App metadata (name, title, description)
2. UI labels (buttons, menus, form labels)
3. Help content (sections, examples, instructions)
4. Shortcut defaults (9 preset shortcuts)
5. Time units (1min, 5min, etc.)
6. Work summary labels (category, detail, time)

**Size**: Approximately 100+ translation keys per language

---

## 4. indolence.min.js

File: [js/lib/indolence.min.js](js/lib/indolence.min.js)

**Purpose**: Minimized DOM utility library

**Note**: This is a minified file (650 bytes). Based on usage patterns, it likely contains:

### Inferred Functions

#### $$one()
```javascript
export function $$one(selector)
```

**Purpose**: Shorthand for `document.querySelector(selector)`

**Returns**: `HTMLElement|null`

**Usage**:
```javascript
$$one('textarea')             // → <textarea> element
$$one('.navbar-save-status')  // → <span> element
$$one('#help_button')         // → <a> element
```

---

#### $$all()
```javascript
export function $$all(selector)
```

**Purpose**: Shorthand for `document.querySelectorAll(selector)`

**Returns**: `NodeList`

**Usage**:
```javascript
$$all('label[data-shortcut-key]')  // → NodeList of shortcut labels
$$all('input')                     // → NodeList of input elements
```

---

#### $$disableConsole()
```javascript
export function $$disableConsole()
```

**Purpose**: Disables console output in production

**Usage**: Called in [js/main.js:59](js/main.js#L59)

**Likely Implementation**:
```javascript
export function $$disableConsole() {
  if (location.hostname !== 'localhost') {
    console.log = console.warn = console.error = () => {};
  }
}
```

---

## Utility Usage Patterns

### Date/Time Workflow

**Timestamping a Log Entry**:
```javascript
// User clicks shortcut button or enters text
const tag = 'Project A;Meeting';

// Append timestamp
const entry = appendTime(tag);
// → '2025-12-13 09:15Project A;Meeting'

// Add to textarea
appendLog(entry);

// Save to localStorage
saveLogs();
```

---

### Log Formatting Workflow

**Generating Summary**:
```javascript
// Retrieve data
const log = localStorage.getItem(LOG_DATA_KEY);
const mins = localStorage.getItem(ROUNDING_UNIT_MINUTE_KEY);

// Parse into categories
const parsed = parse(log, mins);
// → { 'Project A': { time: 90, round: 1.5, detail: 'Meeting' }, ... }

// Convert to HTML
const htmlTable = toHtml(log, mins);

// Convert to Markdown
const markdown = toMarkdown(log, mins);

// Generate complete document
const document = generateFormattedLog(log, mins);
```

---

### i18n Workflow

**Initial Page Load**:
```javascript
// 1. Early init (config.html only)
Multilingualization.init(); // Prevents flicker

// 2. Main app init
autoSetTheme();
Multilingualization.translateAll();

// 3. Dynamic content
const placeholder = Multilingualization.translate('input_placeholder');
$$one('input[placeholder]').placeholder = placeholder;
```

---

## Error Handling Patterns

### localStorage Quota
```javascript
try {
  localStorage.setItem(key, value);
} catch (e) {
  if (e.name === 'QuotaExceededError') {
    alert('ストレージ容量が不足しています');
  }
}
```

**Locations**: [js/main.js:48-51](js/main.js#L48-L51), [js/config.js:29-31](js/config.js#L29-L31)

### Undefined String Values
```javascript
const str = localStorage.getItem(key);
if (str && str !== 'undefined') {
  // Use value
} else {
  // Use default
}
```

**Rationale**: `localStorage.setItem(key, undefined)` stores string `"undefined"`

---

## Performance Considerations

### Debouncing
```javascript
let debounceTimeout;
$$one('textarea').addEventListener('input', async e => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(async () => {
    await saveLogs();
  }, 300);
});
```

**Benefit**: Reduces localStorage writes from every keystroke to once per 300ms pause

### MutationObserver Cleanup
```javascript
observer.disconnect(); // Stop observing after initial translation
```

**Benefit**: Prevents unnecessary DOM monitoring after i18n complete

### URL Object Revocation
```javascript
URL.revokeObjectURL(url); // Release memory after download
```

**Benefit**: Prevents memory leaks from blob URLs

---

## Testing Considerations

**Note**: No test framework is currently configured.

### Recommended Test Coverage

**utils.js**:
- Date/time functions with various inputs (null, valid, invalid)
- Rounding unit validation edge cases
- String manipulation (multiple newlines, empty strings)
- Theme detection with mocked media queries

**download.js**:
- Log parsing with various formats
- Time calculation across midnight
- Category exclusion (^ prefix)
- HTML/Markdown output formatting
- Rounding precision

**multilingualization.js**:
- Language detection (ja, en, other)
- Translation key lookup (existing, missing)
- Element translation (textContent vs innerHTML)
- MutationObserver behavior

**indolence.min.js**:
- Selector queries (existing, non-existing)
- Console disabling based on hostname

### Test Data Examples

**Valid Log Entry**:
```
2025-12-13 09:15Project A;Meeting
2025-12-13 10:30Project A;Coding
2025-12-13 12:00^Lunch
```

**Edge Cases**:
- Empty log
- Single entry (no time calculation)
- Midnight crossing (23:45 → 00:15)
- Categories with special characters
- Very long detail strings
- Missing semicolon separator

<!-- commit: ef46e13 -->
