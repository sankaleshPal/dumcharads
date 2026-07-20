// Movie DB served straight from your public GitHub repo — free hosting.
export const DATA_URL =
  "https://raw.githubusercontent.com/sankaleshPal/dumcharads/main/data/movies.json";

export const YEAR_MIN = 1980;
export const YEAR_MAX = 2026;
export const MAX_SKIPS = 3;

// TODO: replace emoji with bundled 3D avatar PNGs in /assets/avatars
export const AVATARS = ["🦁", "🐼", "🦊", "🐵", "🦄", "🐯", "🐸", "🐰", "🐨", "🐷", "🦉", "🐙"];

export const TEAM_COLORS = ["#ff2d78", "#00d4ff"];

// "Game night synthwave" palette — deep violet stage + neon accents
export const themes = {
  dark: {
    bg: "#0d0620",
    bgGradient: ["#1c0f45", "#0d0620"] as [string, string],
    card: "#231447",
    cardBorder: "#3b2a6e",
    accent: "#ffb020",          // neon amber — CTAs
    pink: "#ff2d78",
    cyan: "#00d4ff",
    text: "#f7f4ff",
    dim: "#9d8fd0",
    green: "#2fe07c",
    red: "#ff4d5e",
  },
  light: {
    bg: "#f4f3f6",
    bgGradient: ["#ffffff", "#e8e7ec"] as [string, string],
    card: "#ffffff",
    cardBorder: "#d1cfe2",
    accent: "#6200ee",          // deep purple — CTAs
    pink: "#e91e63",
    cyan: "#00bcd4",
    text: "#120b24",
    dim: "#6b5e8c",
    green: "#10b981",
    red: "#ef4444",
  },
};

// Deprecated fallback for quick compilation, use themes[theme] instead
export const C = themes.dark;


export const FONT = {
  display: "Fredoka_600SemiBold",
  displayBold: "Fredoka_700Bold",
  body: "Nunito_500Medium",
  bodyBold: "Nunito_700Bold",
};
