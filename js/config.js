import { $$all, $$one } from './lib/indolence.min.js';
import Multilingualization from './lib/multilingualization.js';
import {
  autoSetTheme,
  getRoundingUnit,
  ROUNDING_UNIT_MINUTE_KEY,
} from './lib/utils.js';

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

  // Initialize tags
  $$all('input').forEach((node) => {
    const str = localStorage.getItem(node.dataset.translate);
    node.value =
      str && str !== 'undefined'
        ? str
        : Multilingualization.translate(node.dataset.translate);

    // Save the input when focus is removed or changed
    node.addEventListener('change', (e) => {
      try {
        localStorage.setItem(e.target.dataset.translate, e.target.value.trim());
      } catch (e) {
        if (e.name === 'QuotaExceededError') {
          alert('ストレージ容量が不足しています');
        }
      }
    });
  });

  // Initialize rounding unit
  const min = localStorage.getItem(ROUNDING_UNIT_MINUTE_KEY);
  $$one('select').value = getRoundingUnit(min);

  // Save the value when the rounding unit is changed
  $$one('select').addEventListener('change', (e) => {
    localStorage.setItem(ROUNDING_UNIT_MINUTE_KEY, e.target.value);
  });

  // Synchronize when the setting changes
  window.addEventListener('storage', (event) => {
    if (event.storageArea === localStorage) {
      const target =
        event.key === ROUNDING_UNIT_MINUTE_KEY
          ? $$one('select')
          : $$one(`[data-translate='${event.key}']`);
      if (target) {
        target.value = event.newValue;
      }
    }
  });
});
