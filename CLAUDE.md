# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # dev server at http://localhost:5174/
npm run build    # production build → docs/
npm run preview  # preview production build
```

## Architecture

Single-screen React + TypeScript + Vite + Tailwind 4 app. No router.

**Data flow:**

- `public/fillups.json` — the source of truth; committed to the repo and served statically
- `src/services/github.ts` — `readFillups()` fetches the JSON, `writeFillups()` commits it back via the GitHub Contents API
- In dev (`import.meta.env.DEV`), both functions use `localStorage` instead — no GitHub token needed
- `km/l` and `l/100km` are derived at render time from `liters` and `tripKm`; never stored

**Environment variables** (prod only, baked into the build):

- `VITE_GITHUB_TOKEN` — fine-grained PAT with Contents read+write on this repo
- `VITE_GITHUB_REPO` — e.g. `your-username/fuel`

**Deployment:** builds to `docs/`, served from GitHub Pages at `/fuel/`.

## Data model

`src/types/fillup.ts` — all fields except `id` and `date` are optional since the spreadsheet has many partial entries.

```ts
{ id, date, totalCost?, liters?, tripKm?, odometer? }
```

IDs are generated client-side with `generateId()` in `src/utils/fillup.ts`.
