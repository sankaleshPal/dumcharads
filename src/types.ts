export type CastMember = { role: "hero" | "heroine"; name: string };

export type Movie = {
  id: number;
  movieName: string;
  movieNameHindi?: string | null;
  year: number;
  cast: CastMember[];
};

export type Language = "en" | "hi" | "both";

export type Team = { name: string; score: number; color: string };

export type GameSettings = {
  turnMinutes: number;      // timer per player's turn, set before start
  roundsPerTeam: number;    // how many turns each team gets
  yearFrom: number;
  yearTo: number;           // single year => yearFrom === yearTo
  language: Language;
  maxSkips: number;         // 3 per the rules
};
