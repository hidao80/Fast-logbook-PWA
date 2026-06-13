import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Drawer } from './components/Drawer';
import { Modal } from './components/Modal';
import { downloadLog, generateFormattedLog } from './lib/download';
import { getItem, migrateFromLocalStorage, setItem } from './lib/storage';
import {
  appendTime,
  autoSetTheme,
  getTodayString,
  LOG_DATA_KEY,
  ROUNDING_UNIT_MINUTE_KEY,
  trimNewLine,
} from './lib/utils';

const DATE_ROLL_OVER_TIME_KEY = 'date-roll-over-time';
const LAST_EDITED_DATE_KEY = 'last_edited_date';
const MIGRATION_VERSION_KEY = 'migration_version';
const NOTICE_DATE_SELECTOR_KEY = 'notice_date_selector';

function getDateBoundaries(
  selectedDate: string,
  rollOver: string,
): { start: Date; end: Date } {
  const start = new Date(`${selectedDate}T${rollOver}:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export default function App() {
  const { t } = useTranslation();

  const [isDirty, setIsDirty] = useState(false);
  const [version, setVersion] = useState('');
  const [shortcuts, setShortcuts] = useState<string[]>(Array(9).fill(''));
  const [targetDate, setTargetDate] = useState('');
  const [installBtnVisible, setInstallBtnVisible] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDateNoticeModalOpen, setIsDateNoticeModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const initialized = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const targetDateRef = useRef('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const logViewerRef = useRef<Window | null>(null);

  const getDateWithRollOver = useCallback(
    async (rollOver: string): Promise<string> => {
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
    },
    [],
  );

  const loadLogs = useCallback(async (date?: string) => {
    const allLog = await getItem(LOG_DATA_KEY);
    const ta = textareaRef.current;
    if (!ta) return;

    if (!allLog || allLog === 'undefined') {
      ta.value = '';
      return;
    }

    const rollOver = (await getItem(DATE_ROLL_OVER_TIME_KEY)) ?? '05:00';
    const selectedDate = date ?? targetDateRef.current;
    if (!selectedDate) {
      ta.value = '';
      return;
    }
    const { start, end } = getDateBoundaries(selectedDate, rollOver);

    const filtered = allLog
      .split('\n')
      .filter((line) => {
        if (line.length < 16) return false;
        const t = new Date(`${line.slice(0, 10)}T${line.slice(11, 16)}:00`);
        return t >= start && t < end;
      })
      .join('\n');

    ta.value = filtered;
    ta.scrollTo(0, ta.scrollHeight);
  }, []);

  const saveLogs = useCallback(() => {
    if (!initialized.current) return;
    try {
      localStorage.setItem(
        'log_buffer',
        trimNewLine(textareaRef.current?.value ?? ''),
      );
      localStorage.setItem('log_buffer_date', targetDateRef.current);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        alert('ストレージ容量が不足しています');
      }
    }
    setIsDirty(false);
  }, []);

  const flushBuffer = useCallback(async () => {
    const buffer = localStorage.getItem('log_buffer');
    const bufferDate = localStorage.getItem('log_buffer_date');
    if (buffer === null || !bufferDate) return;

    const rollOver = (await getItem(DATE_ROLL_OVER_TIME_KEY)) ?? '05:00';
    const { start, end } = getDateBoundaries(bufferDate, rollOver);

    const allLog = (await getItem(LOG_DATA_KEY)) ?? '';
    const editedLines = trimNewLine(buffer).split('\n').filter(Boolean);

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
    bcRef.current?.postMessage({ key: LOG_DATA_KEY, value });
  }, []);

  const appendLog = useCallback((tag: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.value = trimNewLine(`${ta.value}\n${tag}`);
    ta.scrollTo(0, ta.scrollHeight);
  }, []);

  const runMigrations = useCallback(async () => {
    const stored = await getItem(MIGRATION_VERSION_KEY);
    const parsedVersion = Number(stored);
    const version =
      Number.isFinite(parsedVersion) && parsedVersion >= 0 ? parsedVersion : 0;

    if (version < 1) {
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

      const oldRollOver = localStorage.getItem('date-roll-over-time-value');
      if (oldRollOver && !(await getItem(DATE_ROLL_OVER_TIME_KEY))) {
        await setItem(DATE_ROLL_OVER_TIME_KEY, oldRollOver);
      }
      localStorage.removeItem('date-roll-over-time-value');
      localStorage.removeItem('downloadUrl');
      localStorage.removeItem('downloadFilename');

      await setItem(MIGRATION_VERSION_KEY, '1');
    }
  }, []);

  useEffect(() => {
    autoSetTheme();

    const bc = new BroadcastChannel('fast-logbook-sync');
    bcRef.current = bc;

    (async () => {
      await runMigrations();

      const noticeShown = await getItem(NOTICE_DATE_SELECTOR_KEY);
      if (!noticeShown) {
        const existingLog = await getItem(LOG_DATA_KEY);
        if (existingLog && existingLog !== 'undefined' && existingLog.trim()) {
          setIsDateNoticeModalOpen(true);
        }
      }

      const rollOver = (await getItem(DATE_ROLL_OVER_TIME_KEY)) ?? '05:00';
      const todayStr = getTodayString();
      const lastDate = await getItem(LAST_EDITED_DATE_KEY);
      const initialDate =
        lastDate && lastDate <= todayStr
          ? lastDate
          : await getDateWithRollOver(rollOver);

      targetDateRef.current = initialDate;
      setTargetDate(initialDate);
      await setItem(LAST_EDITED_DATE_KEY, initialDate);

      const loaded = await Promise.all(
        Array.from({ length: 9 }, (_, i) => getItem(`shortcut_${i + 1}`)),
      );
      setShortcuts(loaded.map((s) => (s && s !== 'undefined' ? s : '')));

      fetch('/manifest.json')
        .then((r) => r.json())
        .then((m: { version: string }) => setVersion(m.version));

      await flushBuffer();
      await loadLogs(initialDate);

      initialized.current = true;
    })();

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setInstallBtnVisible(true);
    });

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js');
    }

    const handleVisibility = async () => {
      if (document.visibilityState === 'hidden') {
        saveLogs();
        await flushBuffer();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    bc.addEventListener(
      'message',
      async (event: MessageEvent<{ key: string; value: string }>) => {
        const key = event.data?.key;
        if (key === LOG_DATA_KEY) {
          await flushBuffer();
          await loadLogs();
        } else if (key === DATE_ROLL_OVER_TIME_KEY) {
          await flushBuffer();
          const newDate = await getDateWithRollOver(event.data.value);
          targetDateRef.current = newDate;
          setTargetDate(newDate);
          await loadLogs(newDate);
        }
      },
    );

    return () => {
      bc.close();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [runMigrations, getDateWithRollOver, flushBuffer, loadLogs, saveLogs]);

  useEffect(() => {
    const handleKeydown = async (e: KeyboardEvent) => {
      if (
        (document.activeElement as HTMLElement)?.tagName === 'INPUT' ||
        (document.activeElement as HTMLElement)?.tagName === 'TEXTAREA'
      )
        return;

      const matches = e.code.match(/Digit(\d)/);
      if (matches?.length === 2) {
        const inputDigit = matches[1];
        if (inputDigit === '0') {
          e.preventDefault();
          e.stopPropagation();
          document
            .querySelector<HTMLInputElement>('input[type="text"]')
            ?.focus();
        } else {
          const idx = parseInt(inputDigit, 10) - 1;
          const text = shortcuts[idx];
          if (text) appendLog(appendTime(text));
        }
      }
    };
    document.body.addEventListener('keydown', handleKeydown);
    return () => document.body.removeEventListener('keydown', handleKeydown);
  }, [shortcuts, appendLog]);

  const handleDateChange = async (newDate: string) => {
    targetDateRef.current = newDate;
    setTargetDate(newDate);
    await setItem(LAST_EDITED_DATE_KEY, newDate);
    await flushBuffer();
    await loadLogs(newDate);
  };

  const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const nativeEvent = e.nativeEvent as InputEvent;
    if (
      nativeEvent.isComposing &&
      nativeEvent.inputType === 'insertCompositionText'
    ) {
      setIsDirty(true);
    } else if (nativeEvent.inputType !== 'insertLineBreak') {
      setIsDirty(true);
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveLogs();
    }, 300);
  };

  const handleTextareaKeydown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (e.code === 'Enter') {
      if (
        !e.nativeEvent.isComposing &&
        e.nativeEvent.keyCode !== 229 &&
        e.key === 'Enter'
      ) {
        return;
      }
      saveLogs();
    }
  };

  const handleTextareaCompositionEnd = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    saveLogs();
  };

  const handleInputKeydown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      !e.nativeEvent.isComposing &&
      e.nativeEvent.keyCode !== 229 &&
      e.key === 'Enter'
    ) {
      processInput(e.currentTarget);
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    processInput(e.currentTarget);
  };

  function processInput(elem: HTMLInputElement) {
    const str = elem.value.trim();
    if (!str) return;
    appendLog(appendTime(str));
    elem.value = '';
  }

  const handleViewLog = async () => {
    // Open window synchronously (before any await) to avoid popup blocker
    if (!logViewerRef.current || logViewerRef.current.closed) {
      logViewerRef.current = window.open('', '_log_viewer');
    }
    const viewer = logViewerRef.current;
    if (!viewer) return;
    viewer.focus();

    const log = textareaRef.current?.value ?? '';
    let mins = await getItem(ROUNDING_UNIT_MINUTE_KEY);
    if (!mins) {
      await setItem(ROUNDING_UNIT_MINUTE_KEY, '1');
      mins = '1';
    }
    const outputStr = generateFormattedLog(log, Number(mins));
    // User content is escaped via escapeHtml() inside generateFormattedLog — project security.md permits this pattern
    viewer.document.open();
    viewer.document.write(outputStr);
    viewer.document.close();
  };

  const handleDownloadLog = async () => {
    await downloadLog(textareaRef.current?.value ?? null);
  };

  const handleConfirmDelete = async () => {
    const ta = textareaRef.current;
    if (ta) ta.value = '';
    saveLogs();
    await flushBuffer();
    setIsDeleteModalOpen(false);
    setTimeout(() => textareaRef.current?.focus(), 500);
  };

  const handleDateNoticeOk = async () => {
    await setItem(NOTICE_DATE_SELECTOR_KEY, '1');
    setIsDateNoticeModalOpen(false);
  };

  const handleInstallPWA = async () => {
    if (!deferredPromptRef.current) return;
    await deferredPromptRef.current.prompt();
    await deferredPromptRef.current.userChoice;
    deferredPromptRef.current = null;
    setInstallBtnVisible(false);
  };

  return (
    <>
      <nav className="navbar navbar-dark bg-dark navbar-overlay">
        <div className="container-fluid">
          <button
            className="navbar-toggler"
            type="button"
            onClick={() => setIsSideMenuOpen(true)}
            aria-label="Open menu"
            style={{ display: 'block' }}
          >
            <span className="navbar-toggler-icon" />
          </button>
          <span
            className={`navbar-save-status${isDirty ? '' : ' saved'}`}
            aria-hidden="true"
            title={isDirty ? 'Save status: unsaved' : 'Save status: saved'}
          >
            ●
          </span>
          <span className="navbar-brand">{t('popup_title')}</span>
          <button
            type="button"
            className="btn btn-link text-white"
            onClick={() => setIsHelpModalOpen(true)}
          >
            <i className="bi bi-question-circle" /> <span>{t('help')}</span>
          </button>
        </div>
      </nav>

      <Drawer
        isOpen={isSideMenuOpen}
        onClose={() => setIsSideMenuOpen(false)}
        title={t('popup_title')}
      >
        <div className="d-flex flex-column h-100">
          <button
            type="button"
            className="btn btn-outline-secondary mb-2"
            onClick={() => {
              setIsSideMenuOpen(false);
              handleViewLog();
            }}
          >
            {t('view_formatted_log')}
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary mb-2"
            onClick={() => {
              setIsSideMenuOpen(false);
              handleDownloadLog();
            }}
          >
            {t('download_formatted_log')}
          </button>
          <Link className="btn btn-outline-success mb-2" to="/config">
            {t('configure')}
          </Link>
          <button
            type="button"
            className="btn btn-danger mt-auto"
            onClick={() => {
              setIsSideMenuOpen(false);
              setIsDeleteModalOpen(true);
            }}
          >
            {t('delete_log')}
          </button>
          <span className="outline-dark mt-3">
            ver. <span>{version}</span>
          </span>
          <button
            type="button"
            className="btn btn-outline-info mt-3"
            onClick={handleInstallPWA}
            disabled={!installBtnVisible}
          >
            {t('install_pwa')}
          </button>
        </div>
      </Drawer>

      {/* Main content */}
      <div className="content-wrapper">
        <div className="d-flex justify-content-end align-items-center px-2 pt-1">
          <label htmlFor="target-date" className="me-2 mb-0">
            {t('target_day')}
          </label>
          <input
            id="target-date"
            type="date"
            required
            value={targetDate}
            max={getTodayString()}
            onChange={(e) => handleDateChange(e.target.value)}
          />
        </div>

        <div className="container-fluid shortcut-area">
          <div className="row">
            <div className="col-12 col-md-6">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="input-group input-group-sm pt-2">
                  <span className="input-group-text">{n}</span>
                  <button
                    type="button"
                    className="form-control text-start"
                    onClick={() => {
                      const text = shortcuts[n - 1];
                      if (text) appendLog(appendTime(text));
                    }}
                  >
                    {shortcuts[n - 1]}
                  </button>
                </div>
              ))}
            </div>
            <div className="col-12 col-md-6">
              {[6, 7, 8, 9].map((n) => (
                <div key={n} className="input-group input-group-sm pt-2">
                  <span className="input-group-text">{n}</span>
                  <button
                    type="button"
                    className="form-control text-start"
                    onClick={() => {
                      const text = shortcuts[n - 1];
                      if (text) appendLog(appendTime(text));
                    }}
                  >
                    {shortcuts[n - 1]}
                  </button>
                </div>
              ))}
              <div className="input-group input-group-sm pt-2">
                <span className="input-group-text">0</span>
                <input
                  type="text"
                  className="form-control"
                  placeholder=""
                  onKeyDown={handleInputKeydown}
                  onBlur={handleInputBlur}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="textarea-container pt-2">
          <textarea
            ref={textareaRef}
            className="form-control"
            placeholder={t('textarea_placeholder')}
            onInput={handleTextareaInput}
            onKeyDown={handleTextareaKeydown}
            onCompositionEnd={handleTextareaCompositionEnd}
            onBlur={() => saveLogs()}
          />
        </div>
      </div>

      {/* Delete confirm modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={t('delete_log_confirm_title')}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleConfirmDelete}
            >
              {t('delete')}
            </button>
          </>
        }
      >
        {t('delete_log_confirm_message')}
      </Modal>

      {/* Date selector feature notice modal */}
      <Modal
        isOpen={isDateNoticeModalOpen}
        title={t('notice_date_selector_title')}
        footer={
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleDateNoticeOk}
          >
            {t('date_selector_feature_notice_ok')}
          </button>
        }
      >
        <div
          dangerouslySetInnerHTML={{
            __html: t('notice_date_selector_content'),
          }}
        />
      </Modal>

      {/* Help modal */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </>
  );
}

function HelpModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'home' | 'config' | 'changelog'>(
    'home',
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('help_title')}
      fullscreen
      footer={
        <button type="button" className="btn btn-primary" onClick={onClose}>
          {t('help_close_button')}
        </button>
      }
    >
      <div className="container-fluid">
        <div className="row">
          <div className="col-lg-8 mx-auto">
            <nav>
              <div className="nav nav-tabs mb-4" role="tablist">
                <button
                  className={`nav-link${activeTab === 'home' ? ' active' : ''}`}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'home'}
                  onClick={() => setActiveTab('home')}
                >
                  {t('help_tab_main_screeen')}
                </button>
                <button
                  className={`nav-link${activeTab === 'config' ? ' active' : ''}`}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'config'}
                  onClick={() => setActiveTab('config')}
                >
                  {t('help_tab_config_screen')}
                </button>
                <button
                  className={`nav-link${activeTab === 'changelog' ? ' active' : ''}`}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'changelog'}
                  onClick={() => setActiveTab('changelog')}
                >
                  {t('help_tab_changelog')}
                </button>
              </div>
            </nav>
            <div className="tab-content">
              {activeTab === 'home' && (
                <div role="tabpanel">
                  <section className="mb-4">
                    <h2 className="h3">{t('help_overview_title')}</h2>
                    <p>{t('help_overview_content')}</p>
                  </section>
                  <section className="mb-4">
                    <h2 className="h3">{t('help_basic_operations_title')}</h2>
                    <h3 className="h4">{t('help_main_screen_title')}</h3>
                    <ol>
                      <li
                        dangerouslySetInnerHTML={{
                          __html: t('help_main_screen_memo'),
                        }}
                      />
                      <li
                        dangerouslySetInnerHTML={{
                          __html: t('help_main_screen_shortcut'),
                        }}
                      />
                      <li
                        dangerouslySetInnerHTML={{
                          __html: t('help_main_screen_save_status'),
                        }}
                      />
                    </ol>
                  </section>
                  <section className="mb-4">
                    <h3 className="h4">
                      {t('help_main_screen_menu_operations_title')}
                    </h3>
                    <p>{t('help_main_screen_menu_operations_content')}</p>
                    <ul>
                      <li
                        dangerouslySetInnerHTML={{
                          __html: t('help_main_screen_show_formated_log'),
                        }}
                      />
                      <li
                        dangerouslySetInnerHTML={{
                          __html: t('help_main_screen_download_formated_log'),
                        }}
                      />
                      <li
                        dangerouslySetInnerHTML={{
                          __html: t('help_main_screen_config'),
                        }}
                      />
                      <li
                        dangerouslySetInnerHTML={{
                          __html: t('help_main_screen_delete_log'),
                        }}
                      />
                      <li
                        dangerouslySetInnerHTML={{
                          __html: t('help_main_screen_install_pwd'),
                        }}
                      />
                    </ul>
                  </section>
                  <section className="mb-4">
                    <h2 className="h3">
                      {t('help_main_screen_date_input_title')}
                    </h2>
                    <p>{t('help_main_screen_date_input_content')}</p>
                  </section>
                  <section className="mb-4">
                    <h2 className="h3">
                      {t('help_main_screen_shortcut_settings_title')}
                    </h2>
                    <p>{t('help_main_screen_shortcut_settings_content')}</p>
                  </section>
                  <section className="mb-4">
                    <h2 className="h3">
                      {t('help_main_screen_example_of_summary_format')}
                    </h2>
                    <p
                      dangerouslySetInnerHTML={{
                        __html: t('help_main_screen_example_1'),
                      }}
                    />
                    <ul>
                      <li
                        dangerouslySetInnerHTML={{
                          __html: t('help_main_screen_example_2'),
                        }}
                      />
                      <li
                        dangerouslySetInnerHTML={{
                          __html: t('help_main_screen_example_3'),
                        }}
                      />
                    </ul>
                    {[
                      {
                        title: 'help_main_screen_example_4',
                        code: 'help_main_screen_example_5',
                        note: 'help_main_screen_example_6',
                      },
                      {
                        title: 'help_main_screen_example_of_project',
                        code: 'help_main_screen_example_7',
                        note: 'help_main_screen_example_8',
                      },
                      {
                        title:
                          'help_main_screen_example_of_customer_summary_format',
                        code: 'help_main_screen_example_9',
                        note: 'help_main_screen_example_10',
                      },
                      {
                        title:
                          'help_main_screen_example_of_summary_format_by_task_type',
                        code: 'help_main_screen_example_11',
                        note: 'help_main_screen_example_12',
                      },
                      {
                        title:
                          'help_main_screen_example_of_summary_format_with_case_number',
                        code: 'help_main_screen_example_13',
                        note: 'help_main_screen_example_14',
                      },
                      {
                        title:
                          'help_main_screen_example_of_combined_tabulation_format',
                        code: 'help_main_screen_example_15',
                        note: 'help_main_screen_example_16',
                      },
                    ].map(({ title, code, note }) => (
                      <div key={title} className="card mb-3">
                        <div className="card-body">
                          <h4 className="h5 card-title">{t(title)}</h4>
                          <pre className="bg-light p-2 rounded">
                            <code>{t(code)}</code>
                          </pre>
                          <p className="text-muted mt-2">{t(note)}</p>
                        </div>
                      </div>
                    ))}
                    <p
                      className="alert alert-info"
                      dangerouslySetInnerHTML={{
                        __html: t('help_main_screen_hint'),
                      }}
                    />
                  </section>
                  <section className="mb-4">
                    <h2 className="h3">
                      {t('help_main_screen_delete_log_title')}
                    </h2>
                    <p
                      dangerouslySetInnerHTML={{
                        __html: t('help_main_screen_delete_log_content'),
                      }}
                    />
                  </section>
                  <section className="mb-4">
                    <h2 className="h3">
                      {t('help_main_screen_offline_features_title')}
                    </h2>
                    <p>{t('help_main_screen_offline_features_content')}</p>
                  </section>
                  <section className="mb-4">
                    <h2 className="h3">
                      {t('help_main_screen_version_info_title')}
                    </h2>
                    <p>{t('help_main_screen_version_info_content')}</p>
                  </section>
                </div>
              )}

              {activeTab === 'config' && (
                <div role="tabpanel">
                  <section className="mb-4">
                    <h2 className="h3">{t('help_config_screen_title')}</h2>
                    <p>{t('help_config_screen_customizable_behavior')}</p>
                  </section>
                  <section className="mb-4">
                    <h3 className="h4">
                      {t('help_config_screen_setting_time_rounding_unit')}
                    </h3>
                    <p>
                      {t(
                        'help_config_screen_choice_available_timestamp_rounding',
                      )}
                    </p>
                    <ul>
                      {[
                        'help_config_screen_example_1',
                        'help_config_screen_example_2',
                        'help_config_screen_example_3',
                        'help_config_screen_example_4',
                        'help_config_screen_example_5',
                        'help_config_screen_example_6',
                      ].map((k) => (
                        <li
                          key={k}
                          dangerouslySetInnerHTML={{ __html: t(k) }}
                        />
                      ))}
                    </ul>
                    <p>{t('help_config_screen_log_readability_balance')}</p>
                  </section>
                  <section className="mb-4">
                    <h3 className="h4">
                      {t('help_config_screen_setting_shortcut')}
                    </h3>
                    <p>{t('help_config_screen_shortcut_key_text')}</p>
                    <p>{t('help_config_screen_example_7')}</p>
                    <ul>
                      {[
                        'help_config_screen_example_8',
                        'help_config_screen_example_9',
                        'help_config_screen_example_10',
                        'help_config_screen_example_11',
                      ].map((k) => (
                        <li key={k}>{t(k)}</li>
                      ))}
                    </ul>
                    <p>
                      {t(
                        'help_config_screen_repeated_input_one_touch_recording',
                      )}
                    </p>
                    <div
                      className="alert alert-info"
                      role="alert"
                      dangerouslySetInnerHTML={{
                        __html: t('help_config_screen_hint'),
                      }}
                    />
                  </section>
                  <section className="mb-4">
                    <h3 className="h4">
                      {t('help_config_screen_date_roll_over_title')}
                    </h3>
                    <p>{t('help_config_screen_date_roll_over_content')}</p>
                  </section>
                  <section className="mb-4">
                    <h3 className="h4">
                      {t('help_config_screen_save_setting')}
                    </h3>
                    <p>{t('help_config_screen_auto_save')}</p>
                  </section>
                </div>
              )}

              {activeTab === 'changelog' && (
                <div role="tabpanel">
                  <section className="mb-4">
                    <h2 className="h3">{t('help_changelog_title')}</h2>
                    <div
                      dangerouslySetInnerHTML={{ __html: t('help_changelog') }}
                    />
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
