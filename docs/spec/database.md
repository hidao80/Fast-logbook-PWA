# Data Storage & Persistence

## Storage Architecture

Fast Logbook PWA uses **client-side only** storage with no backend server. All data persists in the browser using:

1. **localStorage**: Primary data storage
2. **Cache API**: Asset caching via Service Worker
3. **IndexedDB**: Not currently used (potential future enhancement)

---

## localStorage Schema

### Overview

All application data is stored in browser `localStorage` under specific keys. Data persists across browser sessions but is domain-specific.

**Storage Limits**:
- Typical quota: 5-10 MB per domain
- Varies by browser
- Error handling via `QuotaExceededError`

---

### Data Keys

#### 1. log
**Type**: `string`
**Format**: Newline-separated log entries
**Size**: Variable (can grow to MB range)

**Structure**:
```
YYYY-MM-DD HH:MMCategory;Detail
YYYY-MM-DD HH:MMCategory;Detail
...
```

**Example**:
```
2025-12-13 09:15@work +Project A;Meeting
2025-12-13 10:30@work +Project A;Coding
2025-12-13 12:00^Lunch
2025-12-13 13:00@work +Project B;Review
```

**Special Markers**:
- **`;` separator**: Divides category from detail
- **`^` prefix**: Excludes from work time calculation
- **`@` prefix**: Convention for context (not enforced)
- **`+` prefix**: Convention for project (not enforced)

**Write Locations**:
- [js/main.js:46](js/main.js#L46) - `saveLogs()` function
- Triggered by:
  - Textarea input (300ms debounce)
  - IME composition end
  - Window/input blur
  - Shortcut button click
  - Custom input submission

**Read Locations**:
- [js/main.js:29](js/main.js#L29) - `loadLogs()` function
- [js/main.js:216](js/main.js#L216) - View formatted log
- [js/main.js:230](js/main.js#L230) - Download formatted log
- [js/lib/download.js:90](js/lib/download.js#L90) - `downloadLog()`

---

#### 2. rounding_mins
**Type**: `number` (stored as string)
**Valid Values**: `1`, `5`, `10`, `15`, `30`, `60`
**Default**: `1`

**Purpose**: Time rounding precision for work time calculations

**Example Values**:
- `1` = 1-minute precision (no rounding)
- `15` = Round to nearest 15 minutes (e.g., 0:23 → 0:15, 0:38 → 0:30)
- `60` = Round to nearest hour

**Write Locations**:
- [js/config.js:42](js/config.js#L42) - On select dropdown change
- [js/main.js:221](js/main.js#L221) - Set default if missing

**Read Locations**:
- [js/config.js:37](js/config.js#L37) - Load into dropdown
- [js/main.js:217](js/main.js#L217) - View formatted log
- [js/lib/download.js:91](js/lib/download.js#L91) - Download formatted log

**Validation**: [js/lib/utils.js:55-67](js/lib/utils.js#L55-L67) - `getRoundingUnit()` function

---

#### 3. shortcut_1 through shortcut_9
**Type**: `string`
**Default**: i18n translated defaults (varies by language)
**Max Count**: 9 shortcuts

**Format**: Free-form text, typically `Category;Detail`

**Example Shortcuts**:
```javascript
shortcut_1: '@work +Project A;Meeting'
shortcut_2: '@work +Project A;Coding'
shortcut_3: '^Break'
shortcut_4: '@personal +Learning;Reading'
shortcut_5: ''  // Empty/unused
```

**Write Locations**:
- [js/config.js:27](js/config.js#L27) - On input change event
- User edits in config.html

**Read Locations**:
- [js/main.js:76](js/main.js#L76) - Load shortcut labels
- [js/config.js:21](js/config.js#L21) - Load into input fields

**Fallback Behavior**:
```javascript
const str = localStorage.getItem(key);
if (str && str !== 'undefined') {
  node.textContent = str;  // Use saved value
} else {
  node.textContent = Multilingualization.translate(key);  // Use default
}
```

---

#### 4. downloadUrl & downloadFilename
**Type**: `string` (temporary)
**Lifetime**: Milliseconds (immediately deleted after use)

**Purpose**: Cross-context download trigger mechanism

**Write Location**: [js/lib/download.js:22-23](js/lib/download.js#L22-L23)

**Read Location**: [js/lib/download.js:32-33](js/lib/download.js#L32-L33)

**Cleanup**: [js/lib/download.js:47-48](js/lib/download.js#L47-L48)

**Flow**:
1. Generate blob URL and filename
2. Store in localStorage
3. Dispatch `startDownload` event
4. Event listener reads values
5. Trigger download
6. Delete from localStorage

**Rationale**: Allows download from different execution context (view formatted log opens new tab)

---

## Data Operations

### Read Operations

#### Load Logs on Startup
**Function**: `loadLogs()`
**Location**: [js/main.js:27-37](js/main.js#L27-L37)

```javascript
async function loadLogs() {
  const str = localStorage.getItem(LOG_DATA_KEY);
  if (str && str != 'undefined') {
    const textarea = $$one('textarea');
    textarea.value = str;
    textarea.scrollTo(0, textarea.scrollHeight);  // Auto-scroll to bottom
  }
}
```

**Called**: [js/main.js:272](js/main.js#L272) - After DOMContentLoaded

**Edge Cases**:
- Empty localStorage: Textarea remains empty
- String `"undefined"`: Treated as empty (fallback)

---

#### Load Configuration
**Shortcuts**: [js/config.js:20-33](js/config.js#L20-L33)

```javascript
$$all('input').forEach(node => {
  const str = localStorage.getItem(node.dataset.translate);
  node.value = (str && str != 'undefined')
    ? str
    : Multilingualization.translate(node.dataset.translate);
});
```

**Rounding Unit**: [js/config.js:37-38](js/config.js#L37-L38)

```javascript
const min = localStorage.getItem(ROUNDING_UNIT_MINUTE_KEY);
$$one('select').value = getRoundingUnit(min);
```

---

### Write Operations

#### Save Logs
**Function**: `saveLogs()`
**Location**: [js/main.js:44-53](js/main.js#L44-L53)

```javascript
function saveLogs() {
  try {
    localStorage.setItem(LOG_DATA_KEY, trimNewLine($$one('textarea').value));
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      alert('ストレージ容量が不足しています');  // Storage capacity insufficient
    }
  }
  $$one('.navbar-save-status').classList.toggle('saved', true);
}
```

**Pre-processing**: `trimNewLine()` removes duplicate/trailing newlines

**Error Handling**: Alerts user if storage quota exceeded

**Visual Feedback**: Updates save status indicator to "saved" (green)

**Triggers**:
1. **Debounced input** ([js/main.js:162-175](js/main.js#L162-L175)): 300ms after last keystroke
2. **IME composition end** ([js/main.js:178-181](js/main.js#L178-L181)): Immediate save
3. **Blur events** ([js/main.js:184-188](js/main.js#L184-L188)): When focus leaves textarea/input/window
4. **Shortcut click** ([js/main.js:87](js/main.js#L87)): After appending log
5. **Custom input** ([js/main.js:134](js/main.js#L134)): After processing input
6. **Menu toggle** ([js/main.js:196-198](js/main.js#L196-L198)): Before opening sidebar

---

#### Save Configuration
**Shortcuts** ([js/config.js:25-33](js/config.js#L25-L33)):

```javascript
node.addEventListener('change', e => {
  try {
    localStorage.setItem(e.target.dataset.translate, e.target.value.trim());
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      alert('ストレージ容量が不足しています');
    }
  }
});
```

**Rounding Unit** ([js/config.js:41-43](js/config.js#L41-L43)):

```javascript
$$one('select').addEventListener('change', e => {
  localStorage.setItem(ROUNDING_UNIT_MINUTE_KEY, e.target.value);
});
```

**Trigger**: `change` event (when input loses focus or value changes)

---

### Delete Operations

#### Clear Logs
**Location**: [js/main.js:246-248](js/main.js#L246-L248)

```javascript
const textarea = $$one('textarea');
textarea.value = '';
await saveLogs();  // Saves empty string to localStorage
```

**Triggered By**: Confirm button in delete confirmation modal

**Effect**: Sets `log` key to empty string (does not delete key)

---

#### Clear Configuration
**Not Implemented**: No UI to reset shortcuts to defaults

**Manual Method**: User can delete values in config.html inputs

---

## Cross-Tab Synchronization

### Main Application
**Location**: [js/main.js:208-212](js/main.js#L208-L212)

```javascript
window.addEventListener('storage', (event) => {
  if (event.key === LOG_DATA_KEY) {
    $$one('textarea').value = event.newValue;
  }
});
```

**Behavior**:
- Listens for `storage` events from other tabs/windows
- Updates textarea content when log changes
- Ensures consistency across multiple open tabs

---

### Configuration Page
**Location**: [js/config.js:46-53](js/config.js#L46-L53)

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

**Behavior**:
- Synchronizes all configuration fields
- Updates rounding unit dropdown
- Updates shortcut input fields
- Maintains consistency across tabs

---

## Service Worker Caching

### Cache Storage

**Service Worker**: [sw.js](sw.js)

**Cache Name**: `Fast logbook PWA_VERSION` (e.g., `Fast logbook PWA_25.12.13`)

**Version Source**: [manifest.json](manifest.json) version field

**Cached Assets** ([sw.js:6-26](sw.js#L6-L26)):
```javascript
const assets = [
  "/",
  "/index.html",
  "/config.html",
  "/img/android-launchericon-48-48.png",
  "/img/android-launchericon-72-72.png",
  "/img/android-launchericon-96-96.png",
  "/img/android-launchericon-144-144.png",
  "/img/android-launchericon-192-192.png",
  "/img/android-launchericon-512-512.png",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css",
  "/css/config.css",
  "/css/main.css",
  "/js/main.js",
  "/js/config.js",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js",
  "/js/lib/download.js",
  "/js/lib/indolence.min.js",
  "/js/lib/multilingualization.js",
  "/js/lib/utils.js",
];
```

---

### Cache Strategy

**Type**: Stale-While-Revalidate with date comparison

**Install Event** ([sw.js:47-57](sw.js#L47-L57)):
```javascript
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(assets).catch(error => {
        console.error('Failed to add to cache:', error);
      });
    })
  );
});
```

**Behavior**: Downloads and caches all assets on service worker installation

---

**Fetch Event** ([sw.js:62-107](sw.js#L62-L107)):

```javascript
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      const fetchPromise = fetch(e.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open('my-cache').then((cache) => {
          cache.put(e.request, responseToCache);
        });

        return networkResponse;
      });

      if (cachedResponse) {
        return fetchPromise.then((networkResponse) => {
          if (!networkResponse) {
            return cachedResponse;
          }

          const networkDate = new Date(networkResponse.headers.get('date'));
          const cachedDate = new Date(cachedResponse.headers.get('date'));

          if (networkDate > cachedDate) {
            return networkResponse;  // Network is newer
          } else {
            return cachedResponse;   // Cache is newer or equal
          }
        }).catch(() => {
          return cachedResponse;     // Network failed, use cache
        });
      }

      return fetchPromise;  // No cache, use network
    })
  );
});
```

**Strategy**:
1. Check cache first
2. Fetch from network in parallel
3. If both exist, compare `Date` headers
4. Return newer version
5. Update cache with network response
6. Fall back to cache if network fails

---

**Activate Event** ([sw.js:112-127](sw.js#L112-L127)):
```javascript
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);  // Delete old caches
          }
        })
      );
    })
  );
});
```

**Behavior**: Deletes old cache versions on service worker activation

---

## Data Persistence & Lifecycle

### Persistence Scope

**localStorage**:
- **Scope**: Per origin (protocol + domain + port)
- **Persistence**: Indefinite (until user clears browser data)
- **Shared**: Across all tabs/windows of same origin
- **Size**: 5-10 MB typical quota

**Cache API**:
- **Scope**: Per origin
- **Persistence**: Indefinite (managed by service worker)
- **Shared**: Across all tabs/windows
- **Size**: Larger quota than localStorage (browser-dependent)

---

### Data Lifetime

**User Log Data** (`log` key):
- Created: First time user logs activity
- Updated: Every save operation (debounced 300ms)
- Deleted: Only when user explicitly clears logs
- Migrated: Never (no version migration logic)

**Configuration Data** (`rounding_mins`, `shortcut_*`):
- Created: First time user changes setting
- Updated: On config page input change
- Deleted: Never (persists indefinitely)
- Migrated: Never (validated on read with defaults)

**Cache Data**:
- Created: Service worker installation
- Updated: On fetch (if network version newer)
- Deleted: On service worker activation (old versions)
- Migrated: Automatic (version in cache name)

---

### Data Backup & Export

**Export Formats**:
1. **HTML**: Complete formatted log with tables and summaries
2. **Plaintext**: Raw log data (copy from textarea or download)
3. **Markdown**: Table format for documentation

**Export Methods**:
1. **Download File** ([js/main.js:230](js/main.js#L230)): Downloads HTML file
2. **View in Tab** ([js/main.js:215](js/main.js#L215)): Opens formatted log in new tab
3. **Copy to Clipboard**: From textarea or formatted log viewer

**Filename**: `Fast logbook PWA_YYYY-MM-DD.html`

---

### Data Recovery

**No Built-in Recovery**: Application has no backup mechanism

**User Strategies**:
1. Regular downloads (manual backup)
2. Browser sync (if enabled in browser settings)
3. Browser developer tools (localStorage inspector)

**Data Loss Scenarios**:
- User clears browser data
- User clears site data
- Browser storage eviction (rare)
- Uninstalling PWA (may or may not clear data, browser-dependent)

---

## Security & Privacy

### Data Security

**Encryption**: None - data stored in plaintext

**Rationale**: Client-side only application, no server transmission

**Risk**: Anyone with access to device can read localStorage

**Mitigation**: User should not store sensitive information

---

### Data Privacy

**No Server Communication**: All data stays on device

**No Analytics**: No tracking or telemetry

**No Third-Party Services**: Only Bootstrap CDN for UI framework (CSS/JS only)

**User Control**: Complete ownership of data

---

### Storage Quota Management

**Quota Detection**: Not implemented

**Quota Error Handling** ([js/main.js:48-51](js/main.js#L48-L51)):
```javascript
try {
  localStorage.setItem(LOG_DATA_KEY, trimNewLine($$one('textarea').value));
} catch (e) {
  if (e.name === 'QuotaExceededError') {
    alert('ストレージ容量が不足しています');
  }
}
```

**User Action Required**: Manual log cleanup or browser data management

**Recommendations**:
- Regular log downloads and cleanup
- Monitor log size (no UI indicator)
- Delete old logs after export

---

## Performance Considerations

### Write Performance

**Debouncing** ([js/main.js:171-174](js/main.js#L171-L174)):
```javascript
clearTimeout(debounceTimeout);
debounceTimeout = setTimeout(async () => {
  await saveLogs();
}, 300);
```

**Benefit**: Reduces localStorage writes from O(keystrokes) to O(pauses)

**Trade-off**: 300ms delay before save (acceptable for user expectations)

---

### Read Performance

**Single Load on Startup** ([js/main.js:272](js/main.js#L272)):
- Logs loaded once on DOMContentLoaded
- Subsequent edits only write, don't re-read

**Caching**: No in-memory cache (textarea is the "cache")

---

### Storage Performance

**localStorage** (synchronous):
- Blocking I/O on main thread
- Generally fast for small data (<1MB)
- Can cause jank with very large logs (>5MB)

**Optimization Opportunities** (not implemented):
1. IndexedDB for asynchronous storage
2. Compression for large logs
3. Pagination for very long logs

---

## Future Enhancements

### Potential Improvements

1. **IndexedDB Migration**:
   - Async storage for better performance
   - Support larger datasets
   - Structured data storage

2. **Data Versioning**:
   - Schema version tracking
   - Migration logic for breaking changes
   - Backward compatibility

3. **Cloud Sync** (optional):
   - User-controlled sync to cloud storage
   - Multi-device access
   - Conflict resolution

4. **Data Compression**:
   - Gzip compression for logs
   - Reduce storage quota usage
   - Improve performance with large datasets

5. **Export Improvements**:
   - CSV export format
   - Date range filtering
   - Scheduled auto-exports

6. **Import Functionality**:
   - Upload previous exports
   - Merge with existing data
   - Data validation

---

## Database Schema Summary

| Key | Type | Max Size | Persistence | Sync | Notes |
|-----|------|----------|-------------|------|-------|
| `log` | string | 5-10 MB | Indefinite | Cross-tab | Newline-separated entries |
| `rounding_mins` | string | <10 bytes | Indefinite | Cross-tab | Validated on read |
| `shortcut_1` - `shortcut_9` | string | ~100 bytes each | Indefinite | Cross-tab | Fallback to i18n defaults |
| `downloadUrl` | string | <1 KB | Milliseconds | No | Temporary download trigger |
| `downloadFilename` | string | <100 bytes | Milliseconds | No | Temporary download trigger |

**Total Typical Storage**: <1 MB for moderate use (1-3 months of daily logs)

**Total Maximum Storage**: Up to 10 MB (browser-dependent quota)
