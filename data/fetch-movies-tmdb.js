/**
 * fetch-movies-tmdb.js
 * Builds the FULL Bollywood movies dataset (1980–2026, 10,000+ movies)
 * in the exact JSON format the Dumb Charades app expects.
 *
 * Setup (one time):
 *   1. Free account at https://www.themoviedb.org → Settings → API → get "API Read Access Token" (v4 bearer token)
 *   2. node >= 18 (uses built-in fetch)
 *
 * Run:
 *   TMDB_TOKEN="your_v4_token" node fetch-movies-tmdb.js
 *
 * Output: movies.json  →  { version, count, movies: [{ id, movieName, year, cast: [{role,name}] }] }
 * Upload it to your server/CDN; the app downloads it into SQLite.
 */

const TOKEN = process.env.TMDB_TOKEN;
if (!TOKEN) { console.error("Set TMDB_TOKEN env var"); process.exit(1); }

const BASE = "https://api.themoviedb.org/3";
const HEADERS = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };
const YEAR_FROM = 1980, YEAR_TO = 2026;
const MIN_VOTES = 5; // raise to 20+ for only well-known movies

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, { headers: HEADERS });
    if (res.status === 429) { await sleep(1500); continue; } // rate limit
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return res.json();
  }
  throw new Error(`Failed after retries: ${url}`);
}

// Discover all Hindi movies for a year (paginated, max 500 pages per query)
async function discoverYear(year) {
  const results = [];
  let page = 1, totalPages = 1;
  do {
    const url =
      `${BASE}/discover/movie?with_original_language=hi&region=IN` +
      `&primary_release_year=${year}&vote_count.gte=${MIN_VOTES}` +
      `&sort_by=popularity.desc&page=${page}`;
    const data = await get(url);
    totalPages = Math.min(data.total_pages, 500);
    results.push(...data.results);
    page++;
    await sleep(30); // stay well under TMDB rate limits (~40 req/s)
  } while (page <= totalPages);
  return results;
}

// Get lead cast (hero/heroine) from credits
async function getCast(movieId) {
  const data = await get(`${BASE}/movie/${movieId}/credits`);
  const cast = [];
  // Top-billed actors, split by gender: 2 = male (hero), 1 = female (heroine)
  for (const c of (data.cast || []).slice(0, 6)) {
    if (c.gender === 2 && cast.filter((x) => x.role === "hero").length < 2)
      cast.push({ role: "hero", name: c.name });
    if (c.gender === 1 && cast.filter((x) => x.role === "heroine").length < 2)
      cast.push({ role: "heroine", name: c.name });
    if (cast.length >= 4) break;
  }
  return cast;
}

(async () => {
  const movies = [];
  let id = 1;

  for (let year = YEAR_FROM; year <= YEAR_TO; year++) {
    const found = await discoverYear(year);
    console.log(`${year}: ${found.length} movies`);
    for (const m of found) {
      let cast = [];
      try { cast = await getCast(m.id); } catch (e) { /* skip cast on error */ }
      movies.push({
        id: id++,
        movieName: m.title,                 // English/transliterated title
        movieNameHindi: m.original_title,   // Devanagari title for Hindi films
        year,
        cast,
      });
      await sleep(30);
    }
    // checkpoint save every year so a crash doesn't lose progress
    const out = { version: 1, count: movies.length, movies };
    require("fs").writeFileSync("movies.json", JSON.stringify(out));
  }

  console.log(`\nDone. ${movies.length} movies → movies.json`);
})();
