<div align="center">

# আলফাজ (Alfaz) — Arabic ↔ Bangla Vocabulary

**An interactive Arabic-to-Bangla vocabulary learning app with pronunciation, antonyms, categories, flashcards, and per-user memorization tracking.**

[![CI](https://github.com/ami-nai/alfaz-arabic-to-bangla-vocabulary/actions/workflows/ci.yml/badge.svg)](https://github.com/ami-nai/alfaz-arabic-to-bangla-vocabulary/actions/workflows/ci.yml)
[![Deployed on Vercel](https://img.shields.io/badge/deployed-Vercel-black?logo=vercel&logoColor=white)](https://alfaz-pi.vercel.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](#license)

**Live app:** <https://alfaz-pi.vercel.app>

</div>

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [CI/CD](#cicd)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Arabic ↔ Bangla vocabulary** — Arabic words with full diacritics (harakat), Bangla meanings, Bengali transliteration, antonyms, example sentences, and categories (numbers, food, family, Quranic, nature, time, greetings, and more).
- **Three study views** — responsive **table**, **card grid**, and a flip-animated **flashcard practice** mode with shuffle.
- **Memorization tracking** — mark words as "মুখস্থ" (memorized), filter by status, and watch your progress % in the header and stats cards.
- **Per-user cloud sync** — memorization progress is stored per account via Supabase, with an offline-capable `localStorage` cache.
- **Authentication** — **Google OAuth** via Supabase Auth.
- **Search & filters** — live search across Arabic and Bangla, plus memorized-status filtering.
- **Infinite scroll** — large lists load incrementally as you scroll instead of rendering all at once.
- **New-words sync** — detects newly added words and shows a banner so users can pull the latest dataset while preserving their progress.
- **Import / Export** — backup or migrate your vocabulary as JSON.
- **Bilingual typography** — Amiri & Scheherazade New (Arabic), Hind Siliguri (Bangla), plus a warm, responsive Tailwind UI.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 6, Tailwind CSS 4, Motion (Framer Motion), lucide-react |
| **Backend** | Express 4 (Node), Esbuild server bundle |
| **Database / Auth** | Supabase (Postgres + Auth + REST) |
| **Runtime / Tooling** | Bun (install & dev), Node.js 22+ (production), tsx |
| **CI/CD** | GitHub Actions (CI), Vercel (deploy) |

---

## Architecture

```
┌───────────────────────────────┐
│        Browser (React SPA)     │
│  Table · Cards · Flashcards    │
└───────────┬───────────────────┘
            │
            ▼
┌───────────────────────────────┐
│        Express server          │   Node.js
│  • Serves built SPA (prod)     │
│  • Vite middleware (dev)       │
│  • GET  /api/health            │
└───────┬───────────────┬───────┘
        │               │
        ▼               ▼
   ┌─────────┐    ┌──────────────┐
   │ Supabase│    │ LocalStorage │  offline cache,
   │ Auth +  │    │ (per-user)   │  instant first paint
   │ Postgres│    └──────────────┘
   └─────────┘
```

Key design decisions:

- **Data flow:** the app loads words into client state, caches them per-user in `localStorage` for instant rendering, then syncs with Supabase. Memorization lives in a `user_word_progress` junction table keyed by `(user_id, word_id)`.
- **Progressive rendering:** lists use client-side infinite scroll — all data is loaded for search/filter correctness, but only a window of rows is rendered at a time.

---

## Getting Started

### Prerequisites

- **Node.js 22+** (or **Bun 1.x**, recommended)
- A **Supabase** project (for auth + database)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/ami-nai/alfaz-arabic-to-bangla-vocabulary.git
cd arabic-to-bangla-vocabulary

# 2. Install dependencies (Bun recommended — bun.lock included)
bun install
# or: npm install
```

### Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Required | Scope | Description |
|---|---|---|---|
| `VITE_SUPABASE_URL` | ✅ (for auth/data) | Client (build-time) | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ (for auth/data) | Client (build-time) | Supabase anon/publishable key |
| `APP_URL` | ⛔ Optional | Server | Public URL of the deployed app |
| `PORT` | ⛔ Optional | Server | Port override (platforms inject this) |

> **Note:** `VITE_*` variables are baked into the client bundle at **build time**. Changes to them require a rebuild.

### Running Locally

```bash
bun run dev
# or: npm run dev
```

Open <http://localhost:3000>.

- The dev server runs the Express server with Vite middleware (`NODE_ENV=development`).
- The `/api/health` endpoint confirms the server is alive.
- If Supabase isn't configured, the app still renders but shows a "connection" warning and disables login.

---

## Available Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start the dev server (Express + Vite HMR) on port 3000 |
| `bun run lint` | Type-check the project (`tsc --noEmit`) |
| `bun run build` | Production build: Vite client + bundled Express server (`dist/`) |
| `bun start` | Run the production server (`node dist/server.cjs`) |
| `bun run clean` | Remove the `dist/` build output |

---

## Project Structure

```
├── server.ts                    # Express server + SPA serving
├── railway.json                 # Railway build/deploy config
├── vite.config.ts               # Vite + Tailwind + React config
├── tsconfig.json
├── package.json / bun.lock
└── src/
    ├── main.tsx                 # React entry point
    ├── App.tsx                  # Root app: state, filters, routing between views
    ├── index.css                # Tailwind + custom fonts/utilities
    ├── types/word.ts            # Word model & view types
    ├── services/storage.ts      # Data layer: Supabase sync + localStorage cache
    ├── lib/supabase.ts          # Supabase client bootstrap
    ├── context/AuthContext.tsx  # Auth provider (email + Google OAuth)
    └── components/
        ├── Header.tsx           # Brand, progress, user menu
        ├── StatsCard.tsx        # Total / memorized / remaining stats
        ├── CategoryFilter.tsx   # Search + view mode + memorized filter
        ├── WordTable.tsx        # Table view
        ├── WordCard.tsx         # Card grid view
        ├── FlashcardMode.tsx    # Flip-card practice mode
        ├── LoginScreen.tsx      # Sign in / sign up UI
        └── NewWordsBanner.tsx   # New words sync notification
```

---

## Database Schema

Tables used by the app in your Supabase project:

### `words` — the vocabulary dictionary

| Column | Type | Notes |
|---|---|---|
| `id` | text | Primary key (e.g. `w-89`) |
| `arabic` | text | Arabic word with diacritics |
| `bangla_meaning` | text | Bangla translation |
| `transliteration` | text | Bengali phonetic pronunciation |
| `antonym_arabic` / `antonym_bangla` | text | Opposite word (optional) |
| `category` | text | e.g. বিশেষ্য, কুরআনিক শব্দ, সংখ্যা… |
| `example_arabic` / `example_bangla` | text | Example sentence (optional) |
| `created_at` | timestamptz | |

### `user_word_progress` — per-user memorization

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid | References `auth.users.id` |
| `word_id` | text | References `words.id` |
| `status` | text | `memorized` / `learning` |
| `is_memorized` | boolean | |
| `last_reviewed_at` | timestamptz | |

Unique constraint: `(user_id, word_id)`.

### `app_announcements` — *(optional)* admin broadcasts

| Column | Type |
|---|---|
| `id` | text |
| `message` | text |
| `created_at` | timestamptz |

> If this table isn't created, admin announcements gracefully fall back to `localStorage` only.

---


## CI/CD

| Stage | Tool | What it does |
|---|---|---|
| **CI** | GitHub Actions (`.github/workflows/ci.yml`) | On push/PR: install → lint/typecheck → production build |
| **CD** | Vercel | Builds the frontend using `vercel.json` |

The CI workflow needs these repository **secrets** to build with real values (optional — build passes without them):

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Add them at GitHub → **Settings → Secrets and variables → Actions**.

---

## Deployment

### Vercel (current)

The live app is https://alfaz-pi.vercel.app. Vercel uses `vercel.json` to build
and serve the static frontend. Set the Supabase `VITE_*` variables before building.
Add this domain to Supabase Auth's Site URL and redirect allowlist. The Express
server and `/api/health` are only used for local development or Node hosting.
AI enrichment has been removed; remove any old `GEMINI_API_KEY` from hosting
settings and revoke that unused key in the provider dashboard.

### Authentication configuration

The app uses Google sign-in only. In Supabase Authentication provider settings,
disable the Email provider and keep Google enabled. Leave new-user signup enabled
so first-time Google users can create accounts. Removing forms from the app does
not disable the Email provider in the hosted Supabase project.

### Database access control (required before release)

Apply `supabase/migrations/202611120001_access_control.sql` in the Supabase SQL
editor as the database owner. This enables row-level security, restricts progress
to the owning account, and makes shared words/announcements read-only for app
users. Existing permissive policies cannot bypass the new restrictive guards.
Maintain dictionary content through the dashboard or a trusted service role.
The migration does not change vocabulary or progress data.

This migration has to be applied to your actual project; a successful frontend
build does not apply it. Verify with two test accounts that each can create,
read, update and reset its own progress, cannot read/change the other's progress,
and cannot write to `words` or `app_announcements`. Also check anonymous access
is denied. The progress table must have a unique `(user_id, word_id)` constraint
and the columns documented below.

### Existing progress behavior

Progress changes now wait for server confirmation. If saving fails, the previous
state stays visible and an error asks the user to retry. Cached words remain
readable offline, but changing progress and resetting require a connection.
A failed progress fetch preserves the cache. Account changes clear the old UI,
and all dictionary/progress pages are fetched instead of only the first page.

Run `npm test`, `npm run lint`, and `npm run build` before deployment. Tests mock
the database to cover save/reset failures, account isolation and pagination;
they do not replace verifying deployed Supabase policies and login flows.

### Railway (optional Node hosting)

1. Create a project in Railway and **Deploy from GitHub repo** (`ami-nai/alfaz-arabic-to-bangla-vocabulary`).
2. Railway uses `railway.json` (Nixpacks): builds with `npm run build`, starts with `npm start`, health-checks `/api/health`.
3. Set environment variables in Railway (**Variables**):

```
NODE_ENV=production
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

4. Generate a domain under **Settings → Networking**.
5. Add the public URL to Supabase → **Authentication → URL Configuration → Redirect URLs** so Google OAuth works on the deployed domain.

### Other platforms

Any Node.js host that supports a start command works, e.g. Render, Fly.io, or Cloud Run. The server serves the built SPA from `dist/` when `NODE_ENV` is anything other than `development`.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `400 PGRST204: Could not find the 'is_memorized' column` | Ensure `words` has no `is_memorized` column — memorization lives only in `user_word_progress` (intentional) |
| Google sign-in fails on the deployed domain | Add the app URL to Supabase Auth redirect URLs |
| `Blocked request. This host is not allowed` | Server must run with `NODE_ENV` **not** equal to `development` in production |
| Nixpacks tries Node 18 | `package.json` pins `"engines": { "node": "22" }` |
| Words don't appear | Verify Supabase URL/anon key are set **before** building; check the `words` table exists and is queryable |

---

## Roadmap

- [ ] Custom Google OAuth client (hide the Supabase-branded consent screen)
- [ ] Sound / pronunciation playback
- [ ] Spaced-repetition scheduling for flashcards
- [ ] Shareable progress / streaks
- [ ] PWA support (offline install)

---

## Contributing

Contributions are welcome! To keep things smooth:

1. Fork the repo and create a feature branch.
2. Run `bun run lint` and `bun run build` and ensure they pass.
3. Open a pull request against `main`.
4. Include Supabase schema changes (if any) in the PR description.

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details. *(Add a `LICENSE` file if you intend to distribute.)*

---

<div align="center">

Built by **Md. Shahriar Alam** · Powered by React, Supabase & Vercel

</div>
