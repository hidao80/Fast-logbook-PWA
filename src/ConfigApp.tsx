import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Drawer } from './components/Drawer';
import { getItem, setItem } from './lib/storage';
import {
  autoSetTheme,
  getRoundingUnit,
  ROUNDING_UNIT_MINUTE_KEY,
} from './lib/utils';

const DATE_ROLL_OVER_TIME_KEY = 'date-roll-over-time';

/**
 * Settings page component. Manages rounding unit, shortcut strings,
 * and date roll-over time, syncing changes across tabs via BroadcastChannel.
 *
 * @returns the configuration UI
 */
export default function ConfigApp() {
  const { t } = useTranslation();

  const [version, setVersion] = useState('');
  const [shortcuts, setShortcuts] = useState<string[]>(Array(9).fill(''));
  const [roundingUnit, setRoundingUnit] = useState<number>(1);
  const [rollOverTime, setRollOverTime] = useState('05:00');
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);

  const bcRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    autoSetTheme();
    const bc = new BroadcastChannel('fast-logbook-sync');
    bcRef.current = bc;

    (async () => {
      fetch('/manifest.json')
        .then((r) => r.json())
        .then((m: { version: string }) => setVersion(m.version));

      const loaded = await Promise.all(
        Array.from({ length: 9 }, (_, i) => getItem(`shortcut_${i + 1}`)),
      );
      setShortcuts(loaded.map((s) => (s && s !== 'undefined' ? s : '')));

      const min = await getItem(ROUNDING_UNIT_MINUTE_KEY);
      setRoundingUnit(getRoundingUnit(min));

      const rollOver = await getItem(DATE_ROLL_OVER_TIME_KEY);
      setRollOverTime(
        rollOver && rollOver !== 'undefined' ? rollOver : '05:00',
      );
    })();

    bc.addEventListener(
      'message',
      (event: MessageEvent<{ key: string; value: string }>) => {
        const { key, value } = event.data ?? {};
        if (!key || !value) return;
        if (key === ROUNDING_UNIT_MINUTE_KEY) {
          setRoundingUnit(getRoundingUnit(value));
        } else if (key === DATE_ROLL_OVER_TIME_KEY) {
          setRollOverTime(value);
        } else if (key.startsWith('shortcut_')) {
          const idx = parseInt(key.replace('shortcut_', ''), 10) - 1;
          if (idx >= 0 && idx < 9) {
            setShortcuts((prev) => {
              const next = [...prev];
              next[idx] = value;
              return next;
            });
          }
        }
      },
    );

    return () => {
      bc.close();
    };
  }, []);

  const handleShortcutChange = async (
    idx: number,
    value: string,
    isComposing: boolean,
  ) => {
    setShortcuts((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });

    if (isComposing) return;

    const key = `shortcut_${idx + 1}`;
    try {
      await setItem(key, value.trim());
      bcRef.current?.postMessage({ key, value: value.trim() });
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        alert(t('storage_quota_exceeded'));
      }
    }
  };

  const handleRoundingChange = async (value: string) => {
    const n = getRoundingUnit(value);
    try {
      await setItem(ROUNDING_UNIT_MINUTE_KEY, String(n));
      setRoundingUnit(n);
      bcRef.current?.postMessage({
        key: ROUNDING_UNIT_MINUTE_KEY,
        value: String(n),
      });
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        alert(t('storage_quota_exceeded'));
      }
    }
  };

  const handleRollOverChange = async (value: string) => {
    try {
      await setItem(DATE_ROLL_OVER_TIME_KEY, value);
      setRollOverTime(value);
      bcRef.current?.postMessage({ key: DATE_ROLL_OVER_TIME_KEY, value });
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        alert(t('storage_quota_exceeded'));
      }
    }
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
          <span className="navbar-brand">{t('config_title')}</span>
        </div>
      </nav>

      <Drawer
        isOpen={isSideMenuOpen}
        onClose={() => setIsSideMenuOpen(false)}
        title={t('config_title')}
      >
        <div className="d-flex flex-column h-100">
          <Link to="/" className="btn btn-outline-success mb-2">
            {t('back')}
          </Link>
          <span className="outline-dark mb-2 mt-auto">ver. {version}</span>
        </div>
      </Drawer>

      <div className="container">
        <div className="row pt-5">
          <h5>{t('rounding_unit')}</h5>
          <select
            className="form-select"
            value={roundingUnit}
            onChange={(e) => handleRoundingChange(e.target.value)}
          >
            {([1, 5, 10, 15, 30, 60] as const).map((n) => (
              <option key={n} value={n}>
                {t(`${n}min`)}
              </option>
            ))}
          </select>
        </div>

        <div className="row pt-5">
          <h5>{t('shortcut_items_title')}</h5>
          {shortcuts.map((val, idx) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: shortcuts are position-keyed (9 fixed slots)
            <div key={idx} className="input-group mb-3">
              <span className="input-group-text">{idx + 1}</span>
              <input
                type="text"
                className="form-control"
                placeholder={t(`shortcut_${idx + 1}`)}
                value={val}
                onChange={(e) =>
                  handleShortcutChange(
                    idx,
                    e.target.value,
                    (e.nativeEvent as InputEvent).isComposing,
                  )
                }
                onBlur={(e) => handleShortcutChange(idx, e.target.value, false)}
              />
            </div>
          ))}
        </div>

        <div className="row pt-5">
          <h5>{t('date-roll-over-time')}</h5>
          <div className="input-group mb-3">
            <input
              type="time"
              className="form-control"
              value={rollOverTime}
              required
              onChange={(e) => handleRollOverChange(e.target.value)}
            />
          </div>
        </div>

        <div className="row pt-2">
          <div className="alert alert-info" role="alert">
            {t('register_the_string_to_the_shortcut_key')}
          </div>
        </div>
      </div>
    </>
  );
}
