# Known Issues & Limitations

## Current Known Issues

### No Critical Bugs

As of the current codebase analysis, there are no known critical bugs or issues explicitly marked in the code with `TODO`, `FIXME`, `HACK`, or `BUG` comments.

---

## Observed Limitations

### 1. Console Error Handling

**Location**: [sw.js:53](sw.js#L53), [js/main.js:241](js/main.js#L241)

**Issue**: Console error messages remain in production code

**Impact**: Low - Console is disabled in production via `$$disableConsole()`, but error handlers still execute `console.error()`

**Code Examples**:
```javascript
// sw.js:53
console.error('Failed to add to cache:', error);

// js/main.js:241
console.error('Bootstrap library is not loaded');
```

**Recommendation**: Replace with user-facing error messages or silent error logging

---

### 2. IME Composition Handling

**Location**: [js/main.js:141-143](js/main.js#L141-L143)

**Issue**: Input event handling for IME (Input Method Editor) composition

**Code**:
```javascript
$$one('input').addEventListener('keydown', async e => {
  // Ignore events processed by IME
  if (!e.isComposing && e.keyCode !== 229) {
    processInput(e.target);
  }
});
```

**Limitation**: The function `processInput()` is called on every keydown when not composing, but the intended trigger is Enter key confirmation

**Impact**: May process input prematurely or incorrectly

**Expected Behavior**: Should check for Enter key explicitly:
```javascript
if (!e.isComposing && e.keyCode !== 229 && e.key === 'Enter') {
  processInput(e.target);
}
```

**Workaround**: Android blur event handler provides fallback

---

### 3. Storage Quota Exceeded Handling

**Location**: [js/main.js:48-51](js/main.js#L48-L51), [js/config.js:29-31](js/config.js#L29-L31)

**Issue**: Japanese-only error message for storage quota errors

**Code**:
```javascript
if (e.name === 'QuotaExceededError') {
  alert('ストレージ容量が不足しています');  // Not internationalized
}
```

**Limitation**: Error message not using i18n system

**Impact**: Non-Japanese users see Japanese error message

**Recommendation**: Use `Multilingualization.translate('storage_quota_exceeded')` or similar

---

### 4. Service Worker Cache Name Initialization

**Location**: [sw.js:35-42](sw.js#L35-L42)

**Issue**: Asynchronous cache name initialization may cause timing issues

**Code**:
```javascript
let CACHE_NAME = "";

(() => {
  fetch('/manifest.json')
    .then(response => response.json())
    .then(manifestData => {
      CACHE_NAME = APP_NAME + "_" + manifestData.version;
    });
})();
```

**Limitation**: `CACHE_NAME` may be empty string when install event fires

**Impact**: Cache operations might use incorrect cache name

**Potential Issue**: Race condition between manifest fetch and service worker events

**Recommendation**: Move version to static constant or use `waitUntil()` pattern

---

### 5. Hard-coded Cache Name in Fetch Handler

**Location**: [sw.js:75](sw.js#L75)

**Issue**: Uses hard-coded `'my-cache'` instead of `CACHE_NAME` variable

**Code**:
```javascript
caches.open('my-cache').then((cache) => {
  cache.put(e.request, responseToCache);
});
```

**Limitation**: Inconsistent cache naming between install and fetch handlers

**Impact**: Creates separate cache that never gets cleaned up

**Expected**: Should use `CACHE_NAME` variable

**Recommendation**: Change to `caches.open(CACHE_NAME)`

---

### 6. Textarea Enter Key Handling

**Location**: [js/main.js:151-158](js/main.js#L151-L158)

**Issue**: Logic appears inverted or incomplete

**Code**:
```javascript
$$one('textarea').addEventListener('keydown', async e => {
  if ('Enter' == e.code) {
    // Ignore events processed by IME
    if (!e.isComposing && e.keyCode !== 229) {
      return;  // Does nothing!
    }
    await saveLogs();
  }
});
```

**Limitation**: When Enter is pressed (not composing), function returns early without saving

**Expected Behavior**: Should save when Enter is pressed without IME composition

**Impact**: Confusing code that doesn't match intended behavior (though debounced save compensates)

**Recommendation**: Fix logic or remove handler (debounced save already handles this)

---

### 7. processInput() Function Scope

**Location**: [js/main.js:131-136](js/main.js#L131-136)

**Issue**: Function defined inside DOMContentLoaded but only used once

**Code**:
```javascript
async function processInput(elem) {
  const str = elem.value.trim();
  if (str.length === 0) return;
  await appendLog(appendTime(str));
  elem.value = '';
}
```

**Limitation**: Not reusable outside DOMContentLoaded scope, yet exported with JSDoc

**Impact**: Code organization issue, no functional impact

**Recommendation**: Move to module scope or inline the logic

---

## Platform-Specific Limitations

### 8. PWA Installation Availability

**Location**: [js/lib/utils.js:113-118](js/lib/utils.js#L113-L118)

**Issue**: `beforeinstallprompt` event not supported on all platforms

**Platforms Without Support**:
- iOS Safari (uses native Add to Home Screen instead)
- Desktop Safari
- Firefox (limited support)

**Impact**: Install button never appears on unsupported platforms

**Workaround**: Users can manually add to home screen via browser menu

**Recommendation**: Detect iOS and show platform-specific installation instructions

---

### 9. Service Worker Limitations on iOS

**Issue**: iOS Safari service worker limitations

**Limitations**:
- Limited background sync
- Cache eviction more aggressive than other browsers
- May not persist offline data as long

**Impact**: PWA may require re-download of assets more frequently on iOS

**Workaround**: None available (platform limitation)

---

### 10. localStorage Quota Variations

**Issue**: Storage quota varies significantly across browsers

**Browser Quotas**:
- Chrome/Edge: ~10 MB
- Firefox: ~10 MB
- Safari: 5 MB (may prompt user)
- iOS Safari: 5 MB (stricter eviction)

**Impact**: Heavy users may hit quota on Safari sooner than Chrome

**Recommendation**: Add storage usage indicator or compression

---

## Browser Compatibility Issues

### 11. Speculation Rules API Support

**Location**: [index.html:27-32](index.html#L27-L32)

**Issue**: Speculation Rules API not widely supported (Chrome 108+)

**Code**:
```html
<script type="speculationrules">
{
  "prerender": [{ "where": { "href_matches": "/*" }, "eagerness": "moderate" }],
  "prefetch": [{ "where": { "href_matches": "/*" }, "eagerness": "moderate" }]
}
</script>
```

**Impact**: Progressive enhancement - ignored by unsupported browsers

**Supported**: Chrome 108+, Edge 108+

**Unsupported**: Firefox, Safari (as of 2025)

**Recommendation**: Consider removing if not seeing performance benefits

---

### 12. ES Module Import from CDN

**Location**: [js/main.js:5](js/main.js#L5)

**Issue**: Importing Bootstrap as ES module from CDN

**Code**:
```javascript
import * as bootstrap from 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js';
```

**Limitation**: Requires CORS headers and modern browser

**Impact**: May not work on older browsers or restrictive network environments

**Workaround**: Service worker caches the CDN resource for offline use

---

## UX/UI Limitations

### 13. No Undo Functionality

**Issue**: No way to undo log deletion or edits

**Impact**: Accidental deletion is permanent (unless user has export backup)

**Recommendation**: Add confirmation dialog with preview or undo mechanism

---

### 14. No Search or Filter Capability

**Issue**: Large logs (thousands of entries) difficult to navigate

**Impact**: User must scroll through entire textarea to find entries

**Recommendation**: Add search/filter UI or date-based navigation

---

### 15. No Multi-day Log Separation

**Issue**: All logs stored in single continuous string

**Impact**: Cannot easily view/export single day's logs

**Recommendation**: Add date range filtering for export

---

### 16. Save Status Indicator Race Condition

**Location**: [js/main.js:164-167](js/main.js#L164-L167)

**Issue**: Save status may flicker during rapid typing

**Code**:
```javascript
if (e.isComposing && e.inputType === 'insertCompositionText') {
  $$one('.navbar-save-status').classList.remove('saved');
} else if (e.inputType !== 'insertLineBreak') {
  $$one('.navbar-save-status').classList.remove('saved');
}
```

**Limitation**: Status updates immediately on input, then changes to "saved" after 300ms debounce

**Impact**: Visual indicator may be confusing during fast typing

**Recommendation**: Add intermediate "saving..." state

---

### 17. No Data Export Format Selection

**Issue**: Always exports all three formats (HTML, plaintext, Markdown) in single file

**Impact**: Large export files if only one format needed

**Recommendation**: Add format selection checkboxes

---

## Performance Limitations

### 18. Synchronous localStorage Writes

**Issue**: `localStorage.setItem()` is synchronous and blocks main thread

**Impact**: May cause UI jank with very large logs (>5 MB)

**Workaround**: 300ms debounce reduces write frequency

**Recommendation**: Migrate to IndexedDB for async storage

---

### 19. No Pagination or Virtualization

**Issue**: Entire log loaded into textarea at once

**Impact**: Performance degradation with very large logs (10,000+ entries)

**Symptoms**: Slow scrolling, high memory usage, slow input response

**Recommendation**: Implement virtual scrolling or pagination

---

### 20. No Log Compression

**Issue**: Logs stored as plain text without compression

**Impact**: Uses more storage quota than necessary

**Example**: 1 MB log could compress to ~100 KB with gzip

**Recommendation**: Implement client-side compression (e.g., pako.js)

---

## Accessibility Limitations

### 21. Limited Keyboard Shortcuts

**Issue**: Only number keys (0-9) have shortcuts

**Impact**: Users who cannot use number keys have limited quick access

**Recommendation**: Add configurable keyboard shortcuts (e.g., Ctrl+1, etc.)

---

### 22. No Screen Reader Announcements

**Issue**: Save status changes not announced to screen readers

**Impact**: Visually impaired users don't know when data is saved

**Recommendation**: Add ARIA live region for status announcements

---

### 23. Color-Only Save Status Indicator

**Issue**: Save status shown only by color change (green/red dot)

**Impact**: Color-blind users may not distinguish saved/unsaved state

**Recommendation**: Add icon or text label in addition to color

---

## Security Limitations

### 24. No Data Encryption

**Issue**: localStorage data stored in plaintext

**Impact**: Anyone with device access can read work logs

**Severity**: Low (application not designed for sensitive data)

**Recommendation**: Document in user guide; consider optional encryption

---

### 25. No Input Sanitization for Downloads

**Issue**: User input included in generated HTML without full sanitization

**Location**: [js/lib/download.js:179-180](js/lib/download.js#L179-L180)

**Code**:
```javascript
<td>${escapeHtml(category) ? escapeHtml(category) : '-'}</td>
<td>${escapeHtml(dataJson[category].detail) ? escapeHtml(dataJson[category].detail) : ' '}</td>
```

**Limitation**: `escapeHtml()` is basic; doesn't handle all edge cases

**Impact**: Potential XSS in downloaded HTML files (user would harm themselves)

**Severity**: Low (user controls all input)

**Recommendation**: Use DOMPurify or similar library for robust sanitization

---

## Testing Limitations

### 26. No Automated Tests

**Issue**: No unit tests, integration tests, or E2E tests

**Impact**: Regression risk when making changes

**Recommendation**: Add Vitest for unit tests, Playwright for E2E

---

### 27. No Test Data Generators

**Issue**: Manual testing requires manual data entry

**Impact**: Difficult to test edge cases (large logs, special characters, etc.)

**Recommendation**: Add test data generator utility

---

## Documentation Limitations

### 28. No API Documentation

**Issue**: Functions lack comprehensive JSDoc comments

**Impact**: Difficult for contributors to understand codebase

**Recommendation**: Add JSDoc to all exported functions

---

### 29. No Architecture Diagrams

**Issue**: No visual representation of data flow or component relationships

**Impact**: Harder for new developers to understand system

**Recommendation**: Add diagrams to documentation (now added in this spec!)

---

## Deployment Limitations

### 30. No Build Process

**Issue**: No minification, bundling, or optimization step

**Impact**: Larger file sizes, slower initial load (mitigated by service worker caching)

**Trade-off**: Simpler deployment, no build tool required

**Recommendation**: Consider Vite or similar for production builds

---

## Workarounds & Mitigations

Most limitations are mitigated by:

1. **Service Worker Caching**: Compensates for CDN dependencies
2. **Debounced Saves**: Reduces performance impact of synchronous localStorage
3. **Progressive Enhancement**: Unsupported features degrade gracefully
4. **User Documentation**: Help modal explains usage and limitations
5. **Export Functionality**: Allows users to backup data regularly

---

## Priority Assessment

### High Priority (Should Fix)
- #2: IME composition handling (Enter key processing)
- #3: Internationalize error messages
- #4: Service worker cache name initialization race condition
- #5: Hard-coded cache name in fetch handler
- #6: Textarea Enter key logic

### Medium Priority (Should Improve)
- #13: No undo functionality
- #14: No search/filter
- #15: No multi-day separation
- #20: No log compression
- #23: Color-only save indicator

### Low Priority (Nice to Have)
- #1: Console error handling
- #17: Export format selection
- #26: Automated tests
- #30: Build process

### Informational (Document Only)
- #8-12: Platform/browser limitations
- #24: No data encryption (by design)
- #25: Basic input sanitization (acceptable risk)

---

## Testing Recommendations

To identify additional issues, implement:

1. **Unit Tests** for utilities (date/time, parsing, formatting)
2. **Integration Tests** for localStorage operations
3. **E2E Tests** for user workflows (log entry, export, config)
4. **Performance Tests** with large datasets (10,000+ entries)
5. **Accessibility Audit** with screen readers and keyboard-only navigation
6. **Cross-browser Testing** on Chrome, Firefox, Safari, Edge
7. **Mobile Testing** on iOS Safari and Android Chrome
8. **Offline Testing** with service worker caching
9. **Storage Quota Testing** to verify error handling
10. **i18n Testing** for Japanese and English translations
