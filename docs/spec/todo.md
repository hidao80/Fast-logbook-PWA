# TODO & Future Enhancements

## Immediate Fixes (High Priority)

### 1. ~~Fix IME Composition Handling~~ ✓ COMPLETED
**Issue**: [known_bugs.md#2](known_bugs.md#2-ime-composition-handling)
**File**: [js/main.js:141-143](js/main.js#L141-L143)

**Status**: ✓ Completed in version 25.12.13

**Applied Fix**:
```javascript
$$one('input').addEventListener('keydown', async e => {
  // Only process on Enter key, ignore IME composition
  if (!e.isComposing && e.keyCode !== 229 && e.key === 'Enter') {
    processInput(e.target);
  }
});
```

**Impact**: Fixed incorrect input processing behavior

---

### 2. Internationalize Error Messages
**Issue**: [known_bugs.md#3](known_bugs.md#3-storage-quota-exceeded-handling)
**Files**: [js/main.js:50](js/main.js#L50), [js/config.js:30](js/config.js#L30)

**Steps**:
1. Add translation keys to [js/lib/multilingualization.js](js/lib/multilingualization.js):
   ```javascript
   'storage_quota_exceeded': 'Storage capacity is insufficient',
   ```
2. Replace hard-coded Japanese strings:
   ```javascript
   alert(Multilingualization.translate('storage_quota_exceeded'));
   ```

**Effort**: 15 minutes
**Impact**: Better UX for non-Japanese users

---

### 3. Fix Service Worker Cache Name Race Condition
**Issue**: [known_bugs.md#4](known_bugs.md#4-service-worker-cache-name-initialization)
**File**: [sw.js:30-42](sw.js#L30-L42)

**Current Implementation**:
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

**Fix Option 1** (Simplest): Hard-code version from package.json
```javascript
const VERSION = "25.12.13";
const CACHE_NAME = APP_NAME + "_" + VERSION;
```

**Fix Option 2** (Better): Load synchronously in install event
```javascript
let CACHE_NAME = "";

self.addEventListener("install", (e) => {
  e.waitUntil(
    fetch('/manifest.json')
      .then(response => response.json())
      .then(manifestData => {
        CACHE_NAME = APP_NAME + "_" + manifestData.version;
        return caches.open(CACHE_NAME);
      })
      .then((cache) => {
        return cache.addAll(assets).catch(error => {
          console.error('Failed to add to cache:', error);
        });
      })
  );
});
```

**Effort**: 30 minutes
**Impact**: Ensures consistent cache naming

---

### 4. Fix Hard-coded Cache Name in Fetch Handler
**Issue**: [known_bugs.md#5](known_bugs.md#5-hard-coded-cache-name-in-fetch-handler)
**File**: [sw.js:75](sw.js#L75)

**Change**:
```javascript
// Before
caches.open('my-cache').then((cache) => {

// After
caches.open(CACHE_NAME).then((cache) => {
```

**Effort**: 2 minutes
**Impact**: Fixes cache inconsistency and cleanup issues

---

### 5. ~~Fix or Remove Textarea Enter Key Handler~~ ✓ COMPLETED
**Issue**: [known_bugs.md#6](known_bugs.md#6-textarea-enter-key-handling)
**File**: [js/main.js:151-158](js/main.js#L151-L158)

**Status**: ✓ Completed in version 25.12.13

**Applied Fix**: Fixed the logic with explicit Enter key check
```javascript
$$one('textarea').addEventListener('keydown', async e => {
  if ('Enter' == e.code) {
    // Ignore events processed by IME
    if (!e.isComposing && e.keyCode !== 229 && e.key === 'Enter') {
      return;
    }
    await saveLogs();
  }
});
```

**Impact**: Properly handles Enter key events with IME composition

---

## Bug Fixes (Medium Priority)

### 6. Add Save Status Visual Feedback
**Issue**: [known_bugs.md#16](known_bugs.md#16-save-status-indicator-race-condition)
**File**: [js/main.js:162-175](js/main.js#L162-L175)

**Enhancement**:
1. Add three states: saved (green), dirty (red), saving (yellow/animated)
2. Update CSS for `.navbar-save-status.saving` class
3. Set "saving" state immediately when debounce timer starts
4. Set "saved" state after save completes

**Effort**: 1 hour
**Impact**: Better UX clarity

---

### 7. Add Color-blind Friendly Save Indicator
**Issue**: [known_bugs.md#23](known_bugs.md#23-color-only-save-status-indicator)
**File**: [index.html:42](index.html#L42)

**Enhancement**:
```html
<!-- Before -->
<span class="navbar-save-status saved" aria-label="Save status: saved">●</span>

<!-- After -->
<span class="navbar-save-status saved" aria-label="Save status: saved">
  <i class="bi bi-check-circle"></i> <span class="status-text">Saved</span>
</span>
```

Add i18n for status text, use Bootstrap Icons for visual + text indicator

**Effort**: 30 minutes
**Impact**: Improved accessibility

---

### 8. Improve Console Error Handling
**Issue**: [known_bugs.md#1](known_bugs.md#1-console-error-handling)
**Files**: [sw.js:53](sw.js#L53), [js/main.js:241](js/main.js#L241)

**Options**:
1. Remove console.error calls
2. Replace with custom error logging mechanism
3. Show user-facing error messages for critical failures

**Recommendation**: For now, keep as-is (console is disabled in production)

**Effort**: 1 hour
**Impact**: Cleaner production code

---

## Feature Enhancements (High Value)

### 9. Add Undo/Redo Functionality
**Issue**: [known_bugs.md#13](known_bugs.md#13-no-undo-functionality)

**Implementation**:
1. Create history stack in memory (max 50 states)
2. Push state on each save operation
3. Add Undo (Ctrl+Z) and Redo (Ctrl+Shift+Z) keyboard shortcuts
4. Add Undo button to UI

**Effort**: 4 hours
**Impact**: Prevents accidental data loss

---

### 10. Add Search/Filter for Logs
**Issue**: [known_bugs.md#14](known_bugs.md#14-no-search-or-filter-capability)

**Implementation**:
1. Add search input field above textarea
2. Highlight matching lines as user types
3. Add "Filter" mode to show only matching lines
4. Support regex search

**Effort**: 6 hours
**Impact**: Improves usability with large logs

---

### 11. Add Date Range Export
**Issue**: [known_bugs.md#15](known_bugs.md#15-no-multi-day-log-separation)

**Implementation**:
1. Add date range picker to export modal
2. Filter log entries by date before formatting
3. Support "Today", "This Week", "This Month" presets
4. Allow custom date range selection

**Effort**: 8 hours
**Impact**: More flexible export options

---

### 12. Add Export Format Selection
**Issue**: [known_bugs.md#17](known_bugs.md#17-no-data-export-format-selection)

**Implementation**:
1. Add checkboxes for HTML/Plaintext/Markdown in export dialog
2. Generate only selected formats
3. Remember user preference in localStorage

**Effort**: 2 hours
**Impact**: Smaller export files, better UX

---

### 13. Add Log Compression
**Issue**: [known_bugs.md#20](known_bugs.md#20-no-log-compression)

**Implementation**:
1. Add pako.js library for gzip compression
2. Compress before localStorage.setItem()
3. Decompress after localStorage.getItem()
4. Add migration for existing uncompressed data

**Effort**: 8 hours
**Impact**: 80-90% storage savings

---

### 14. Migrate to IndexedDB
**Issue**: [known_bugs.md#18](known_bugs.md#18-synchronous-localstorage-writes)

**Implementation**:
1. Create IndexedDB schema with Dexie.js
2. Migrate localStorage data to IndexedDB
3. Update all read/write operations
4. Keep localStorage as fallback

**Effort**: 16 hours
**Impact**: Better performance with large logs, async operations

---

### 15. Add PWA Installation Instructions for iOS
**Issue**: [known_bugs.md#8](known_bugs.md#8-pwa-installation-availability)

**Implementation**:
1. Detect iOS via user agent
2. Show modal with installation instructions
3. Include screenshots of "Add to Home Screen" process
4. Dismiss permanently after user acknowledgment

**Effort**: 3 hours
**Impact**: Better iOS user experience

---

## Testing & Quality Improvements

### 16. Add Unit Tests with Vitest
**Issue**: [known_bugs.md#26](known_bugs.md#26-no-automated-tests)

**Implementation**:
1. Install Vitest and testing utilities
2. Write tests for utility functions:
   - Date/time functions
   - Rounding validation
   - String manipulation
   - Log parsing
   - HTML/Markdown formatting
3. Set up CI pipeline to run tests

**Effort**: 16 hours (initial setup + tests)
**Impact**: Prevents regressions, improves confidence

---

### 17. Add E2E Tests with Playwright
**Issue**: [known_bugs.md#26](known_bugs.md#26-no-automated-tests)

**Implementation**:
1. Install Playwright
2. Write E2E tests for:
   - Log entry flow
   - Configuration changes
   - Export functionality
   - Delete confirmation
   - PWA installation
3. Test on Chrome, Firefox, Safari

**Effort**: 20 hours
**Impact**: Comprehensive test coverage

---

### 18. Add Test Data Generator
**Issue**: [known_bugs.md#27](known_bugs.md#27-no-test-data-generators)

**Implementation**:
1. Create utility script to generate realistic log data
2. Support various scenarios (small logs, large logs, edge cases)
3. Add to dev tools or test fixtures

**Effort**: 4 hours
**Impact**: Easier testing of edge cases

---

### 19. Improve JSDoc Coverage
**Issue**: [known_bugs.md#28](known_bugs.md#28-no-api-documentation)

**Implementation**:
1. Add comprehensive JSDoc to all functions
2. Include parameter types, return types, examples
3. Generate HTML documentation with JSDoc tool
4. Add to docs/ directory

**Effort**: 8 hours
**Impact**: Better developer experience

---

## Performance Optimizations

### 20. Add Virtual Scrolling for Large Logs
**Issue**: [known_bugs.md#19](known_bugs.md#19-no-pagination-or-virtualization)

**Implementation**:
1. Implement virtual scrolling library (e.g., react-window equivalent)
2. Render only visible log entries
3. Maintain scroll position during updates

**Effort**: 12 hours
**Impact**: Smooth performance with 10,000+ entries

---

### 21. Add Build Process with Vite
**Issue**: [known_bugs.md#30](known_bugs.md#30-no-build-process)

**Implementation**:
1. Install Vite
2. Configure build for production (minification, bundling)
3. Update deployment pipeline
4. Keep development mode simple (no build required)

**Effort**: 6 hours
**Impact**: Smaller bundle sizes, faster load times

---

### 22. Lazy Load Bootstrap JavaScript
**Current**: Bootstrap loaded from CDN on every page

**Implementation**:
1. Load Bootstrap JS only when needed (modals, offcanvas)
2. Use dynamic import() for on-demand loading
3. Reduce initial bundle size

**Effort**: 2 hours
**Impact**: Faster initial page load

---

## Accessibility Improvements

### 23. Add Keyboard Shortcuts Configuration
**Issue**: [known_bugs.md#21](known_bugs.md#21-limited-keyboard-shortcuts)

**Implementation**:
1. Add keyboard shortcut configuration UI
2. Allow users to remap shortcut keys
3. Support Ctrl/Cmd/Alt modifiers
4. Save preferences in localStorage

**Effort**: 8 hours
**Impact**: Better accessibility for diverse users

---

### 24. Add Screen Reader Announcements
**Issue**: [known_bugs.md#22](known_bugs.md#22-no-screen-reader-announcements)

**Implementation**:
1. Add ARIA live region to HTML
2. Announce save status changes
3. Announce log entry additions
4. Announce export/delete actions

**Effort**: 3 hours
**Impact**: Better experience for visually impaired users

---

### 25. Accessibility Audit & Fixes

**Implementation**:
1. Run automated accessibility tests (axe, Lighthouse)
2. Manual testing with screen readers (NVDA, JAWS, VoiceOver)
3. Keyboard-only navigation testing
4. Fix identified issues (focus management, ARIA labels, etc.)

**Effort**: 12 hours
**Impact**: WCAG 2.1 Level AA compliance

---

## Security & Privacy

### 26. Add Optional Data Encryption
**Issue**: [known_bugs.md#24](known_bugs.md#24-no-data-encryption)

**Implementation**:
1. Add encryption option in config
2. Use Web Crypto API to encrypt localStorage data
3. Require password/passphrase from user
4. Encrypt/decrypt on read/write operations

**Effort**: 12 hours
**Impact**: Privacy protection for sensitive data

---

### 27. Improve Input Sanitization
**Issue**: [known_bugs.md#25](known_bugs.md#25-no-input-sanitization-for-downloads)

**Implementation**:
1. Install DOMPurify library
2. Sanitize all user input before rendering in HTML
3. Add Content Security Policy headers

**Effort**: 4 hours
**Impact**: Prevents XSS in downloaded files

---

## UX/UI Enhancements

### 28. Add Dark Mode Toggle

**Current**: Auto-detects system preference only

**Implementation**:
1. Add manual dark mode toggle in UI
2. Three options: Auto, Light, Dark
3. Save preference in localStorage
4. Update theme switching logic

**Effort**: 3 hours
**Impact**: User control over appearance

---

### 29. Add Log Entry Templates

**Implementation**:
1. Allow users to create custom log templates
2. Support placeholders (date, time, category, etc.)
3. Manage templates in config screen
4. Quick select template when logging

**Effort**: 8 hours
**Impact**: More flexible than 9 shortcuts

---

### 30. Add Statistics Dashboard

**Implementation**:
1. Create dashboard view showing:
   - Total work time today/week/month
   - Time breakdown by category (chart)
   - Most used categories
   - Average daily work time
2. Use Chart.js or similar library
3. Add to main menu

**Effort**: 12 hours
**Impact**: Better insights into work patterns

---

### 31. Add Export to Calendar (ICS)

**Implementation**:
1. Parse log entries into calendar events
2. Generate ICS file format
3. Allow import into Google Calendar, Outlook, etc.

**Effort**: 6 hours
**Impact**: Integration with existing tools

---

### 32. Add Multi-device Sync (Optional)

**Implementation**:
1. Add optional cloud sync feature
2. Support providers: Google Drive, Dropbox, or custom server
3. OAuth authentication
4. Conflict resolution UI

**Effort**: 40 hours
**Impact**: Cross-device data access

---

## Documentation

### 33. Create User Guide

**Implementation**:
1. Comprehensive user guide with screenshots
2. Cover all features and use cases
3. FAQ section
4. Troubleshooting guide

**Effort**: 8 hours
**Impact**: Better user onboarding

---

### 34. Create Contributor Guide

**Implementation**:
1. Development setup instructions
2. Code style guide
3. Architecture overview
4. Pull request guidelines

**Effort**: 4 hours
**Impact**: Easier for contributors to get started

---

### 35. Add Architecture Diagrams

**Implementation**:
1. Create diagrams for:
   - Data flow
   - Component relationships
   - Storage architecture
   - Service worker lifecycle
2. Use Mermaid or similar tool
3. Embed in documentation

**Effort**: 6 hours
**Impact**: Better understanding of system

**Note**: Partially completed in this spec documentation!

---

## Internationalization

### 36. Add More Language Support

**Current**: Japanese, English

**Potential Languages**:
- Chinese (Simplified/Traditional)
- Korean
- Spanish
- French
- German

**Effort**: 4 hours per language (translation only)
**Impact**: Wider user base

---

### 37. Add RTL Language Support

**Implementation**:
1. Detect RTL languages (Arabic, Hebrew)
2. Apply RTL CSS styles
3. Mirror layout components
4. Test with RTL translations

**Effort**: 8 hours
**Impact**: Accessibility for RTL language users

---

## Deployment & DevOps

### 38. Add Automated Version Bumping

**Implementation**:
1. Script to update version in package.json and manifest.json
2. Git tag creation
3. Changelog generation
4. Integrate with CI/CD

**Effort**: 3 hours
**Impact**: Streamlined release process

---

### 39. Add GitHub Actions CI/CD

**Current**: ESLint workflow exists

**Implementation**:
1. Add test running workflow
2. Add build and deploy workflow
3. Add release automation
4. Add PR checks (tests, lint, build)

**Effort**: 6 hours
**Impact**: Automated quality checks

---

### 40. Add Docker Deployment

**Current**: Dockerfile exists but may need updates

**Implementation**:
1. Review and update Dockerfile
2. Add docker-compose for local dev
3. Document Docker deployment
4. Add to CI/CD pipeline

**Effort**: 4 hours
**Impact**: Easier deployment options

---

## Priority Roadmap

### Phase 1: Bug Fixes (1-2 weeks)
- [x] #1: Fix IME composition handling ✓ COMPLETED (v25.12.13)
- [ ] #2: Internationalize error messages
- [ ] #3: Fix service worker cache name race condition
- [ ] #4: Fix hard-coded cache name in fetch handler
- [x] #5: Fix or remove textarea Enter key handler ✓ COMPLETED (v25.12.13)
- [ ] #7: Add color-blind friendly save indicator

### Phase 2: Essential Features (1 month)
- [ ] #9: Add undo/redo functionality
- [ ] #10: Add search/filter for logs
- [ ] #12: Add export format selection
- [ ] #15: Add PWA installation instructions for iOS

### Phase 3: Testing & Quality (1 month)
- [ ] #16: Add unit tests with Vitest
- [ ] #17: Add E2E tests with Playwright
- [ ] #19: Improve JSDoc coverage
- [ ] #25: Accessibility audit & fixes

### Phase 4: Performance (2 weeks)
- [ ] #6: Add save status visual feedback
- [ ] #21: Add build process with Vite
- [ ] #22: Lazy load Bootstrap JavaScript

### Phase 5: Advanced Features (2-3 months)
- [ ] #11: Add date range export
- [ ] #13: Add log compression
- [ ] #14: Migrate to IndexedDB
- [ ] #30: Add statistics dashboard
- [ ] #31: Add export to calendar (ICS)

### Phase 6: Nice-to-Have (Ongoing)
- [ ] #26: Add optional data encryption
- [ ] #29: Add log entry templates
- [ ] #32: Add multi-device sync (optional)
- [ ] #36: Add more language support

---

## Contribution Welcome

All items in this TODO list are open for community contribution. Priority items are marked in the roadmap above.

To contribute:
1. Check existing issues in GitHub
2. Comment on issue or create new one
3. Fork repository
4. Implement feature/fix
5. Submit pull request

See [CONTRIBUTING.md](../../.github/CONTRIBUTING.md) (to be created) for detailed guidelines.

---

## Progress Tracking

This document will be updated as items are completed. Completed items will be:
- [x] Marked with checkmark
- Moved to separate CHANGELOG.md
- Referenced in commit messages

Last updated: 2025-12-13
