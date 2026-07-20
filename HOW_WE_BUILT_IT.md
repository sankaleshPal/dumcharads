# How We Built Dumb Charades 🎭

A complete walkthrough of the app's concept, architecture, game logic, data pipeline, and design system.

**Author:** Sankalesh Harak · **Stack:** React Native + Expo · **Platform:** Android

---

## 1. The Concept

A family party game app that works **fully offline** after a one-time setup. The first game is Dumb Charades with Bollywood movies (1980–2026). The core idea driving every technical decision: *a family sitting together with one phone, possibly with bad internet, should never be interrupted mid-game.*

That single constraint produced the three pillars of the architecture:

1. **Offline-first** — all game data lives in SQLite on the device.
2. **Data downloaded, not bundled** — the APK stays small; the movie database (1,400+ entries, growable to 10,000+) is fetched once from a free server.
3. **Extensible shell** — the home screen is a grid of game cards; future games (Antakshari, quizzes) plug in without restructuring.

## 2. Architecture Overview

```
┌────────────────────────┐        one-time download        ┌──────────────────────┐
│  GitHub repo (free CDN)│ ───────────────────────────────▶│  Phone               │
│  data/movies.json      │   raw.githubusercontent.com     │  expo-sqlite DB      │
│  version: 1            │                                  │  (internal storage)  │
└────────────────────────┘                                  └──────────┬───────────┘
                                                                       │ all gameplay
                                                                       │ queries (offline)
                                                            ┌──────────▼───────────┐
                                                            │  React Native app    │
                                                            │  expo-router screens │
                                                            │  Zustand state       │
                                                            └──────────────────────┘
```

**Why GitHub raw as the server?** The repo is public, so `raw.githubusercontent.com/.../data/movies.json` is a free, versioned, zero-maintenance CDN. Updating the database = commit + push.

**Why expo-sqlite?** It stores the DB inside the app's private internal storage (`/data/data/com.sankalesh.dumcharads/`) — the correct, permission-free way to use phone storage. No storage permission prompts, survives app restarts, fast indexed queries.

## 3. The Data Pipeline

### 3.1 Dataset

Each movie is: `{ id, movieName, movieNameHindi, year, cast: [{role: "hero"|"heroine", name}] }`.

- **Curated seed:** ~1,400 movies (1980–2026) hand-assembled year by year, recent releases verified via web research.
- **Scaling to 10k+:** `data/fetch-movies-tmdb.js` — a Node script that walks TMDB's discover API for every Hindi film per year, pulls top-billed cast split by gender into hero/heroine, and grabs the Devanagari title from `original_title`. Output replaces `movies.json`.
- **Versioning:** the JSON carries a `version` number. The app stores the installed version in a `meta` table; a higher server version triggers the "Update data" flow.

### 3.2 Download flow (`src/db.ts → downloadMovies`)

1. `fetch(DATA_URL)` → parse JSON.
2. Compare `version` with local `meta.dataVersion` — bail early with "Already up to date".
3. `DELETE FROM movies`, then insert in **batched transactions (500 rows/tx)** — batching turns a 10k-row insert from ~30s of row-by-row commits into a few seconds.
4. Save `dataVersion` + `downloadedAt` to `meta`.

Progress is surfaced in two phases (downloading → saving %) so the user always sees movement.

### 3.3 SQLite schema

```sql
users  (id, name, avatarId, createdAt)          -- local profile, no backend auth
movies (id, movieName, movieNameHindi, year,
        cast TEXT,          -- JSON string of the cast array
        used INTEGER)       -- no-repeat flag, reset per game
meta   (key, value)         -- dataVersion, downloadedAt
scores (id, playedAt, teamAName, teamAScore, teamBName, teamBScore)
```

`cast` is stored as a JSON string — simplest schema that still allows `json_extract` later. `idx_movies_year` index makes the year-filter queries instant.

## 4. Screen Flow & Navigation

```
Splash → Signup (once) → Home → [Download if no data] → Setup → Game → Result
```

- **expo-router** file-based routing: each file in `app/` is a screen.
- **Splash** auto-advances after 2.5s; if a profile exists in `users`, signup is skipped forever.
- **Signup is local-only** — name + avatar into SQLite. No account, no network, no friction.
- **Navigation guards:** during gameplay, swipe-back is disabled (`gestureEnabled: false`) and the hardware back button is intercepted by `BackHandler` → "Leave game? Current scores will be lost." confirmation. Every non-game screen has a corner back button. Rule: *the user can always get out, but never by accident.*

## 5. Game Logic (the heart of it)

All in `app/game.tsx`, driven by a small state machine: `ready → playing → turnOver | gameOver | poolEmpty`.

### 5.1 Turn structure

- Timer is chosen **before the game** (5/10/15 min) — each player gets the full timer for their turn.
- Teams alternate turns; `turnIdx % 2` picks the team; `roundsPerTeam × 2` total turns.

### 5.2 The three rules

1. **Next (unlimited):** when the team guesses the movie, actor taps "Guessed ✓" → +1 point → a new movie appears. As many as time allows.
2. **Skip (max 3):** discards the movie without a point. On the **3rd skip the timer is force-set to zero** and the turn ends with "All chances used!" — implemented by literally setting `secondsLeft = 0` and calling `endTurn("skips")`.
3. **No repeats:** the selection query is

   ```sql
   SELECT * FROM movies
   WHERE used = 0 AND year BETWEEN ? AND ?
   ORDER BY RANDOM() LIMIT 1
   ```

   and the movie is marked `used = 1` **the moment it is displayed** — whether it's later guessed or skipped. So nothing repeats within a game. `resetUsed()` clears the flags when a new game starts. If the filtered pool empties mid-game, the game ends early with "All movies used!".

### 5.3 Pass-the-phone secrecy

The movie card is hidden behind a **press-and-hold reveal** (`onPressIn`/`onPressOut`): only the actor holding the phone sees the name. Release = hidden again.

### 5.4 Year filter & language

Setup writes `yearFrom/yearTo` (single year = both equal) into the Zustand store; a live count query shows "X movies ready" before starting. Language toggle (EN / हिंदी / Both) simply controls which title lines render on the card.

## 6. State Management

**Zustand** — one small store (`src/store.ts`): user profile, game settings (timer, rounds, year range, language, maxSkips), and the two teams with scores. Everything persistent lives in SQLite; Zustand holds only session state. No Redux ceremony needed at this size.

## 7. The Theme — "Game Night Synthwave"

Chosen via a design-intelligence pass (ui-ux-pro-max): for *gaming/entertainment/family*, the recommendation was a retro-futurist, playful, dark-focused style with rounded typography — adapted into:

### 7.1 Palette (`src/constants.ts`)

| Token | Value | Role |
|---|---|---|
| `bg` / `bgGradient` | `#0d0620` ← `#1c0f45` | deep-violet stage, gradient on every screen |
| `card` / `cardBorder` | `#231447` / `#3b2a6e` | elevated surfaces with visible edge |
| `accent` | `#ffb020` | neon amber — all CTAs |
| `pink` / `cyan` | `#ff2d78` / `#00d4ff` | team identities + glow shadows |
| `green` / `red` | `#2fe07c` / `#ff4d5e` | guessed / skip semantics |
| `text` / `dim` | `#f7f4ff` / `#9d8fd0` | 4.5:1+ contrast on the dark stage |

Dark theme is deliberate: party games are played in the evening, in living rooms — a bright white screen would be a flashlight in everyone's face.

### 7.2 Typography

- **Fredoka (600/700)** — display font: rounded, chunky, toy-like. Titles, timers, buttons.
- **Nunito (500/700)** — body font: soft and highly readable at small sizes.
- Loaded via `@expo-google-fonts` in `_layout.tsx`; the app renders a blank stage until fonts are ready (no flash of wrong font).

### 7.3 Reusable UI kit (`src/ui.tsx`)

`Screen` (gradient stage) · `GlowButton` (press-spring scale + colored glow shadow + haptic) · `CornerButton` (back/✕) · `Title` · `GlowCard`. Every screen composes these — consistency comes from the kit, not from copy-pasted styles.

## 8. Motion & Feedback (why it feels like a game)

Principle: **motion conveys meaning** — every animation answers "what just happened?"

| Moment | Animation | Feedback |
|---|---|---|
| New movie appears | card pop-in (spring scale 0.8→1) | — |
| **Guessed ✓** | green flash overlay + floating **"+1 🎉"** rising and fading | success haptic |
| Skip | horizontal card shake (12px sequence) | error haptic |
| Last 30 seconds | timer pulses (scale 1→1.15) each second, turns red | light tick haptic |
| Turn ends | — | warning haptic |
| Winner screen | trophy bounce loop + glow, score rows fade in | success haptic |
| Any button | press-in spring to 0.94, release spring back | medium impact |
| Splash | logo spring-pop + title fade | — |

All built with React Native's built-in `Animated` API on the **native driver** (`useNativeDriver: true`) — 60fps without the Reanimated config overhead. Durations sit in the 150–700ms band; celebration is the longest, taps are the shortest.

## 9. Update Strategy (how prod updates reach users)

Two independent channels:

1. **Content:** movie DB updates ride the existing `version` check — push a new `movies.json` to GitHub, users see "Update data" on the Home card.
2. **App/JS (new games, UI):** EAS Update (`eas update --branch production`) — because new games are pure JS + data, they ship **over-the-air**: users get them on next app restart, prompted by an in-app "New games available — restart to update" snackbar (Sprint 5). Only native-module changes require a new AAB through Play Store review.

## 10. Key Decisions Recap

| Decision | Why |
|---|---|
| Expo over bare RN | matches existing skills, EAS builds, OTA updates for free |
| SQLite over AsyncStorage | 10k rows, indexed year queries, transactional bulk insert |
| GitHub raw over a real backend | zero cost, zero ops, versioned by git |
| `used` flag in DB (not memory) | survives screen remounts; single source of truth for no-repeats |
| Mark used on *display* not on *guess* | a skipped movie is also "burned" — it must never come back |
| Force timer to 0 on 3rd skip | makes "all chances end" a visible, dramatic moment rather than a silent rule |
| Built-in Animated over Reanimated | native-driver springs cover everything needed; one less babel plugin to break |
| Local signup, no auth | it's a living-room game; accounts add friction and privacy burden for nothing |

## 11. File Map

```
app/
  _layout.tsx    fonts + Stack config (gameplay gesture lock)
  index.tsx      splash (auto-route by profile existence)
  signup.tsx     local profile + avatar picker
  home.tsx       game cards + data-state badge
  download.tsx   JSON → SQLite with progress
  setup.tsx      teams, timer, rounds, year filter, language
  game.tsx       turn state machine + all gameplay animation
  result.tsx     winner + score persistence
src/
  constants.ts   palette, fonts, data URL, game constants
  ui.tsx         reusable themed components
  db.ts          SQLite service (schema, download, gameplay queries)
  store.ts       Zustand session state
  types.ts       Movie / Team / Settings types
data/
  movies.json           the shipped database (v1)
  fetch-movies-tmdb.js  scale-to-10k script
```
