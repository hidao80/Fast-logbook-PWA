---
name: analyzed-infrastructure
description: Documents the project's CI/CD workflows, container/self-hosting setup, and deployment paths for the React + TypeScript + Vite PWA.
type: analysis
commit-hash: e021877bb892db6cc019f4e0520449119de3c079
---

# Infrastructure (CI/CD and IaC)

## GitHub Actions Workflows

Two workflows exist under `.github/workflows/`. Both trigger only on `push` to `main` or `develop` (no `pull_request` trigger, no manual `workflow_dispatch`).

### `lint.yml` — "Lint"
- Trigger: `push` to `main`/`develop`.
- Runs on `ubuntu-slim`.
- Steps: `actions/checkout@v6` → `flatt-security/setup-takumi-guard-npm@v1` (supply-chain guard for npm install) → `mongolyy/reviewdog-action-biome@v1`, which runs Biome and posts results as a GitHub PR review (`reporter: github-pr-review`) using `secrets.github_token`.
- Note: this workflow does not explicitly install dependencies or run a build step; it relies on the reviewdog Biome action's own execution.

### `audit.yml` — "Audit"
- Trigger: `push` to `main`/`develop`.
- Runs on `ubuntu-slim`.
- Steps: checkout → `flatt-security/setup-takumi-guard-npm@v1` → `pnpm/action-setup@v4` → `actions/setup-node@v4` (Node 24, pnpm cache) → `pnpm install --frozen-lockfile` → `pnpm audit --audit-level=high`.
- Purpose: dependency vulnerability gate; fails the run if any high/critical severity advisory is found.

### Coverage gap (build not verified in CI)
Neither workflow runs `pnpm run build` or any type-check/test step. This is still a structural gap — a future broken build would not be caught by CI. The previous specific instance of this gap (root `index.html` missing at HEAD) was resolved in commit `e021877`, which added `index.html` back to the repo; `pnpm run build` has been re-verified to succeed cleanly (Vite v8.2.1, `dist/` generated including `sw.js`/workbox chunk). The general recommendation below still stands as a preventive measure.

Recommendation: add a `build.yml` (or extend an existing workflow) that runs `pnpm run build` on push/PR to catch entry-point/build breakage before merge. ⭐️4 (cheap preventive measure; the specific incident that motivated this is now resolved, so urgency is lower than before).

## Netlify (`netlify.toml`)

- Build command: `pnpm run build`.
- Publish directory: `dist`.
- Header rule: forces `Content-Type: application/manifest+json` for `/manifest.json`.
- Redirect rule: SPA fallback — all paths (`/*`) rewritten to `/index.html` with HTTP 200.
- No `netlify.toml` trigger/branch config is present, so deploy branch and deploy-on-push behavior are controlled by Netlify's own site configuration (dashboard), not by anything in this repo. This is **unconfirmed** from repo contents alone — the actual Netlify site settings (production branch, deploy previews, etc.) cannot be verified from the codebase.
- No workflow file in `.github/workflows/` performs a Netlify deploy, consistent with Netlify's standard git-integration model (Netlify's own app/webhook watches the connected repo and builds independently of GitHub Actions).
- The previously-documented build failure (missing root `index.html` causing `pnpm run build` to fail with `[UNRESOLVED_ENTRY]`) is resolved as of commit `e021877`, which committed `index.html` back to the repo. Netlify deploys running `pnpm run build` should now succeed, consistent with the local re-verification of the build.

## Docker (`Dockerfile`, `docker-compose.yml`)

Purpose: self-hosting path, independent of Netlify.

- `Dockerfile` is a two-stage build:
  1. Builder stage: `node:24.11.1-bookworm-slim`, enables corepack/pnpm, installs dependencies with `pnpm install --frozen-lockfile` (falls back to `pnpm install` if no lockfile), conditionally runs `pnpm run build` only if a `"build"` script is detected in `package.json`.
  2. Runtime stage: `nginx:alpine`, sets `TZ=Asia/Tokyo`, copies the builder's output — if a `dist/` directory exists it is promoted to web root, otherwise the entire copied app tree is served as-is. Nginx config is generated inline via `RUN echo '...'` (not a mounted/COPYed config file): SPA fallback (`try_files ... /index.html`), no-cache headers for `/` and `/sw.js` (service worker), and 1-year immutable cache for static assets (js/css/images/fonts).
  3. Exposes port 80, runs `nginx -g daemon off`.
- The Dockerfile's build step was previously affected by the same root `index.html` deletion issue (build stage would fail the same way as Netlify's build). This is resolved as of commit `e021877`, which committed `index.html` back to the repo.
- `docker-compose.yml`: single service `fast-logbook-pwa`, builds from the local `Dockerfile`, maps host port `8080` → container port `80`, sets `TZ=Asia/Tokyo`, `restart: unless-stopped`, defines a bridge network `fast-logbook-network`, and a healthcheck (`wget --spider http://localhost/`, 30s interval, 10s timeout, 3 retries, 40s start period). A commented-out bind-mount for live-reload development is present but inactive by default.
- Confirmed: this is a separate, manual self-hosting path (`docker compose up`) — it is not wired into any GitHub Actions workflow (no `docker build`/`docker push` step exists in `.github/workflows/`), and it is independent of the Netlify deployment.
- `.dockerignore` was updated in commit `c691cd1` to add `graphify-out` (alongside existing entries), keeping that directory out of the Docker build context. Minor, unrelated to the build-entry-point fix.

## GitHub Pages (`docs/index.html`, `docs/.nojekyll`)

- `docs/` contains `index.html` (~19KB), `design.md` (~29KB), an `img/` directory, and an empty `.nojekyll` file (disables Jekyll processing, standard for GitHub Pages serving raw/static or non-Jekyll-generated HTML).
- No workflow in `.github/workflows/` builds or publishes to Pages (no `actions/deploy-pages`, `peaceiris/actions-gh-pages`, or similar).
- Whether GitHub Pages is actually enabled for this repository (e.g. via repo Settings → Pages, serving from `main`/`docs` or `gh-pages` branch) **cannot be confirmed from repository contents** — this is a GitHub-side setting not reflected in any file. Unconfirmed/Unknown.
- Based on file evidence alone, `docs/` reads as a static, hand-authored landing page (with its own images and a design doc), separate in purpose and content from the main app (`dist/` output from Vite). It does not appear to be a build artifact — nothing in the Vite/Netlify build pipeline writes to `docs/`. This supports the interpretation that `docs/` is a standalone landing-page path, not a second deployment target for the same app.
- Recommendation: if GitHub Pages is intended to stay live, consider verifying the repo's Pages setting directly (Settings → Pages) rather than inferring from files, and optionally document the intended purpose of `docs/` in a README/ADR to avoid future ambiguity. ⭐️3 (low cost documentation clarity, not urgent).

## Infrastructure as Code (Terraform, etc.)

Confirmed: none. A repository-wide search for `*.tf` files or a `terraform/` directory found nothing. There is no Kubernetes manifest, Pulumi, CloudFormation, or other IaC tooling in this repository. Infrastructure is limited to the Dockerfile/docker-compose self-hosting path and externally-configured Netlify hosting.

<!-- commit-hash: e021877bb892db6cc019f4e0520449119de3c079 -->
