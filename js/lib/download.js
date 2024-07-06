import Multilingualization from "./multilingualization.js";
import { getTodayString, LOG_DATA_KEY, ROUNDING_UNIT_MINUTE_KEY, fetchHourFromTime, fetchMinFromTime } from "./utils.js";

/**
 * Download a string with a file type
 *
 * @param {string} outputDataString Original data to be downloaded
 * @param {string} extension File extension
 * @param {string} mimeType mime type
 */
export function download(outputDataString, extension = 'html', mimeType = 'text/html') {
    const blob = new Blob([outputDataString], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const filename = Multilingualization.translate("app_name") + "_" + getTodayString() + "." + extension;
    
    // Save download information to localStorage
    localStorage.setItem('downloadUrl', url);
    localStorage.setItem('downloadFilename', filename);
    
    // Trigger an event to start the download
    const event = new CustomEvent('startDownload');
    window.dispatchEvent(event);
}

// Add download event listener
window.addEventListener('startDownload', () => {
    const url = localStorage.getItem('downloadUrl');
    const filename = localStorage.getItem('downloadFilename');
    
    if (url && filename) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Release the URL after use
        URL.revokeObjectURL(url);
        
        // Clear localStorage
        localStorage.removeItem('downloadUrl');
        localStorage.removeItem('downloadFilename');
    }
});

/**
 * Analyze and summarize raw work time log data
 *
 * @param {string} log Raw work time log data
 * @param {int} mins Rounding unit (minutes)
 * @returns {string} Formatted log HTML
 */
export function generateFormattedLog(log, mins) {
    const sections = [
        { title: 'html_summary', content: toHtml(log, mins) },
        { title: 'plaintext_log', content: log, isCode: true },
        { title: 'markdown_summary', content: toMarkdown(log, mins), isCode: true }
    ];

    return `<html><head>
<meta charset="UTF-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${Multilingualization.translate("log_viewer")}</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.2.3/js/bootstrap.bundle.min.js" integrity="sha512-i9cEfJwUwViEPFKdC1enz4ZRGBj8YQo6QByFTF92YXHi7waCqyexvRD75S5NVTsSiTv7rKWqG9Y5eFxmRsOn0A==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0-alpha1/css/bootstrap.min.css" integrity="sha512-72OVeAaPeV8n3BdZj7hOkaPSEk/uwpDkaGyP4W2jSzAC8tfiO4LMEDWoL3uFp5mcZu+8Eehb4GhZWFwvrss69Q==" crossorigin="anonymous" referrerpolicy="no-referrer" />
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" crossorigin="anonymous" referrerpolicy="no-referrer" />
</head><body>
<h2>${Multilingualization.translate('html_summary')}</h2>
<i id="html-log-copy" class="fa-sharp fa-regular fa-copy btn btn-outline-secondary d-none"
data-bs-trigger="manual" data-bs-toggle="tooltip" data-bs-placement="top" title="copy!"></i>
<div>
${toHtml(log, mins)}
</div>
<h2 class="pt-5">${Multilingualization.translate('plaintext_log')}</h2>
<i id="plain-text-log-copy" class="fa-sharp fa-regular fa-copy btn btn-outline-secondary d-none"
data-bs-trigger="manual" data-bs-toggle="tooltip" data-bs-placement="top" title="copy!"></i>
<div class="form-control"><pre><code id="plain-text-log-source">
${log}
</code></pre></div>
<h2 class="pt-5">${Multilingualization.translate('markdown_summary')}</h2>
<i id="markdown-table-log-copy" class="fa-sharp fa-regular fa-copy btn btn-outline-secondary d-none"
data-bs-trigger="manual" data-bs-toggle="tooltip" data-bs-placement="top" title="copy!"></i>
<div class="form-control"><pre><code id="markdown-table-log-source">
${toMarkdown(log, mins)}
</code></pre></div>
<script>
(async()=>{const t=await(navigator?.permissions?.query({name:"clipboard-write"}));"granted"!==t?.state&&"prompt"!==t?.state||document.querySelectorAll("#html-log-copy,#plain-text-log-copy,#markdown-table-log-copy").forEach((t=>{const e=new bootstrap.Tooltip(t);t.classList.remove("d-none"),t.addEventListener("click",(async t=>{let o;t.preventDefault(),t.stopPropagation(),o="plain-text-log-copy"===t.target.id?document.querySelector("#plain-text-log-source").textContent:"markdown-table-log-copy"===t.target.id?document.querySelector("#markdown-table-log-source").textContent:document.querySelector("#html-log-source").textContent.replace(/\\n\\n/g,"\\a").replace(/\\n/g,"\\t").replace(/\\a/g,"\\n"),await(navigator?.clipboard?.writeText(o.trim())),e.show(),setTimeout((()=>e.hide()),1e3)}))}))})();
</script>
</body></html>`;
}

export async function downloadLog() {
    const log = localStorage.getItem(LOG_DATA_KEY);
    const mins = localStorage.getItem(ROUNDING_UNIT_MINUTE_KEY);
    const outputStr = generateFormattedLog(log, mins);
    download(outputStr);
}

/**
 * Analyze and summarize raw work time log data
 *
 * @param {string} text Raw work time log data
 * @param {int} mins Rounding unit (minutes)
 * @returns {object} Category-wise summary data (json)
 */
export function parse(text, mins) {
    const TIME_LENGTH = 16;
    const FIELD_SEPARATOR = ";";
    const RECORD_SEPARATOR = "\n";

    let timeStamp = [], obj = {};

    // Convert log to JSON
    text.split(RECORD_SEPARATOR).forEach(line => {
        const time = line.slice(0, TIME_LENGTH);
        const junction = line.indexOf(FIELD_SEPARATOR);
        const category = junction < 0 ? line.slice(TIME_LENGTH) : line.slice(TIME_LENGTH, junction);
        const detail = junction < 0 ? '' : line.slice(junction + 1);

        timeStamp.push({ "time": time, "category": category });
        if (!obj[category]) obj[category] = {};
        obj[category].time = 0;
        if (!obj[category].detail) obj[category].detail = [];
        obj[category].detail.push(detail);
    });

    // Remove duplicates from work details
    Object.keys(obj).forEach(item => {
        obj[item].detail = Array.from(new Set(obj[item].detail)).join(", ");
    });

    // Calculate work time in minutes
    for (let i = 1; i < timeStamp.length; i++) {
        const after = timeStamp[i].time;
        const before = timeStamp[i - 1].time;
        let hour = fetchHourFromTime(after) - fetchHourFromTime(before);
        if (hour < 0) {
            hour += 24;
        }
        let min = fetchMinFromTime(after) - fetchMinFromTime(before);
        // If crossing midnight
        if (min < 0) {
            hour -= 1;
            min += 60;
        }
        obj[timeStamp[i - 1].category].time += hour * 60 + min;
    }

    // Convert work time to ROUNDING_UNIT time
    Object.keys(obj).forEach(item => {
        obj[item].round = Math.floor(obj[item].time / 60) + Number((Math.round(obj[item].time % 60 / mins) * mins / 60).toFixed(2));
    });

    return obj;
}

/**
 * Convert summarized time to HTML table format
 *
 * @param {object} log Category-wise summary data (json)
 * @param {int} mins Rounding unit (minutes)
 * @returns {string} HTML table
 */
export function toHtml(log, mins) {
    const dataJson = parse(log, mins);
    const breakMark = "^";
    let sum = 0;
    let total = 0;
    let output =
`</head><body><table class="table table-striped-columns"><thead class="table-light"><thead class="table-light">
<tr>
<th class="text-center">${Multilingualization.translate("work_category")}</th>
<th class="text-center">${Multilingualization.translate("work_detail")}</th>
<th class="text-center">${Multilingualization.translate("work_time_hour")}</th>
<th class="text-center">${Multilingualization.translate("work_time_min")}</th>
</tr>
</thead><tbody id="html-log-source" class="table-group-divider">`;

    for (const category of Object.keys(dataJson).sort()) {
        output +=
`<tr>
<td>${category}</td>
<td>${dataJson[category].detail}</td>
<td class="text-end">${dataJson[category].round}</td>
<td class="text-end">${dataJson[category].time}</td>
</tr>`;
        if (category[0] != breakMark) sum += dataJson[category].time;
        total += dataJson[category].time;
    }

    const sumStr = Multilingualization.translate("work_time_actual") + "： " + (Math.floor(sum / 60) + Number((Math.round(sum % 60 / mins) * mins / 60).toFixed(2))) + " h";
    const totalStr = Multilingualization.translate("work_time_total") + "： " + (Math.floor(total / 60) + Number((Math.round(total % 60 / mins) * mins / 60).toFixed(2))) + " h";

    output +=
`</tbody></table>
<p>
${sumStr} (${sum} ${Multilingualization.translate('mins')})<br>
${totalStr} (${total} ${Multilingualization.translate('mins')})</p>
`;

    return output;
}

/**
 * Convert summarized time to markdown table format
 *
 * @param {object} log Category-wise summary data (json)
 * @param {int} mins Rounding unit (minutes)
 * @returns {string} Markdown table
 */
export function toMarkdown(log, mins) {
    const dataJson = parse(log, mins);
    const breakMark = "^";
    let sum = 0;
    let total = 0;
    let output =
        `${Multilingualization.translate("work_category")} | ${Multilingualization.translate("work_detail")} | ${Multilingualization.translate("work_time_hour")} | ${Multilingualization.translate("work_time_min")}
--- | --- | --: | --:
`;

    for (const category of Object.keys(dataJson).sort()) {
        output += `${category} | ${dataJson[category].detail} | ${dataJson[category].round} | ${dataJson[category].time}\n`;
        if (category[0] != breakMark) sum += dataJson[category].time;
        total += dataJson[category].time;
    }

    output += `\n${Multilingualization.translate("work_time_actual")}： ` + (Math.floor(sum / 60) + Number((Math.round(sum % 60 / mins) * mins / 60).toFixed(2))) + ` h (${sum} ${Multilingualization.translate('mins')})`;
    output += `\n${Multilingualization.translate("work_time_total")}： ` + (Math.floor(total / 60) + Number((Math.round(total % 60 / mins) * mins / 60).toFixed(2))) + ` h (${total} ${Multilingualization.translate('mins')})`;

    return output;
}
