import i18next from 'i18next';
import { getItem } from './storage';
import {
  escapeHtml,
  fetchHourFromTime,
  fetchMinFromTime,
  getTodayString,
  LOG_DATA_KEY,
  ROUNDING_UNIT_MINUTE_KEY,
} from './utils';

const HTML_SUMMARY = 'html_summary';
const PLAINTEXT_LOG = 'plaintext_log';
const MARKDOWN_SUMMARY = 'markdown_summary';

// Module-level download state — lifecycle is synchronous (set → dispatch → get → clear).
let _downloadUrl: string | null = null;
let _downloadFilename: string | null = null;

/**
 * Trigger a file download for the given string content.
 */
export function download(
  outputDataString: string,
  extension = 'html',
  mimeType = 'text/html',
): void {
  const blob = new Blob([outputDataString], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const filename = `${i18next.t('app_name')}_${getTodayString()}.${extension}`;

  _downloadUrl = url;
  _downloadFilename = filename;

  window.dispatchEvent(new CustomEvent('startDownload'));
}

window.addEventListener('startDownload', () => {
  const url = _downloadUrl;
  const filename = _downloadFilename;

  if (url && filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    _downloadUrl = null;
    _downloadFilename = null;
  }
});

interface ParsedCategory {
  time: number;
  detail: string;
  round: number;
}

/**
 * Parse raw log text into a category-wise summary.
 */
export function parse(
  text: string,
  mins: number,
): Record<string, ParsedCategory> {
  const TIME_LENGTH = 16;
  const FIELD_SEPARATOR = ';';
  const RECORD_SEPARATOR = '\n';

  const timeStamp: Array<{ time: string; category: string }> = [];
  const detailLists: Record<string, string[]> = {};
  const times: Record<string, number> = {};

  text.split(RECORD_SEPARATOR).forEach((line) => {
    const time = line.slice(0, TIME_LENGTH);
    const junction = line.indexOf(FIELD_SEPARATOR);
    const category =
      junction < 0
        ? line.slice(TIME_LENGTH)
        : line.slice(TIME_LENGTH, junction);
    const detail = junction < 0 ? '' : line.slice(junction + 1);

    timeStamp.push({ time, category });
    if (!detailLists[category]) {
      detailLists[category] = [];
      times[category] = 0;
    }
    detailLists[category].push(detail);
  });

  for (let i = 1; i < timeStamp.length; i++) {
    const after = timeStamp[i].time;
    const before = timeStamp[i - 1].time;
    let hour = fetchHourFromTime(after) - fetchHourFromTime(before);
    if (hour < 0) hour += 24;
    let min = fetchMinFromTime(after) - fetchMinFromTime(before);
    if (min < 0) {
      hour -= 1;
      min += 60;
    }
    times[timeStamp[i - 1].category] += hour * 60 + min;
  }

  const result: Record<string, ParsedCategory> = {};
  for (const item of Object.keys(times)) {
    const time = times[item];
    result[item] = {
      time,
      detail: Array.from(new Set(detailLists[item])).join(', '),
      round:
        Math.floor(time / 60) +
        Number(((Math.round((time % 60) / mins) * mins) / 60).toFixed(2)),
    };
  }

  return result;
}

/**
 * Convert log summary to an HTML table string.
 */
export function toHtml(log: string, mins: number): string {
  const dataJson = parse(log, mins);
  const breakMark = '^';
  let sum = 0;
  let total = 0;
  let output = `</head><body><table class='table table-striped-columns'><thead class='table-light'><thead class='table-light'>
<tr>
<th class='text-center'>${i18next.t('work_category')}</th>
<th class='text-center'>${i18next.t('work_detail')}</th>
<th class='text-center'>${i18next.t('work_time_hour')}</th>
<th class='text-center'>${i18next.t('work_time_min')}</th>
</tr>
</thead><tbody id='${HTML_SUMMARY}-source' class='table-group-divider'>`;

  for (const category of Object.keys(dataJson).sort()) {
    output += `<tr>
<td>${escapeHtml(category) ? escapeHtml(category) : '-'}</td>
<td>${escapeHtml(dataJson[category].detail) ? escapeHtml(dataJson[category].detail) : ' '}</td>
<td class='text-end'>${dataJson[category].round}</td>
<td class='text-end'>${dataJson[category].time}</td>
</tr>`;
    if (category[0] !== breakMark) sum += dataJson[category].time;
    total += dataJson[category].time;
  }

  const sumStr =
    i18next.t('work_time_actual') +
    '： ' +
    (Math.floor(sum / 60) +
      Number(((Math.round((sum % 60) / mins) * mins) / 60).toFixed(2))) +
    ' h';
  const totalStr =
    i18next.t('work_time_total') +
    '： ' +
    (Math.floor(total / 60) +
      Number(((Math.round((total % 60) / mins) * mins) / 60).toFixed(2))) +
    ' h';

  output += `</tbody></table>
<p>
${sumStr} (${sum} ${i18next.t('mins')})<br>
${totalStr} (${total} ${i18next.t('mins')})</p>
`;

  return output;
}

/**
 * Convert log summary to a Markdown table string.
 */
export function toMarkdown(log: string, mins: number): string {
  const dataJson = parse(log, mins);
  const breakMark = '^';
  let sum = 0;
  let total = 0;
  let output = `${i18next.t('work_category')} | ${i18next.t('work_detail')} | ${i18next.t('work_time_hour')} | ${i18next.t('work_time_min')}
--- | --- | --: | --:
`;

  for (const category of Object.keys(dataJson).sort()) {
    output += `${category} | ${dataJson[category].detail} | ${dataJson[category].round} | ${dataJson[category].time}\n`;
    if (category[0] !== breakMark) sum += dataJson[category].time;
    total += dataJson[category].time;
  }

  output +=
    `\n${i18next.t('work_time_actual')}： ` +
    (Math.floor(sum / 60) +
      Number(((Math.round((sum % 60) / mins) * mins) / 60).toFixed(2))) +
    ` h (${sum} ${i18next.t('mins')})`;
  output +=
    `\n${i18next.t('work_time_total')}： ` +
    (Math.floor(total / 60) +
      Number(((Math.round((total % 60) / mins) * mins) / 60).toFixed(2))) +
    ` h (${total} ${i18next.t('mins')})`;

  return output;
}

/**
 * Generate the full HTML page for the formatted log viewer.
 */
export function generateFormattedLog(log: string, mins: number): string {
  const sections = [
    { title: HTML_SUMMARY, content: toHtml(log, mins) },
    { title: PLAINTEXT_LOG, content: log, isCode: true },
    { title: MARKDOWN_SUMMARY, content: toMarkdown(log, mins), isCode: true },
  ];

  return `<html><head>
<meta charset='UTF-8'>
<meta http-equiv='X-UA-Compatible' content='IE=edge'>
<meta name='viewport' content='width=device-width, initial-scale=1.0'>
<title>${i18next.t('log_viewer')}</title>
<script src='https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.2.3/js/bootstrap.bundle.min.js' integrity='sha512-i9cEfJwUwViEPFKdC1enz4ZRGBj8YQo6QByFTF92YXHi7waCqyexvRD75S5NVTsSiTv7rKWqG9Y5eFxmRsOn0A==' crossorigin='anonymous' referrerpolicy='no-referrer'></script>
<link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0-alpha1/css/bootstrap.min.css' integrity='sha512-72OVeAaPeV8n3BdZj7hOkaPSEk/uwpDkaGyP4W2jSzAC8tfiO4LMEDWoL3uFp5mcZu+8Eehb4GhZWFwvrss69Q==' crossorigin='anonymous' referrerpolicy='no-referrer' />
<link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css' integrity='sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==' crossorigin='anonymous' referrerpolicy='no-referrer' />
</head><body>
${sections
  .map(
    (section) => `
<h2>${i18next.t(section.title)}</h2>
<i id='${section.title}-copy' class='fa-sharp fa-regular fa-copy btn btn-outline-secondary d-none'
data-bs-trigger='manual' data-bs-toggle='tooltip' data-bs-placement='top' title='copy!'></i>
<div>
${section.isCode ? `<pre><code id='${section.title}-source'>${escapeHtml(section.content)}</code></pre>` : section.content}
</div>
`,
  )
  .join('')}
<script>
(async()=>{const e=await(navigator?.permissions?.query({name:'clipboard-write'}));'granted'!==e?.state&&'prompt'!==e?.state||document.querySelectorAll('#${HTML_SUMMARY}-copy,#${PLAINTEXT_LOG}-copy,#${MARKDOWN_SUMMARY}-copy').forEach((e=>{const t=new bootstrap.Tooltip(e);e.classList.remove('d-none'),e.addEventListener('click',(async e=>{let a;e.preventDefault(),e.stopPropagation(),(a=document.querySelector(\`#\${e.target.id.replace('-copy','-source')}\`).textContent),'${HTML_SUMMARY}-copy'===e.target.id&&(a=a.replace(/\\n\\n/g,'<></>').replace(/\\n/g,'\\t').replace(/<><\\/>/g,'\\n')),await(navigator?.clipboard?.writeText(a.trim())),t.show(),setTimeout((()=>t.hide()),1e3)}))}))})();
</script>
</body></html>`;
}

/**
 * Download the formatted log for the given log text.
 */
export async function downloadLog(log: string | null = null): Promise<void> {
  const logData = log ?? (await getItem(LOG_DATA_KEY)) ?? '';
  const minsRaw = await getItem(ROUNDING_UNIT_MINUTE_KEY);
  const mins = Number(minsRaw) > 0 ? Number(minsRaw) : 1;
  const outputStr = generateFormattedLog(logData, mins);
  download(outputStr);
}
