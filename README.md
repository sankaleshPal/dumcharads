# 🎭 Dumb Charades — Family Party Game

Offline-first Android game built with React Native + Expo. Bollywood movie database (1980–2026) downloads once from this repo and lives in SQLite on the phone.

**Made by Sankalesh Harak**

## Features

- Local signup with cute avatars (no account, no backend)
- One-time "Download all resources" → 1,400+ movies into `expo-sqlite` (10k+ after TMDB fetch)
- Year filter: single year or range (e.g., 1990–2005) with live movie count
- Movie names in English + हिंदी (toggle: EN / HI / Both)
- Configurable turn timer (5/10/15 min per player)
- Unlimited "Guessed ✓ Next" within the timer · Max 3 skips — 3rd skip ends the turn instantly
- Movies never repeat within a game
- Team scoreboard, winner screen, score history

## Run locally

```bash
npm install
npx expo start          # scan QR with Expo Go (Android)
```

## Data

- App downloads `data/movies.json` from this repo (GitHub raw) — see `src/constants.ts`.
- To grow the dataset to 10,000+ movies with Hindi titles:
  ```bash
  TMDB_TOKEN="your_tmdb_v4_token" node data/fetch-movies-tmdb.js
  # replaces data/movies.json → commit & push → bump "version" in the JSON
  ```

## Build for Play Store

```bash
npm i -g eas-cli && eas login
eas build -p android --profile preview      # APK for testing
eas build -p android --profile production   # AAB for Play Store
```

See `PlayStore_Deployment_Guide.md` in the project docs.

## Structure

```
app/          screens (expo-router)
  index.tsx     welcome/splash
  signup.tsx    local signup + avatar
  home.tsx      game cards
  download.tsx  resources → SQLite
  setup.tsx     teams, timer, year filter, language
  game.tsx      turn gameplay (Next / Skip / timer)
  result.tsx    scoreboard + winner
src/          db.ts (SQLite), store.ts (Zustand), constants, types
data/         movies.json + TMDB fetch script
```
