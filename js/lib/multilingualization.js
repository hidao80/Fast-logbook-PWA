/**
 * Multilingualization library class
 *
 * @class Multilingualization
 */
export default class Multilingualization {
    /**
     *  @var dictionaries Multilingual dictionary object
     */
    static dictionaries = {
        "en": {
            "app_name": "Fast logbook PWA",
            "popup_title": "Fast logbook PWA",
            "popup_description": "Time-stamped work notes PWA",
            "configure": "Configure",
            "config_title": "Config - Fast logbook PWA",
            "view_formatted_log": "View formatted log",
            "download_formatted_log": "Download formatted log",
            "shortcut_items_title": "Shortcut items",
            "shortcut_1": "@work +PromotionalExams;Study",
            "shortcut_2": "@wrivate +housework;Cleaning",
            "shortcut_3": "@work +PromotionalExams;Research",
            "shortcut_4": "@work +PromotionalExams;Report",
            "shortcut_5": "@work +PromotionalExams;Presentation",
            "shortcut_6": "",
            "shortcut_7": "",
            "shortcut_8": "",
            "shortcut_9": "",
            "input_placeholder": "Enter a task in free description",
            "textarea_placeholder": "Work logs will be output here. Editable",
            "rounding_unit": "Rounding unit",
            "1min": "1min",
            "5min": "5min",
            "10min": "10min",
            "15min": "15min",
            "30min": "30min",
            "60min": "60min",
            "register_the_string_to_the_shortcut_key": "Please register the string in the shortcut key. Tags beginning with \"^\" will not be counted.<br>After \";\", write the details and include them in the group of strings before \";\" for aggregation.",
            "plaintext_log": "Plaintext",
            "markdown_summary": "Markdown table",
            "html_summary": "HTML table",
            "log_viewer": "Log preview",
            "work_category": "Work category",
            "work_detail": "Work detail",
            "work_time_hour": "Work time[hrs.]",
            "work_time_min": "Work time[min.]",
            "work_time_actual": "Actual work",
            "work_time_total": "Total",
            "mins": "min(s).",
            "back": "Back",
            "delete_log": "Delete log",
            "delete_log_confirm": "Are you sure you want to delete the log?",
            "install_pwa": "Install PWA",
            "delete_log_confirm_title": "Delete log",
            "delete_log_confirm_message": "Are you sure you want to delete the log?",
            "cancel": "Cancel",
            "delete": "Delete",  
        },
        "ja": {
            "app_name": "Fast logbook PWA",
            "popup_title": "Fast logbook PWA",
            "popup_description": "開始時間付き作業メモPWA",
            "configure": "設定",
            "config_title": "設定 - Fast logbook PWA",
            "view_formatted_log": "ログを表示",
            "download_formatted_log": "ログをダウンロード",
            "shortcut_items_title": "ショートカット項目",
            "shortcut_1": "@仕事 +昇進試験;勉強",
            "shortcut_2": "@私用 +家事;掃除",
            "shortcut_3": "@仕事 +昇進試験;研究",
            "shortcut_4": "@仕事 +昇進試験;レポート",
            "shortcut_5": "@仕事 +昇進試験;プレゼンテーション",
            "shortcut_6": "",
            "shortcut_7": "",
            "shortcut_8": "",
            "shortcut_9": "",
            "input_placeholder": "自由記述でタスクを入力",
            "textarea_placeholder": "作業記録が出力される。修正可能",
            "rounding_unit": "時間丸め単位",
            "1min": "1分",
            "5min": "5分",
            "10min": "10分",
            "15min": "15分",
            "30min": "30分",
            "60min": "60分",
            "register_the_string_to_the_shortcut_key": "ショートカットキーに文字列を登録してください。「^」で始まるタグはカウントされません。<br>「;」の後に詳細を書き、「;」の前の文字列のグループに含めて集計します。",
            "plaintext_log": "プレーンテキスト",
            "markdown_summary": "Markdownの表",
            "html_summary": "HTMLの表",
            "log_viewer": "ログのプレビュー",
            "work_category": "業務名",
            "work_detail": "業務内容",
            "work_time_hour": "作業時間[時]",
            "work_time_min": "作業時間[分]",
            "work_time_actual": "実働計",
            "work_time_total": "総計",
            "mins": "分",
            "back": "戻る",
            "delete_log": "ログ削除",
            "delete_log_confirm": "本当にログを削除しますか？",
            "install_pwa": "PWAをインストール",
            "delete_log_confirm_title": "ログ削除",
            "delete_log_confirm_message": "本当にログを削除しますか？",
            "cancel": "キャンセル",
            "delete": "削除",  
        }
    }

    /**
     * Get current language
     *
     * @returns {string} Current language
     */
    static language() {
        const lang = ((window.navigator.languages && window.navigator.languages[0]) ||
            window.navigator.language ||
            window.navigator.userLanguage ||
            window.navigator.browserLanguage).slice(0, 2);

        // Show English for undefined languages
        return this.dictionaries[lang] ? lang : "en";
    }

    /**
     * Get translated term
     *
     * @param {string} term Term to be translated
     * @returns {string} Translated term
     */
    static translate(index) {
        return this.dictionaries[this.language()][index];
    }

    /**
     * Initialization of dictionary object
     */
    static translateAll() {
        const dictionary = this.dictionaries[this.language()];
        for (let elem of document.querySelectorAll('[data-translate]')) {
            elem.innerHTML = dictionary[elem.dataset.translate];
        }
    }
}
