import * as SQLite from "expo-sqlite";
import type { Movie } from "./types";

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb() {
  if (!db) {
    db = await SQLite.openDatabaseAsync("dumcharads.db");
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        avatarId INTEGER NOT NULL,
        createdAt TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS movies (
        id INTEGER PRIMARY KEY,
        movieName TEXT NOT NULL,
        movieNameHindi TEXT,
        year INTEGER NOT NULL,
        cast TEXT NOT NULL,
        used INTEGER DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_movies_year ON movies(year);
      CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
      CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        playedAt TEXT DEFAULT (datetime('now')),
        teamAName TEXT, teamAScore INTEGER,
        teamBName TEXT, teamBScore INTEGER
      );
    `);
  }
  return db;
}

// ---------- user ----------
export async function getUser() {
  const d = await getDb();
  return d.getFirstAsync<{ id: number; name: string; avatarId: number }>(
    "SELECT * FROM users ORDER BY id DESC LIMIT 1"
  );
}

export async function saveUser(name: string, avatarId: number) {
  const d = await getDb();
  await d.runAsync("INSERT INTO users (name, avatarId) VALUES (?, ?)", name, avatarId);
}

// ---------- meta ----------
export async function getMeta(key: string) {
  const d = await getDb();
  const row = await d.getFirstAsync<{ value: string }>("SELECT value FROM meta WHERE key = ?", key);
  return row?.value ?? null;
}

export async function setMeta(key: string, value: string) {
  const d = await getDb();
  await d.runAsync("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)", key, value);
}

// ---------- movies: download & insert ----------
export async function downloadMovies(
  url: string,
  onProgress: (phase: "download" | "insert", pct: number) => void
) {
  onProgress("download", 0);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const data: { version: number; movies: Movie[] } = await res.json();
  onProgress("download", 100);

  const localVersion = Number((await getMeta("dataVersion")) ?? 0);
  if (data.version <= localVersion) return { updated: false, count: 0 };

  const d = await getDb();
  await d.runAsync("DELETE FROM movies");
  const BATCH = 500;
  for (let i = 0; i < data.movies.length; i += BATCH) {
    const chunk = data.movies.slice(i, i + BATCH);
    await d.withTransactionAsync(async () => {
      for (const m of chunk) {
        await d.runAsync(
          "INSERT OR REPLACE INTO movies (id, movieName, movieNameHindi, year, cast, used) VALUES (?, ?, ?, ?, ?, 0)",
          m.id, m.movieName, m.movieNameHindi ?? null, m.year, JSON.stringify(m.cast)
        );
      }
    });
    onProgress("insert", Math.round(((i + chunk.length) / data.movies.length) * 100));
  }
  await setMeta("dataVersion", String(data.version));
  await setMeta("downloadedAt", new Date().toISOString());
  return { updated: true, count: data.movies.length };
}

export async function movieCount(yearFrom?: number, yearTo?: number) {
  const d = await getDb();
  const row =
    yearFrom != null
      ? await d.getFirstAsync<{ n: number }>(
          "SELECT COUNT(*) n FROM movies WHERE year BETWEEN ? AND ?", yearFrom, yearTo ?? yearFrom)
      : await d.getFirstAsync<{ n: number }>("SELECT COUNT(*) n FROM movies");
  return row?.n ?? 0;
}

// ---------- gameplay ----------
/** Random unused movie in year range. Marks it used IMMEDIATELY so it never repeats this game. */
export async function nextMovie(yearFrom: number, yearTo: number): Promise<Movie | null> {
  const d = await getDb();
  const row = await d.getFirstAsync<any>(
    "SELECT * FROM movies WHERE used = 0 AND year BETWEEN ? AND ? ORDER BY RANDOM() LIMIT 1",
    yearFrom, yearTo
  );
  if (!row) return null;
  await d.runAsync("UPDATE movies SET used = 1 WHERE id = ?", row.id);
  return { ...row, cast: JSON.parse(row.cast) };
}

/** Call when a NEW game starts — clears no-repeat flags from the previous game. */
export async function resetUsed() {
  const d = await getDb();
  await d.runAsync("UPDATE movies SET used = 0");
}

export async function saveScore(a: string, aScore: number, b: string, bScore: number) {
  const d = await getDb();
  await d.runAsync(
    "INSERT INTO scores (teamAName, teamAScore, teamBName, teamBScore) VALUES (?, ?, ?, ?)",
    a, aScore, b, bScore
  );
}
