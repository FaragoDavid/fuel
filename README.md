# fuel

Personal fuel cost tracker. Live at [faragodavid.github.io/fuel/](https://faragodavid.github.io/fuel/).

## Stack

React + TypeScript + Vite + Tailwind 4. Data stored in Firestore, auth via Google.

## Dev setup

```bash
npm install
npm run dev
```

In dev mode auth is bypassed and all data is stored in localStorage — no Firebase credentials needed.

## Deployment

Pushes to `main` trigger a GitHub Actions build and deploy to GitHub Pages. Requires `VITE_FIREBASE_API_KEY` set as a repository secret.
