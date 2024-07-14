# Fast Logbook PWA

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![PWA](https://img.shields.io/badge/PWA-Yes-4BC51D.svg)
[![Netlify Status](https://api.netlify.com/api/v1/badges/e764aaa6-ad23-4945-8b6e-17a802224243/deploy-status)](https://app.netlify.com/sites/fast-logbook/deploys)

## How to Install

It is possible to use the PWA without installing it.

1. Access <https://fast-logbook.netlify.app/>.
2. Click the hamburger menu to open the sidebar.
3. Click the "Install PWA" button at the bottom of the sidebar.
4. When the installation dialog is displayed, click the "Install" button.

## Usage

### 1. Setup

Option settings are saved automatically.

1. Open the config screen.
2. Fill in the tasks corresponding to the numeric keypad shortcut keys from 1 to 9 keys. Tasks can be changed after stamping.
3. If you prefix a task name with "^", it will be excluded from the actual working hours during that task. Please use this function for measuring break time, etc.

### 2. Stamp

1. When you click Labels 1 to 9, the preset tasks you set on the Options screen will be registered in the area at the bottom of the pop-up along with the current time.
2. Clicking the 0 field moves the focus to the free input field. Enter the task details. Pressing the Enter key clears the 0 field and completes the registration.
3. No matter which key you use to register a task, the date and time will be automatically appended. The text at the bottom of the popup can be freely edited, so you can modify it after registration.

### 3. Download logs

1. Clicking the View Log button at the top of the sidebar will open an HTML file in another tab with an HTML table, plain text, and Markdown table all in one.
2. Click the Download Log button at the top of the sidebar to download an HTML file with the HTML table, plain text, and Markdown table all in one.

## License

MIT
