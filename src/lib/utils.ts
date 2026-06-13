export const LOG_DATA_KEY = 'log';
export const ROUNDING_UNIT_MINUTE_KEY = 'rounding_mins';

/**
 * Get the current date as a string.
 *
 * @returns 'YYYY-MM-DD'
 * @example getTodayString() -> '2023-05-01'
 */
export function getTodayString(): string {
  const date = new Date();
  const yyyy = date.getFullYear().toString().padStart(4, '0');
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Get the hour from a date and time.
 *
 * @param time - 'Y-m-d H:i:s' or null for current time
 * @param isInt - return as number when true, zero-padded string when false
 * @example fetchHourFromTime('2021-01-01 09:04:56') -> 9
 * @example fetchHourFromTime('2021-01-01 09:04:56', false) -> '09'
 */
export function fetchHourFromTime(time?: string | null, isInt?: true): number;
export function fetchHourFromTime(time: string | null, isInt: false): string;
export function fetchHourFromTime(
  time: string | null = null,
  isInt = true,
): number | string {
  const date = time === null ? new Date() : new Date(time);
  const hour = date.getHours().toString().padStart(2, '0');
  return isInt ? parseInt(hour, 10) : hour;
}

/**
 * Get minutes from a date and time.
 *
 * @param time - 'Y-m-d H:i:s' or null for current time
 * @param isInt - return as number when true, zero-padded string when false
 * @example fetchMinFromTime('2021-01-01 12:04:56') -> 4
 * @example fetchMinFromTime('2021-01-01 12:34:56', false) -> '04'
 */
export function fetchMinFromTime(time?: string | null, isInt?: true): number;
export function fetchMinFromTime(time: string | null, isInt: false): string;
export function fetchMinFromTime(
  time: string | null = null,
  isInt = true,
): number | string {
  const date = time === null ? new Date() : new Date(time);
  const min = date.getMinutes().toString().padStart(2, '0');
  return isInt ? parseInt(min, 10) : min;
}

/**
 * Get a valid rounding unit time.
 *
 * @param value - raw stored value
 * @returns 1, 5, 10, 15, 30, or 60
 * @example getRoundingUnit(20) -> 1
 */
export function getRoundingUnit(value: number | string | null): number {
  switch (Number(value)) {
    case 1:
    case 5:
    case 10:
    case 15:
    case 30:
    case 60:
      return Number(value);
    default:
      return 1;
  }
}

/**
 * Add a timestamp prefix to a work tag.
 *
 * @param tag - raw tag string
 * @returns 'YYYY-MM-DD HH:MM<tag>'
 * @example appendTime('Meeting') -> '2023-01-01 09:00Meeting'
 */
export function appendTime(tag: string): string {
  return (
    getTodayString() +
    ' ' +
    fetchHourFromTime(null, false) +
    ':' +
    fetchMinFromTime(null, false) +
    tag
  );
}

/**
 * Remove duplicate and leading/trailing newlines from log text.
 *
 * @example trimNewLine('aa\nbb\n\ncc\n') -> 'aa\nbb\ncc'
 */
export function trimNewLine(text: string): string {
  return text.replace(/\n{2,}/g, '\n').replace(/(^\n|\n$)/, '');
}

/**
 * Escape HTML special characters.
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Wire up the PWA install button with the beforeinstallprompt event.
 */
export function installPWA(
  elem: HTMLElement & { promptEvent?: BeforeInstallPromptEvent },
): void {
  window.addEventListener('beforeinstallprompt', (event) => {
    const e = event as BeforeInstallPromptEvent;
    e.preventDefault();
    elem.promptEvent = e;
    elem.classList.remove('d-none');
    return false;
  });

  elem.addEventListener('click', () => {
    if (elem.promptEvent) {
      elem.promptEvent.prompt();
      elem.promptEvent.userChoice.then(() => {
        elem.classList.add('d-none');
        elem.promptEvent = undefined;
      });
    }
  });
}

/**
 * Apply Bootstrap theme based on prefers-color-scheme when data-bs-theme="auto".
 */
export function autoSetTheme(): void {
  const theme =
    document.documentElement.getAttribute('data-bs-theme') ?? 'light';
  if (
    theme === 'auto' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    document.documentElement.setAttribute('data-bs-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-bs-theme', theme);
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): void;
  userChoice: Promise<{ outcome: string }>;
}
