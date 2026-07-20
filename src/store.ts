import { create } from "zustand";
import type { GameSettings, Team } from "./types";
import { MAX_SKIPS, TEAM_COLORS, YEAR_MAX, YEAR_MIN, themes } from "./constants";

type State = {
  user: { name: string; avatarId: number } | null;
  settings: GameSettings;
  teams: [Team, Team];
  theme: "dark" | "light";
  setUser: (u: State["user"]) => void;
  setSettings: (s: Partial<GameSettings>) => void;
  setTeamName: (i: 0 | 1, name: string) => void;
  addScore: (i: 0 | 1, pts: number) => void;
  resetGame: () => void;
  toggleTheme: () => void;
};

const defaultTeams = (): [Team, Team] => [
  { name: "Team A", score: 0, color: TEAM_COLORS[0] },
  { name: "Team B", score: 0, color: TEAM_COLORS[1] },
];

export const useStore = create<State>((set) => ({
  user: null,
  settings: {
    turnMinutes: 10,
    roundsPerTeam: 1,
    yearFrom: YEAR_MIN,
    yearTo: YEAR_MAX,
    language: "both",
    maxSkips: MAX_SKIPS,
  },
  teams: defaultTeams(),
  theme: "dark",
  setUser: (user) => set({ user }),
  setSettings: (s) => set((st) => ({ settings: { ...st.settings, ...s } })),
  setTeamName: (i, name) =>
    set((st) => {
      const teams = [...st.teams] as [Team, Team];
      teams[i] = { ...teams[i], name };
      return { teams };
    }),
  addScore: (i, pts) =>
    set((st) => {
      const teams = [...st.teams] as [Team, Team];
      teams[i] = { ...teams[i], score: teams[i].score + pts };
      return { teams };
    }),
  resetGame: () => set({ teams: defaultTeams() }),
  toggleTheme: () => set((st) => ({ theme: st.theme === "dark" ? "light" : "dark" })),
}));

export const useThemeColors = () => {
  const theme = useStore((s) => s.theme);
  return themes[theme];
};

