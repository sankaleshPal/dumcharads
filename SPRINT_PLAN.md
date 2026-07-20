# Sprint Plan v2 — Dumb Charades

**Status today:** v1 gameplay works end-to-end on emulator. This plan covers polish → updates infra → release.

---

## ✅ Done (Sprints 1–3 equivalent)

Scaffold, SQLite download flow, signup/avatars, year filter (single/range), EN/हिंदी toggle, turn timer, Next/Skip rules (3rd skip ends turn), no-repeat guarantee, scoreboard.

## ✅ Sprint 4 — UX & Premium Feel (just shipped)

- **Navigation fixed:** hardware back + ✕ button in game → "Leave game?" confirmation (no more being stuck); back arrows on Setup/Download; swipe-back disabled only during gameplay.
- **Design system:** synthwave palette (deep violet + neon amber/pink/cyan), Fredoka + Nunito fonts, gradient backgrounds, glow shadows, bordered cards.
- **Animations:** card pop-in per movie, green flash + floating "+1 🎉" on guessed, shake on skip, timer pulse + haptic in last 30s, button press-spring, trophy bounce + row fade on results, splash logo spring.

After `git pull` / these changes, run:
```bash
npx expo install expo-linear-gradient expo-font @expo-google-fonts/fredoka @expo-google-fonts/nunito
npx expo start -c
```

## Sprint 5 — Updates Infrastructure (1 week)  ← NEXT

Goal: push new games/content to prod and users get them automatically.

| Story | How |
|---|---|
| OTA updates for JS/UI changes | `expo-updates` + EAS Update: `eas update --branch production` — users get new JS on next app restart, **no Play Store release needed**. New games (they're just JS screens + data) ship this way. |
| "Update available" prompt in-app | On app start, `Updates.checkForUpdateAsync()` → if available: snackbar "New games available! Restart to update" → `Updates.reloadAsync()` |
| Movie DB updates | Already versioned — bump `version` in movies.json; Home shows "Update data" badge |
| Native/store updates notification | For versions needing a store release (new native modules): on launch compare app version against a `latest-version.json` you host → dialog "New version on Play Store" → deep link to store listing |
| Push notifications (optional) | `expo-notifications` + EAS — announce "🎤 Antakshari is here!" to all installs |

## Sprint 6 — Multi-Game Architecture (1 week)

- Home becomes a game grid driven by a `games` registry (id, title, emoji, route, dataUrl, minDataVersion).
- Each game = its own route group + its own data table; shared components (timer, teams, scoreboard) extracted to `src/game-kit/`.
- Antakshari v0 as proof: first-letter chain + song DB (same download pattern).
- Real 3D avatar PNGs replace emoji; app icon + splash art; sounds (win jingle, tick, skip buzz) via `expo-av`.

## Sprint 7 — Release (overlaps 14-day closed testing)

- QA matrix (Android 8/11/14), performance pass, `eas build --profile production`.
- Store listing (EN + HI), privacy policy, data safety.
- Closed testing: 12+ testers × 14 consecutive days → apply for production.
- Post-launch: `eas update` becomes your weekly ship channel.

### Notes

- **Prod update flow you asked about:** JS-only changes (new games, UI, movie data) → `eas update` → users auto-get it on restart, with the in-app "restart to update" prompt from Sprint 5. Only native changes need a new AAB + store review.
- Keep `runtimeVersion` policy `appVersion` in app.json so OTA updates never hit an incompatible binary.
