import { downloadLog, generateFormattedLog } from './lib/download.js';
import { $$all, $$disableConsole, $$one } from './lib/indolence.min.js';
import Multilingualization from './lib/multilingualization.js';
import { getItem, migrateFromLocalStorage, setItem } from './lib/storage.js';
import {
  appendTime,
  autoSetTheme,
  getTodayString,
  installPWA,
  LOG_DATA_KEY,
  ROUNDING_UNIT_MINUTE_KEY,
  trimNewLine,
} from './lib/utils.js';

/* global bootstrap */

// Cross-tab synchronization via BroadcastChannel
const bc = new BroadcastChannel('fast-logbook-sync');

const DATE_ROLL_OVER_TIME_KEY = 'date-roll-over-time';
const LAST_EDITED_DATE_KEY = 'last_edited_date';
const MIGRATION_VERSION_KEY = 'migration_version';

/**
 * Run all pending data migrations in version order.
 *
 * Each version block is guarded by `version < N` so it runs exactly once.
 * The version number is written to IndexedDB only after the block completes,
 * so an interrupted migration will be retried on the next load.
 *
 * Adding future migrations: append a new `if (version < N)` block and bump N.
 */
async function runMigrations() {
  const stored = await getItem(MIGRATION_VERSION_KEY);
  const version = Number(stored ?? 0);

  if (version < 1) {
    // v1: Move all app data from localStorage to IndexedDB.
    await migrateFromLocalStorage([
      LOG_DATA_KEY,
      ROUNDING_UNIT_MINUTE_KEY,
      DATE_ROLL_OVER_TIME_KEY,
      'shortcut_1',
      'shortcut_2',
      'shortcut_3',
      'shortcut_4',
      'shortcut_5',
      'shortcut_6',
      'shortcut_7',
      'shortcut_8',
      'shortcut_9',
    ]);

    // The roll-over time was once stored under the key 'date-roll-over-time-value'
    // (the data-translate attribute value). Consolidate to the canonical key if
    // the canonical key was not already migrated above.
    const oldRollOver = localStorage.getItem('date-roll-over-time-value');
    if (oldRollOver && !(await getItem(DATE_ROLL_OVER_TIME_KEY))) {
      await setItem(DATE_ROLL_OVER_TIME_KEY, oldRollOver);
    }
    localStorage.removeItem('date-roll-over-time-value');

    // Remove any stale transient localStorage keys from the old implementation.
    localStorage.removeItem('downloadUrl');
    localStorage.removeItem('downloadFilename');

    await setItem(MIGRATION_VERSION_KEY, '1');
  }
}

/**
 * Returns 'YYYY-MM-DD' for the logical "today", adjusted for the roll-over time.
 * If the current wall-clock time is before the roll-over, "today" is yesterday.
 *
 * @param {string} rollOver - 'HH:MM'
 * @returns {string} 'YYYY-MM-DD'
 */
function getDateWithRollOver(rollOver) {
  const [rollHour, rollMin] = rollOver.split(':').map(Number);
  const now = new Date();
  if (now.getHours() * 60 + now.getMinutes() < rollHour * 60 + rollMin) {
    const prev = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const y = prev.getFullYear().toString().padStart(4, '0');
    const m = (prev.getMonth() + 1).toString().padStart(2, '0');
    const d = prev.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return getTodayString();
}

/**
 * Compute the [start, end) timestamp boundaries for a given date and roll-over time.
 * The "day" spans from selectedDate@rollOver to (selectedDate+1)@rollOver.
 *
 * @param {string} selectedDate - 'YYYY-MM-DD'
 * @param {string} rollOver     - 'HH:MM'
 * @returns {{ start: Date, end: Date }}
 */
function getDateBoundaries(selectedDate, rollOver) {
  const start = new Date(`${selectedDate}T${rollOver}:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

/**
 * Add one log entry
 *
 * @param {*} tag A single log entry without timestamp
 * @return {Promise}
 */
export function appendLog(tag) {
  const textarea = $$one('textarea');
  textarea.value += `\n${tag}`;
  textarea.value = trimNewLine(textarea.value);

  // Always scroll to the bottom
  textarea.scrollTo(0, textarea.scrollHeight);
}

/**
 * Load and display only the log entries that fall within the date shown
 * in input[type="date"], using the date-roll-over-time boundary.
 *
 * @return {Promise}
 */
async function loadLogs() {
  const allLog = await getItem(LOG_DATA_KEY);
  const textarea = $$one('textarea');

  if (!allLog || allLog === 'undefined') {
    textarea.value = '';
    return;
  }

  const rollOver = (await getItem(DATE_ROLL_OVER_TIME_KEY)) ?? '05:00';
  const selectedDate = $$one('#target-date').value;
  if (!selectedDate) {
    textarea.value = '';
    return;
  }
  const { start, end } = getDateBoundaries(selectedDate, rollOver);

  const filtered = allLog
    .split('\n')
    .filter((line) => {
      if (line.length < 16) return false;
      // Log format: 'YYYY-MM-DD HH:MM...' — first 16 chars are the timestamp
      const t = new Date(`${line.slice(0, 10)}T${line.slice(11, 16)}:00`);
      return t >= start && t < end;
    })
    .join('\n');

  textarea.value = filtered;
  textarea.scrollTo(0, textarea.scrollHeight);
}

/**
 * Buffer the textarea content to localStorage.
 *
 * This is intentionally synchronous and lightweight — it runs on every
 * keystroke (via debounce) and must not block the UI. The date is saved
 * alongside the content so flushBuffer() knows which day's range to update,
 * even if the user navigates away and comes back later.
 */
function saveLogs() {
  try {
    localStorage.setItem('log_buffer', trimNewLine($$one('textarea').value));
    localStorage.setItem('log_buffer_date', $$one('#target-date').value);
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      alert('ストレージ容量が不足しています');
    }
  }
  $$one('.navbar-save-status').classList.toggle('saved', true);
}

/**
 * Merge the localStorage buffer into the IndexedDB log entry for its date.
 *
 * Call this before any operation that reads the full log (date change,
 * page navigation, formatted-log view/download). No-op when the buffer
 * is absent, so it is safe to call unconditionally.
 *
 * @return {Promise}
 */
async function flushBuffer() {
  const buffer = localStorage.getItem('log_buffer');
  const bufferDate = localStorage.getItem('log_buffer_date');
  if (buffer === null || !bufferDate) return;

  const rollOver = (await getItem(DATE_ROLL_OVER_TIME_KEY)) ?? '05:00';
  const { start, end } = getDateBoundaries(bufferDate, rollOver);

  const allLog = (await getItem(LOG_DATA_KEY)) ?? '';
  const editedLines = trimNewLine(buffer).split('\n').filter(Boolean);

  // Keep lines that belong to dates outside the buffer's date range
  const otherLines = allLog.split('\n').filter((line) => {
    if (!line || line.length < 16) return !!line;
    const t = new Date(`${line.slice(0, 10)}T${line.slice(11, 16)}:00`);
    return t < start || t >= end;
  });

  const merged = [...otherLines, ...editedLines]
    .filter(Boolean)
    .sort((a, b) => a.slice(0, 16).localeCompare(b.slice(0, 16)));

  const value = trimNewLine(merged.join('\n'));
  await setItem(LOG_DATA_KEY, value);
  localStorage.removeItem('log_buffer');
  localStorage.removeItem('log_buffer_date');
  bc.postMessage({ key: LOG_DATA_KEY, value });
}

/**
 * Code executed when form loading is complete
 */
document.addEventListener('DOMContentLoaded', async () => {
  await runMigrations();

  // Initialize date input: restore the last edited date, falling back to roll-over today.
  const rollOverForDate = (await getItem(DATE_ROLL_OVER_TIME_KEY)) ?? '05:00';
  const todayStr = getTodayString();
  const lastDate = await getItem(LAST_EDITED_DATE_KEY);
  const initialDate =
    lastDate && lastDate <= todayStr
      ? lastDate
      : getDateWithRollOver(rollOverForDate);

  const dateInput = $$one('#target-date');
  dateInput.max = todayStr;
  dateInput.value = initialDate;
  await setItem(LAST_EDITED_DATE_KEY, initialDate);

  dateInput.addEventListener('change', async () => {
    await setItem(LAST_EDITED_DATE_KEY, dateInput.value);
    await flushBuffer(); // commit buffer for the outgoing date before switching
    await loadLogs();
  });

  $$disableConsole();

  // Set the theme automatically
  autoSetTheme();

  Multilingualization.translateAll();

  // Get the version number from manifest.json.
  fetch('/manifest.json')
    .then((response) => response.json())
    .then((manifest) => {
      $$one('#version_number').textContent = manifest.version;
    });

  // When a preset tag is clicked
  for (const node of $$all('label[data-shortcut-key]')) {
    const key = `shortcut_${node.dataset.shortcutKey}`;
    const str = await getItem(key);
    if (str && str !== 'undefined') {
      node.textContent = str;
    } else {
      node.textContent = Multilingualization.translate(node.dataset.translate);
    }

    node.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!e.target.textContent) return;
      await appendLog(appendTime(e.target.textContent));
      await saveLogs();
    });
  }

  // Dynamic update of placeholders
  $$one('input[placeholder]').placeholder =
    Multilingualization.translate('input_placeholder');
  $$one('textarea[placeholder]').placeholder = Multilingualization.translate(
    'textarea_placeholder',
  );

  // When a key is entered into the PWA
  document.body.addEventListener('keydown', async (e) => {
    if (document.activeElement.value) return;

    // When a number key is pressed
    const matches = e.code.match(/Digit(\d)/);
    if (matches?.length === 2) {
      const inputDigit = matches[1];
      if (inputDigit === '0') {
        // When 0 is pressed, focus on the input field
        e.preventDefault();
        e.stopPropagation();
        $$one('input[type="text"]').focus();
        $$one('input[type="text"]').value = '';
      } else {
        // For 1-9, stamp the preset tag
        const node = $$one(`label[data-shortcut-key='${inputDigit}']`);
        await appendLog(appendTime(node.textContent));
      }
    }
  });

  /**
   * Processes the input from a given element, appends it to a log with a timestamp, and clears the input.
   *
   * @async
   * @function processInput
   * @param {HTMLInputElement} elem - The input element to process.
   * @returns {Promise<void>} A promise that resolves when the input has been processed and logged.
   * @throws {Error} If appendLog or appendTime functions fail.
   *
   * @example
   * // Assuming we have an input element with id 'myInput'
   * const inputElem = document.getElementById('myInput');
   * await processInput(inputElem);
   */
  async function processInput(elem) {
    const str = elem.value.trim();
    if (str.length === 0) return;
    await appendLog(appendTime(str));
    elem.value = '';
  }

  // When input to the 0th element is confirmed, stamp the entered log for PC
  $$one('input[type="text"]').addEventListener('keydown', async (e) => {
    // Ignore events processed by IME
    if (!e.isComposing && e.keyCode !== 229 && e.key === 'Enter') {
      processInput(e.target);
    }
  });
  // When input to the 0th element is confirmed, stamp the entered log for Android
  $$one('input[type="text"]').addEventListener('blur', async (e) => {
    processInput(e.target);
  });

  // Save when Enter key is pressed in textarea
  $$one('textarea').addEventListener('keydown', async (e) => {
    if ('Enter' === e.code) {
      // Ignore events processed by IME
      if (!e.isComposing && e.keyCode !== 229 && e.key === 'Enter') {
        return;
      }
      await saveLogs();
    }
  });

  let debounceTimeout;
  $$one('textarea').addEventListener('input', async (e) => {
    // Set to dirty state when IME conversion is confirmed
    if (e.isComposing && e.inputType === 'insertCompositionText') {
      $$one('.navbar-save-status').classList.remove('saved');
    } else if (e.inputType !== 'insertLineBreak') {
      $$one('.navbar-save-status').classList.remove('saved');
    }

    // 300 milliseconds debounce time
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(async () => {
      await saveLogs();
    }, 300);
  });

  // Save the log when the input in the textarea is confirmed
  $$one('textarea').addEventListener('compositionend', async () => {
    clearTimeout(debounceTimeout);
    await saveLogs();
  });

  // When the popup loses focus, save the content of textarea
  [$$one('input[type="text"]'), window].forEach((node) => {
    node.addEventListener('blur', async () => {
      await saveLogs();
    });
  });

  // Add click event listener to the toggle button
  $$one('.navbar-toggler').addEventListener('click', (event) => {
    event.preventDefault(); // Prevent default event
    event.stopPropagation(); // Stop event propagation

    // Save the content of textarea
    (async () => {
      await saveLogs();
    })();

    // Toggle visibility of navbar content
    const navbarContent = $$one('.navbar-collapse');
    if (navbarContent) {
      navbarContent.classList.toggle('show');
    }
  });

  // Cross-tab synchronization: flush own buffer then reload when another tab commits
  bc.addEventListener('message', async (event) => {
    const key = event.data?.key;
    if (key === LOG_DATA_KEY) {
      await flushBuffer();
      await loadLogs();
    } else if (key === DATE_ROLL_OVER_TIME_KEY) {
      await flushBuffer();
      $$one('#target-date').value = getDateWithRollOver(event.data.value);
      await loadLogs();
    }
  });

  // When view_formatted_log link is pressed, display the current date's log in a new tab
  $$one('a#view_formatted_log').addEventListener('click', async () => {
    const log = $$one('textarea').value;
    let mins = await getItem(ROUNDING_UNIT_MINUTE_KEY);
    if (!mins) {
      mins = 1;
      await setItem(ROUNDING_UNIT_MINUTE_KEY, String(mins));
    }
    const outputStr = generateFormattedLog(log, mins);
    const blob = new Blob([outputStr], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_log_viewer');
  });

  // When download_formatted_log link is pressed, download the current date's log
  $$one('a#download_formatted_log').addEventListener('click', async () => {
    await downloadLog($$one('textarea').value);
  });

  // When delete_log link is pressed, delete the log
  $$one('a#delete_log').addEventListener('click', async () => {
    // 削除確認モーダルを表示
    if (typeof bootstrap !== 'undefined') {
      const deleteConfirmModal = new bootstrap.Modal(
        $$one('#deleteConfirmModal'),
      );
      deleteConfirmModal.show();
    } else {
      console.error('Bootstrap library is not loaded');
    }
  });

  $$one('#confirmDeleteButton').addEventListener('click', async () => {
    const textarea = $$one('textarea');
    textarea.value = '';
    saveLogs(); // write empty buffer for current date
    await flushBuffer(); // commit deletion to IndexedDB immediately

    // モーダルを閉じる
    if (typeof bootstrap !== 'undefined') {
      const deleteConfirmModal = bootstrap.Modal.getInstance(
        $$one('#deleteConfirmModal'),
      );
      if (deleteConfirmModal) {
        deleteConfirmModal.hide();
      }
    }

    // ナビゲーションバーのコンテンツの表示を切り替える
    $$one('.navbar-toggler').click();

    setTimeout(() => {
      textarea.focus();
    }, 500);
  });

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
  }

  // Commit the buffer to IndexedDB whenever the page is hidden (tab switch, minimize, close).
  // This ensures data reaches IndexedDB even without an explicit date change or navigation.
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'hidden') {
      saveLogs(); // capture the very latest textarea state before suspending
      await flushBuffer();
    }
  });

  // Recover any unsaved buffer left by a previous session (e.g. after navigating to config.html)
  await flushBuffer();

  // Load the log entries for the date initialized above
  await loadLogs();

  // When install_pwa is pressed, install the PWA
  installPWA($$one('#install_pwa'));
});
