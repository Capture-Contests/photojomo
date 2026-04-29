# Photojomo — Monorepo Guide

This repository contains multiple applications under the Photojomo / Capture Caribbean umbrella.

---

## Repository Structure

```
photojomo/
├── CLAUDE.md                    # This file
├── SPECIFICATION.md             # Backend technical specification
├── photojomo-be/                # Backend — Spring Boot AWS Lambda functions
├── photojomo-wb/                # Official contest website — Angular
├── photojomo-first-wave-wb/     # Capture Caribbean: First Wave Challenge — Angular 20
├── caribbean-photo-contest-wb/  # Photo Contest website — Angular
├── capture-caribbean-sweepstakes-wb/ # Sweepstakes website — Angular
├── screenshots/
└── scripts/
```

---

## Applications

### `photojomo-be` — Backend
- **Language**: Java 21
- **Framework**: Spring Boot 3.3 + Spring Cloud Function (AWS Lambda adapter)
- **Database**: PostgreSQL on AWS RDS, migrations via Flyway
- **Infrastructure**: Terraform (`infrastructure/`)
- **Build**: Maven multi-module, packaged as uber-jar via Maven Shade Plugin
- See `SPECIFICATION.md` for full technical details.

---

### `photojomo-wb` — Official Contest Website
- **Purpose**: The official Capture Caribbean photography contest website
- **Framework**: Angular (standalone components)
- **Branch**: `main`

---

### `photojomo-first-wave-wb` — Capture Caribbean: First Wave Challenge
- **Framework**: Angular 20 (standalone components, signals)
- **Purpose**: Contest entry site for the Capture Caribbean First Wave Challenge — a 30-day global photography competition launching the Capture Caribbean platform.
- **Node requirement**: Node.js v20.19+ or v22.12+ (use `nvm use 20.19.6`)
- **Dev server**: `npx ng serve` (from `photojomo-first-wave-wb/`)
- **Build**: `npx ng build`
- **Fonts**: Open Sauce One (primary), Instrument Serif (italic accents via `--font-serif`)
- **Colors**: `--color-gold: #d8a74d`, `--color-gold-italic` for serif accents
- **Routing**: Lazy-loaded routes defined in `src/app/app.routes.ts`
- **Key pages**:
  - `/home` — Hero + countdown, contest cards, founding class, golden ticket, partnership, path forward, prize vault, FAQ
  - `/contests/:division` — Contest division page with tier/pricing selector
  - `/account/register?division=X&tier=Y` — Dark-themed entry form (personal info, image uploads, payment)
  - `/early-bird-entry` — Early bird entry page
  - `/info/*` — Rules, terms, privacy, FAQs, contact
- **Shared components**: `src/app/shared/contest-tiers/` (tier selector used by all division pages)
- **Registration flow**: Division page → select tier → "Register Now" → `/account/register` pre-populated with division + tier via query params
- **WordPress source**: caribbeanphotocontests.com (reference for design/content)

---

### `caribbean-photo-contest-wb` — Photo Contest Website
- **Purpose**: The Capture Caribbean photo contest website
- **Framework**: Angular (standalone components)

---

### `capture-caribbean-sweepstakes-wb` — Sweepstakes Website
- **Purpose**: The Capture Caribbean sweepstakes entry site
- **Framework**: Angular 20 (standalone components)
- **Dev server**: `npx ng serve` (from `capture-caribbean-sweepstakes-wb/`)
- **Build**: `make build NPX=npx NODE=node`
- **Deploy dev**: `make deploy-dev NPX=npx NODE=node`
- **Deploy prod**: `make deploy NPX=npx NODE=node`
- **Cloudflare project**: `capture-caribbean-sweepstakes`
- **API**: Dev → `49124qqimj.execute-api.us-east-1.amazonaws.com`, Prod → `dbvxth6wi4.execute-api.us-east-1.amazonaws.com`
- **Mailchimp**: Entrants tagged `Sweepstakes Entrant` on successful submission

---

## Cloudflare Deployment — `photojomo-first-wave-wb`

### Target: Cloudflare Pages (static hosting)
Angular builds to a static bundle — no server-side rendering. Cloudflare Pages serves the `dist/` output directly.

### Build output
- Command: `npx ng build` (run from `photojomo-first-wave-wb/`)
- Output directory: `photojomo-first-wave-wb/dist/photojomo-first-wave-wb/browser`
- Node version required: **20.19.6** (set via `.nvmrc` or Cloudflare Pages env var `NODE_VERSION=20.19.6`)

### SPA routing fix (critical)
Angular uses client-side routing. Cloudflare Pages needs a `_redirects` file in the output root to avoid 404s on direct URL access or refresh:
```
/* /index.html 200
```
This file should be placed in `photojomo-first-wave-wb/public/` (Angular copies `public/` contents to the build output root automatically).

### Cloudflare account
- **Account**: Jkenyatta@gmail.com
- **Account ID**: `e6a409663bf73140c8bd4caaadd9ebc2`
- **Project name**: `capture-caribbean-first-wave`
- **Pages URL**: https://capture-caribbean-first-wave.pages.dev

### Deploy via Wrangler (current method)
```bash
# From repo root
cd photojomo-first-wave-wb && nvm use 20.19.6 && npx ng build
CLOUDFLARE_ACCOUNT_ID=e6a409663bf73140c8bd4caaadd9ebc2 wrangler pages deploy dist/photojomo-first-wave-wb/browser --project-name capture-caribbean-first-wave --commit-dirty=true
```

### GitHub integration (alternative, not yet set up)
Connect repo to Cloudflare Pages dashboard with these settings:
- **Build command**: `cd photojomo-first-wave-wb && npx ng build`
- **Build output directory**: `photojomo-first-wave-wb/dist/photojomo-first-wave-wb/browser`
- **Root directory**: `/` (repo root)
- **Environment variable**: `NODE_VERSION = 20.19.6`

### Not yet implemented
- Payment processing (Stripe/PayPal) — will require Cloudflare Workers for server-side logic
- Auth/membership system
- Image upload handling (likely Cloudflare R2 + Workers)
