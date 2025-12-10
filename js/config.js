import { getRoundingUnit, ROUNDING_UNIT_MINUTE_KEY, autoSetTheme } from './lib/utils.js';
import Multilingualization from './lib/multilingualization.js';
import { $$one, $$all } from './lib/indolence.min.js';

/**
 * Code to be executed upon completion of form loading
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Set the theme automatically
  autoSetTheme();

  Multilingualization.translateAll();

  // Get the version number from manifest.json.
  fetch('/manifest.json')
    .then(response => response.json())
    .then(manifest => {
      $$one('#version_number').textContent = manifest.version;
    });

  // Initialize tags
  $$all('input').forEach(node => {
    const str = localStorage.getItem(node.dataset.translate);
    node.value = (str && str != 'undefined') ? str : Multilingualization.translate(node.dataset.translate);

    // Save the input when focus is removed or changed
    node.addEventListener('change', e => {
      localStorage.setItem(e.target.dataset.translate, e.target.value.trim());
    });
  });

  // Initialize rounding unit
  const min = localStorage.getItem(ROUNDING_UNIT_MINUTE_KEY);
  $$one('select').value = getRoundingUnit(min);

  // Save the value when the rounding unit is changed
  $$one('select').addEventListener('change', () => {
    localStorage.setItem(ROUNDING_UNIT_MINUTE_KEY, this.value);
  });

  // Synchronize when the setting changes
  window.addEventListener('storage', (event) => {
    const $ = bootstrap.$;
    if (event.storageArea === localStorage) {
      const target = event.key === ROUNDING_UNIT_MINUTE_KEY ? $('select') : $(`[data-translate='${event.key}']`);
      if (target) {
        target.value = event.newValue;
      }
    }
  });
});
