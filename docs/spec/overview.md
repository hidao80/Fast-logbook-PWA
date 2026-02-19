# Fast Logbook PWA - Project Overview

## Project Information

**Project Name:** Fast logbook PWA
**Version:** 26.02.05
**Description:** Time-stamped work notes Progressive Web Application
**License:** MIT
**Author:** hidao80

## Purpose

Fast Logbook PWA is a productivity tool designed to help users track time-stamped work activities. It allows users to quickly log tasks with timestamps and generate formatted summaries of their work time. The application is designed as a PWA (Progressive Web App) to work offline and provide a native-like experience on both desktop and mobile devices.

## Key Features

1. **Time-stamped Logging**: Automatically append timestamps to work log entries
2. **Shortcut Keys**: 9 customizable shortcut buttons (1-9) for frequently used tasks
3. **Free-form Input**: Custom text input field (0 key) for ad-hoc entries
4. **Work Time Calculation**: Automatically calculates time spent on each category of work
5. **Multiple Export Formats**: View and download logs as HTML tables, Markdown, or plain text
6. **Time Rounding**: Configurable time rounding (1, 5, 10, 15, 30, or 60 minutes)
7. **Multilingual Support**: Japanese and English language support with automatic detection
8. **Offline Capability**: Full PWA functionality with service worker caching
9. **Auto-save**: Automatic saving with visual feedback (debounced 300ms)
10. **Category Grouping**: Semicolon-separated format for category and detail grouping
11. **Dark Mode**: Automatic theme detection based on system preferences

## Technology Stack

### Frontend
- **HTML5**: Semantic markup with Bootstrap 5.3.0
- **CSS3**: Custom styling with Bootstrap framework
- **JavaScript (ES Modules)**: Modern ES2020+ features, `"type": "module"` in package.json
- **Bootstrap 5.3.0**: UI framework for responsive design
- **Bootstrap Icons 1.11.1**: Icon library

### Build & Development
- **Biome 2.4.2**: Unified linter and formatter (replaced ESLint + Prettier)
- **Package Manager**: npm (primary), pnpm supported

### CI/CD
- **GitHub Actions**: `lint.yml` (biome check) and `audit.yml` (npm audit --audit-level=high)

### PWA Features
- **Service Worker**: Offline caching and asset management
- **Web App Manifest**: PWA installation metadata
- **localStorage**: Client-side data persistence
- **Speculation Rules API**: Prerendering and prefetching

## Architecture

### Project Structure
```
Fast-logbook-PWA/
├── index.html              # Main application page
├── config.html             # Configuration page
├── manifest.json           # PWA manifest (version: 26.02.05)
├── sw.js                   # Service worker
├── package.json            # Project dependencies ("type": "module")
├── biome.json              # Biome lint + format configuration
├── Dockerfile              # Multi-stage Docker build (node → nginx:alpine)
├── docker-compose.yml      # Local development compose
├── css/                    # Stylesheets
│   ├── main.css           # Main page styles
│   └── config.css         # Config page styles
├── js/                     # JavaScript modules
│   ├── main.js            # Main application logic
│   ├── config.js          # Configuration page logic
│   └── lib/               # Library modules
│       ├── analytics.js   # Google Analytics event tracking
│       ├── download.js    # Log formatting and download
│       ├── indolence.min.js # DOM utility functions (minified)
│       ├── multilingualization.js # i18n support
│       └── utils.js       # Utility functions
├── img/                    # PWA icons (48-512px)
└── docs/                   # Documentation
    ├── design.md           # Technical design document
    └── spec/              # API / component specifications
```

## Data Storage

### localStorage Keys
- **`log`**: Raw time-stamped log entries (newline-separated)
- **`rounding_mins`**: Time rounding unit (1, 5, 10, 15, 30, 60)
- **`shortcut_1` through `shortcut_9`**: User-defined shortcut texts

### Data Formats

#### Log Entry Format
```
YYYY-MM-DD HH:MMCategory;Detail
```
Example:
```
2025-12-13 09:15@work +Project A;Meeting
2025-12-13 10:30@work +Project A;Coding
2025-12-13 12:00^Lunch
```

#### Special Markers
- **`^` prefix**: Entries starting with `^` are excluded from work time totals
- **`;` separator**: Separates category from detail for grouping

## User Workflow

1. **Main Screen**: User logs activities using shortcuts (1-9) or custom input (0)
2. **Timestamp Addition**: System automatically prepends current date/time
3. **Auto-save**: Changes are saved to localStorage with 300ms debounce
4. **View/Export**: User can view formatted summary or download as file
5. **Configuration**: User can customize shortcuts and time rounding settings

## Browser Compatibility

The application uses modern web APIs and requires:
- ES2020+ JavaScript support (ES Modules)
- localStorage API
- Service Worker API
- Web App Manifest support
- Speculation Rules API (progressive enhancement)

Target browsers: Modern evergreen browsers (Chrome, Firefox, Safari, Edge)

## Performance Characteristics

- **Instant Loading**: Service worker caches all assets for offline use
- **Debounced Saves**: 300ms debounce prevents excessive localStorage writes
- **Lightweight**: Minimal dependencies, mostly vanilla JavaScript
- **Responsive**: Mobile-first design with Bootstrap grid system

## Security Considerations

- **Client-side Only**: No server communication, all data stays local
- **localStorage Quota**: Handles QuotaExceededError gracefully
- **No Sensitive Data**: Designed for work logging, not confidential information
- **XSS Protection**: HTML escaping in log output functions (`escapeHtml()`)

## Deployment

The application is designed for static hosting and can be deployed to:
- Netlify (current deployment: https://fast-logbook.netlify.app)
- GitHub Pages
- Any static file hosting service
- Docker containers (Dockerfile and docker-compose.yml included; nginx:alpine serving on port 80)

No build process is required for deployment — all files are production-ready.

---

<!-- commit: ef46e13 -->
