import { $$one, $$all, $$disableConsole } from "./lib/indolence.min.js";
import { LOG_DATA_KEY, ROUNDING_UNIT_MINUTE_KEY, trimNewLine, appendTime, installPWA, autoSetTheme } from "./lib/utils.js";
import Multilingualization from "./lib/multilingualization.js";
import { downloadLog, generateFormattedLog } from "./lib/download.js";

/**
 * Add one log entry
 *
 * @param {*} tag A single log entry without timestamp
 * @return {Promise}
 */
export function appendLog(tag) {
    const textarea = $$one('textarea');
    textarea.value += "\n" + tag;
    textarea.value = trimNewLine(textarea.value);

    // Always scroll to the bottom
    textarea.scrollTo(0, textarea.scrollHeight);
}

/**
 * Load work logs
 *
 * @return {Promise}
 */
async function loadLogs() {
    // A similar object is input instead of an empty string
    const str = localStorage.getItem(LOG_DATA_KEY);
    if (str && str != "undefined") {
        const textarea = $$one('textarea');
        textarea.value = str;

        // Always scroll to the bottom
        textarea.scrollTo(0, textarea.scrollHeight);
    }
}

/**
 * Save work logs
 *
 * @return {Promise}
 */
function saveLogs() {
    localStorage.setItem(LOG_DATA_KEY, trimNewLine($$one('textarea').value));
    $$one('.navbar-save-status').classList.toggle('saved', true);
}

/**
 * Code executed when form loading is complete
 */
document.addEventListener("DOMContentLoaded", async () => {
    $$disableConsole();

    // Set the theme automatically
    autoSetTheme();

    Multilingualization.translateAll();

    // Get the version number from manifest.json.
    fetch('/manifest.json')
        .then(response => response.json())
        .then(manifest => {
            $$one('#version_number').textContent = manifest.version;
        });

    // When a preset tag is clicked
    for (const node of $$all('label[data-shortcut-key]')) {
        const key = 'shortcut_' + node.dataset.shortcutKey;
        const str = localStorage.getItem(key);
        if (str && str !== "undefined") {
            node.textContent = str;
        } else {
            node.textContent = Multilingualization.translate(node.dataset.translate);
        }

        node.addEventListener('click', async function (e) {
            e.stopPropagation();
            if (document.activeElement.value) return;
            await appendLog(appendTime(this.textContent));
            await saveLogs();
        });
    }

    // Dynamic update of placeholders
    $$one('input[placeholder]').placeholder = Multilingualization.translate('input_placeholder');
    $$one('textarea[placeholder]').placeholder = Multilingualization.translate('textarea_placeholder');

    async function processInput(str) {
        if (str.length === 0) return;
        await appendLog(appendTime(str));
        this.value = '';
    }

    // When input to the 0th element is confirmed, stamp the entered log for PC
    $$one('input').addEventListener('keydown', async function (e) {
        // Ignore events processed by IME
        if ("Enter" === e.key && (e.keyCode === 229 || !e.isComposing)) {
            processInput(this.value.trim());
        }
    });
    // When input to the 0th element is confirmed, stamp the entered log for Android
    $$one('input').addEventListener('blur', async function (e) {
        processInput(this.value.trim());
    });

    // Save when Enter key is pressed in textarea
    $$one('textarea').addEventListener('keydown', async function (e) {
        if ("Enter" == e.code) {
            // Ignore events processed by IME
            if (e.isComposing || e.keyCode === 229) {
                return;
            }
            await saveLogs();
        }
    });

    let debounceTimeout;
    $$one('textarea').addEventListener('input', async function (e) {
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
    $$one('textarea').addEventListener('compositionend', async function () {
        clearTimeout(debounceTimeout);
        await saveLogs();
    });

    // When the popup loses focus, save the content of textarea
    [$$one('input'), window].forEach((node) => {
        node.addEventListener('blur', async function () {
            await saveLogs();
        });
    });

    // Add click event listener to the toggle button
    $$one('.navbar-toggler').addEventListener('click', function (event) {
        event.preventDefault();  // Prevent default event
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

    // When textarea content changes, synchronize
    window.addEventListener('storage', (event) => {
        if (event.key === LOG_DATA_KEY) {
            $$one('textarea').value = event.newValue;
        }
    });

    // When view_formatted_log link is pressed, display the content of downloadLog() in a new tab without downloading
    $$one('a#view_formatted_log').addEventListener('click', () => {
        const log = localStorage.getItem(LOG_DATA_KEY);
        let mins = localStorage.getItem(ROUNDING_UNIT_MINUTE_KEY);
        if (!mins) {
            // Set default value to 1 if not set
            mins = 1;
            localStorage.setItem(ROUNDING_UNIT_MINUTE_KEY, mins);
        }
        const outputStr = generateFormattedLog(log, mins);
        const newTab = window.open(Multilingualization.translate('log_viewer'), '_log_viewer');
        newTab.document.write(outputStr);
        newTab.document.close();
    });

    // When download_formatted_log link is pressed, download the content of downloadLog()
    $$one('a#download_formatted_log').addEventListener('click', async () => {
        await downloadLog();
    });

    // When delete_log link is pressed, delete the log
    $$one('a#delete_log').addEventListener('click', async () => {
        // 削除確認モーダルを表示
        const deleteConfirmModal = new bootstrap.Modal($$one('#deleteConfirmModal'));
        deleteConfirmModal.show();
    });

    $$one('#confirmDeleteButton').addEventListener('click', async () => {
        const textarea = $$one('textarea');
        textarea.value = '';
        await saveLogs();

        // モーダルを閉じる
        const deleteConfirmModal = bootstrap.Modal.getInstance($$one('#deleteConfirmModal'));
        deleteConfirmModal.hide();

        // ナビゲーションバーのコンテンツの表示を切り替える
        $$one('.navbar-toggler').click();

        setTimeout(() => {
            textarea.focus();
        }, 500);
    });

    // Register service worker
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("sw.js");
    }

    // Load the last saved log
    await loadLogs();

    // When install_pwa is pressed, install the PWA
    installPWA($$one("#install_pwa"));
});