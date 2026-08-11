<div align="center">

# আলফাজ (Alfaz) — Arabic ↔ Bangla Vocabulary

**An interactive Arabic-to-Bangla vocabulary learning app with pronunciation, antonyms, categories, flashcards, and per-user memorization tracking.**

[![CI](https://github.com/ami-nai/alfaz-arabic-to-bangla-vocabulary/actions/workflows/ci.yml/badge.svg)](https://github.com/ami-nai/alfaz-arabic-to-bangla-vocabulary/actions/workflows/ci.yml)
[![Deployed on Railway](https://img.shields.io/badge/deployed-Railway-0B0D0E?logo=railway&logoColor=white)](https://alfaz.up.railway.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](#license)

**Live app:** <https://alfaz.up.railway.app>

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
- [AI Enrichment](#ai-enrichment)
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
- **Authentication** — email/password and **Google OAuth** via Supabase Auth.
- **Search & filters** — live search across Arabic and Bangla, plus memorized-status filtering.
- **Infinite scroll** — large lists load incrementally as you scroll instead of rendering all at once.
- **New-words sync** — detects newly added words and shows a banner so users can pull the latest dataset while preserving their progress.
- **AI-assisted word enrichment** *(optional)* — a server-side Gemini endpoint auto-generates detailed vocabulary entries for new words.
- **Import / Export** — backup or migrate your vocabulary as JSON.
- **Bilingual typography** — Amiri & Scheherazade New (Arabic), Hind Siliguri (Bangla), plus a warm, responsive Tailwind UI.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 6, Tailwind CSS 4, Motion (Framer Motion), lucide-react |
| **Backend** | Express 4 (Node), Esbuild server bundle |
| **AI** | Google Gemini (`@google/genai`) — model fallback chain |
| **Database / Auth** | Supabase (Postgres + Auth + REST) |
| **Runtime / Tooling** | Bun (install & dev), Node.js 22+ (production), tsx |
| **CI/CD** | GitHub Actions (CI), Railway (deploy) |

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
│  • POST /api/ai/enrich-word    │   → Gemini API (server-side, key hidden)
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
- **Server proxying:** Gemini API calls go through the Express server so the API key is never exposed to the browser.
- **Progressive rendering:** lists use client-side infinite scroll — all data is loaded for search/filter correctness, but only a window of rows is rendered at a time.

---

## Getting Started

### Prerequisites

- **Node.js 22+** (or **Bun 1.x**, recommended)
- A **Supabase** project (for auth + database)
- *(Optional)* A **Gemini API key** for AI enrichment

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
| `GEMINI_API_KEY` | ⛔ Optional | Server (runtime) | Gemini key for AI word enrichment |
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
├── server.ts                    # Express server + Gemini proxy + SPA serving
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
        ├── AuthModal.tsx        # (Legacy) auth modal
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

## AI Enrichment

`POST /api/ai/enrich-word` accepts `{ "arabicWord", "banglaMeaning" }` and returns a structured JSON vocabulary entry (Arabic with harakat, Bengali transliteration, meaning, antonym, category, and example sentences).

- Uses a model fallback chain: `gemini-2.5-flash` → `gemini-2.0-flash` → `gemini-1.5-flash`.
- Returns user-friendly Bangla error messages when the quota is exhausted or the service is unreachable — the form can still be filled in manually.

---

## CI/CD

| Stage | Tool | What it does |
|---|---|---|
| **CI** | GitHub Actions (`.github/workflows/ci.yml`) | On push/PR: install → lint/typecheck → production build |
| **CD** | Railway | On push to `main`: pulls the repo, builds from `railway.json`, deploys to `https://alfaz.up.railway.app` |

The CI workflow needs these repository **secrets** to build with real values (optional — build passes without them):

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Add them at GitHub → **Settings → Secrets and variables → Actions**.

---

## Deployment

### Railway (current setup)

1. Create a project in Railway and **Deploy from GitHub repo** (`ami-nai/alfaz-arabic-to-bangla-vocabulary`).
2. Railway uses `railway.json` (Nixpacks): builds with `npm run build`, starts with `npm start`, health-checks `/api/health`.
3. Set environment variables in Railway (**Variables**):

```
NODE_ENV=production
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
GEMINI_API_KEY=...          # optional
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
| Gemini enrich returns an error | `GEMINI_API_KEY` missing or daily quota exhausted — the UI falls back to manual entry |

---

## Roadmap

- [ ] Custom Google OAuth client (hide the Supabase-branded consent screen)
- [ ] Sound / pronunciation playback
- [ ] Spaced-repetition scheduling for flashcards
- [ ] Admin UI for adding words with AI enrichment
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

Built by **Md. Shahriar Alam** · Powered by React, Supabase, Gemini & Railway

</div>
