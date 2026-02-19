[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)&emsp;
![PWA](https://img.shields.io/badge/PWA-Yes-4BC51D.svg)&emsp;
![Lint](https://github.com/hidao80/Fast-logbook-PWA/actions/workflows/lint.yml/badge.svg)&emsp;
![Audit](https://github.com/hidao80/Fast-logbook-PWA/actions/workflows/audit.yml/badge.svg)&emsp;
[![Netlify Status](https://api.netlify.com/api/v1/badges/e764aaa6-ad23-4945-8b6e-17a802224243/deploy-status)](https://app.netlify.com/sites/fast-logbook/deploys)&emsp;
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/hidao80/Fast-logbook-PWA)

![Accessibility](https://img.shields.io/badge/Accessibility-94-brightgreen?style=flat-square)&emsp;![Best_Practices](https://img.shields.io/badge/Best_Practices-100-brightgreen?style=flat-square)&emsp;![Performance](https://img.shields.io/badge/Performance-93-brightgreen?style=flat-square)&emsp;![SEO](https://img.shields.io/badge/SEO-90-brightgreen?style=flat-square)&emsp;<sub>Measured on Jan 17, 2026 by [Lighthouse-badges](https://github.com/hidao80/lighthouse-badges) — [Measure now!](https://pagespeed.web.dev/analysis?url=https://fast-logbook.netlify.app/)</sub>

**Record with one tap. Instantly tally. No installation required.**

- **Quick**: Instantly stamp with a tap or by pressing the number keys 1-9.
- **Aggregate**: Instantly calculate totals and grand totals.
- **Secure**: Data stays 100% in your browser — no server, no account.

# Fast Logbook PWA

## Overview
Fast-logbook-PWA is a lightweight PWA for recording and aggregating daily work logs quickly and securely, on any device with a browser.

## Issue & Reason
Existing work log management tools require installation or account creation, or lack aggregation features, making daily recording cumbersome.
Fast-logbook-PWA was created to provide a work log experience where you can "record with one action and aggregate instantly" without requiring installation or accounts.

[🚀 **Live Demo**](https://fast-logbook.netlify.app/)

<img width="30%" alt="input screen" src="https://github.com/user-attachments/assets/c990ed5d-1973-42c5-b36c-1c9910ca0e7a" />&emsp;<img width="30%" alt="スクリーンショット 2025-10-31 073723" src="https://github.com/user-attachments/assets/650c8fd4-dc39-4c16-ae6b-d92ba7ddc236" />

## ✨ Features

- **No account required; data remains only in your browser**
- PWA with offline support; installable as an app on both PC and mobile
- Totals and grand totals calculated by category
- One-tap stamping with number keys (1-9), free input also available
- **Download as HTML with copy buttons**, including HTML/Markdown/plain text formats
- Exclude break time from working hours
- Dark mode support
- Internationalization (en, ja)

## 🚀 Quick Start

### Run with Docker

```bash
# Development
docker compose up

# Production build
docker build -t fast-logbook-pwa .
docker run -p 8080:80 fast-logbook-pwa
```

### Run locally

```bash
npm install
# Open index.html in your browser or use a local server
npx serve .
```

## 📲 How to Install

It is possible to use the PWA without installing it.

1. Access <https://fast-logbook.netlify.app/>.
2. Click the hamburger menu to open the sidebar.
3. Click the "Install PWA" button at the bottom of the sidebar.
4. When the installation dialog is displayed, click the "Install" button.

## 📖 Usage

### 1. Setup

Option settings are saved automatically.

1. Open the config screen.
2. Enter the tasks corresponding to numbers 1 to 9. You can change the tasks even after stamping.
3. If you prefix a task name with "^", it will be excluded from the actual working hours during that task. Please use this function for measuring break time, etc.

### 2. Stamp

1. When you click Labels 1 to 9, the preset tasks you set on the Options screen will be registered in the area at the bottom of the pop-up along with the current time.
2. Clicking the 0 field moves the focus to the free input field. Enter the task details. Pressing the Enter key clears the 0 field and completes the registration.
3. No matter which key you use to register a task, the date and time will be automatically appended. The text at the bottom of the popup can be freely edited, so you can modify it after registration.

### 3. Download logs

1. Clicking the View Log button at the top of the sidebar will open an HTML file in another tab with an HTML table, plain text, and Markdown table all in one.
2. Click the Download Log button at the top of the sidebar to download an HTML file with the HTML table, plain text, and Markdown table all in one.

## 🛠️ Tech Stack

- HTML5 / CSS3 / Vanilla JavaScript
- Service Worker (PWA)
- Local Storage

## 📸 Screenshots

<details>
<summary>Details</summary>
  
<img width="400" alt="input screen" src="https://github.com/user-attachments/assets/748b4f02-452a-4fee-8642-27c035245d03" /><br>
*Input screen*

---

<img width="400" alt="Main menu" src="https://github.com/user-attachments/assets/b5c36eef-f33a-42c0-a60b-1eca16b388a7" /><br>
*Main menu*

---

<img width="400" alt="スクリーンショット 2025-10-31 073332" src="https://github.com/user-attachments/assets/ccc564a6-bff9-407c-ba66-974193939823" /><br>
*Configuration screen*

---

<img width="400" alt="スクリーンショット 2025-10-31 073658" src="https://github.com/user-attachments/assets/02b80a59-dfad-4dc1-ab26-00de9f7fe59a" /><br>
*Help modal dialog*

---

<img width="400" alt="スクリーンショット 2025-10-31 073723" src="https://github.com/user-attachments/assets/650c8fd4-dc39-4c16-ae6b-d92ba7ddc236" /><br>
*Exported summary HTML file*  
</details>

## 🤝 Contributing

Bug reports and pull requests are welcome.

## 📄 License

MIT
