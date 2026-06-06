import { $$all, $$one } from './lib/indolence.min.js';
import Multilingualization from './lib/multilingualization.js';
import { getItem, setItem } from './lib/storage.js';
import {
  autoSetTheme,
  getRoundingUnit,
  ROUNDING_UNIT_MINUTE_KEY,
} from './lib/utils.js';

// Cross-tab synchronization via BroadcastChannel
const bc = new BroadcastChannel('fast-logbook-sync');

/**
 * Code to be executed upon completion of form loading
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Set the theme automatically
  autoSetTheme();

  // Get the version number from manifest.json.
  fetch('/manifest.json')
    .then((response) => response.json())
    .then((manifest) => {
      $$one('#version_number').textContent = manifest.version;
    });

  // Initialize shortcut text inputs — scoped to [type="text"] to avoid double-processing
  // the time input, which is handled separately below.
  for (const node of $$all('input[type="text"][data-translate]')) {
    node.placeholder =
      Multilingualization.translate(node.dataset.translate) ?? '';
    const str = await getItem(node.dataset.translate);
    node.value = str && str !== 'undefined' ? str : '';

    // Save the input when focus is removed or changed
    node.addEventListener('change', async (e) => {
      try {
        const value = e.target.value.trim();
        await setItem(e.target.dataset.translate, value);
        bc.postMessage({ key: e.target.dataset.translate, value });
      } catch (e) {
        if (e.name === 'QuotaExceededError') {
          alert('ストレージ容量が不足しています');
        }
      }
    });
  }

  // Initialize rounding unit
  const min = await getItem(ROUNDING_UNIT_MINUTE_KEY);
  $$one('select').value = getRoundingUnit(min);

  // Save the value when the rounding unit is changed
  $$one('select').addEventListener('change', async (e) => {
    await setItem(ROUNDING_UNIT_MINUTE_KEY, e.target.value);
    bc.postMessage({ key: ROUNDING_UNIT_MINUTE_KEY, value: e.target.value });
  });

  // Initialize date roll-over time
  const targetDate = await getItem('date-roll-over-time');
  $$one('input[type="time"]').value = targetDate || '05:00';

  // Save the value when the date roll-over time is changed
  $$one('input[type="time"]').addEventListener('change', async (e) => {
    await setItem('date-roll-over-time', e.target.value);
    bc.postMessage({ key: 'date-roll-over-time', value: e.target.value });
  });

  // Cross-tab synchronization: reflect settings changes from other tabs
  bc.addEventListener('message', (event) => {
    const { key, value } = event.data ?? {};
    if (!key) return;
    const target =
      key === ROUNDING_UNIT_MINUTE_KEY
        ? $$one('select')
        : $$one(`[data-translate='${key}']`);
    if (target) target.value = value;
  });
});
