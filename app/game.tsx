import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, Vibration, View } from "react-native";
import { router } from "expo-router";
import { nextMovie } from "@/db";
import { useStore } from "@/store";
import { C } from "@/constants";
import type { Movie } from "@/types";

type TurnPhase = "ready" | "playing" | "turnOver" | "gameOver" | "poolEmpty";

/**
 * Gameplay — per-player turn:
 * - timer set in setup (e.g., 10 min) counts down
 * - NEXT: team guessed it → +1 point → new movie (unlimited within timer)
 * - SKIP: discard movie, max 3; 3rd skip forces timer to 0 → "All chances used!"
 * - every displayed movie is marked used → never repeats this game
 */
export default function Game() {
  const { settings, teams, addScore } = useStore();
  const totalTurns = settings.roundsPerTeam * 2;

  const [turnIdx, setTurnIdx] = useState(0);          // 0,2,… = Team A; 1,3,… = Team B
  const [phase, setPhase] = useState<TurnPhase>("ready");
  const [secondsLeft, setSecondsLeft] = useState(settings.turnMinutes * 60);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [guessed, setGuessed] = useState(0);
  const [skipsLeft, setSkipsLeft] = useState(settings.maxSkips);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const teamIdx = (turnIdx % 2) as 0 | 1;
  const team = teams[teamIdx];

  // ---- timer ----
  useEffect(() => {
    if (phase !== "playing") return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((sec) => {
        if (sec <= 1) { endTurn("time"); return 0; }
        if (sec <= 31) Vibration.vibrate(50);
        return sec - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
  }

  // ---- turn flow ----
  async function startTurn() {
    setGuessed(0);
    setSkipsLeft(settings.maxSkips);
    setSecondsLeft(settings.turnMinutes * 60);
    const m = await loadMovie();
    if (!m) return;
    setPhase("playing");
  }

  async function loadMovie(): Promise<Movie | null> {
    const m = await nextMovie(settings.yearFrom, settings.yearTo);
    if (!m) { stopTimer(); setPhase("poolEmpty"); return null; }
    setMovie(m);
    setRevealed(false);
    return m;
  }

  /** Team guessed the movie → +1, show another */
  async function onNext() {
    setGuessed((g) => g + 1);
    addScore(teamIdx, 1);
    await loadMovie();
  }

  /** Discard without a point. 3rd skip = timer forced to zero, turn over. */
  async function onSkip() {
    const left = skipsLeft - 1;
    setSkipsLeft(left);
    if (left <= 0) {
      setSecondsLeft(0);        // timer automatically gets zero
      endTurn("skips");
      return;
    }
    await loadMovie();
  }

  function endTurn(_reason: "time" | "skips") {
    stopTimer();
    Vibration.vibrate(400);
    setPhase(turnIdx + 1 >= totalTurns ? "gameOver" : "turnOver");
  }

  function nextTurn() {
    setTurnIdx((i) => i + 1);
    setPhase("ready");
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const lowTime = secondsLeft <= 30;

  // ---------- screens ----------
  if (phase === "ready")
    return (
      <Center>
        <Text style={s.bigEmoji}>🎭</Text>
        <Text style={s.h1}>{team.name}'s turn</Text>
        <Text style={s.p}>
          {settings.turnMinutes} minutes on the clock · {settings.maxSkips} skips{"\n"}
          Pass the phone to the actor, then press start.
        </Text>
        <Cta label="Start Turn ▶" onPress={startTurn} />
      </Center>
    );

  if (phase === "poolEmpty")
    return (
      <Center>
        <Text style={s.bigEmoji}>🎬</Text>
        <Text style={s.h1}>All movies used!</Text>
        <Text style={s.p}>Every movie in your year filter has been played.</Text>
        <Cta label="See Results" onPress={() => router.replace("/result")} />
      </Center>
    );

  if (phase === "turnOver" || phase === "gameOver")
    return (
      <Center>
        <Text style={s.bigEmoji}>{skipsLeft <= 0 ? "🙅" : "⏰"}</Text>
        <Text style={s.h1}>{skipsLeft <= 0 ? "All chances used — turn over!" : "Time's up!"}</Text>
        <Text style={s.p}>
          {team.name} guessed <Text style={{ color: C.green, fontWeight: "800" }}>{guessed}</Text> movies
        </Text>
        {phase === "turnOver" ? (
          <Cta label="Next Player →" onPress={nextTurn} />
        ) : (
          <Cta label="Final Scoreboard 🏆" onPress={() => router.replace("/result")} />
        )}
      </Center>
    );

  // phase === "playing"
  return (
    <View style={s.root}>
      <View style={s.topBar}>
        <Text style={[s.teamTag, { color: team.color }]}>{team.name}</Text>
        <Text style={[s.timer, lowTime && { color: C.red }]}>{mm}:{ss}</Text>
        <Text style={s.skips}>{"●".repeat(skipsLeft)}{"○".repeat(settings.maxSkips - skipsLeft)}</Text>
      </View>

      <Pressable
        style={s.card}
        onPressIn={() => setRevealed(true)}
        onPressOut={() => setRevealed(false)}
      >
        {revealed && movie ? (
          <>
            {(settings.language === "en" || settings.language === "both") && (
              <Text style={s.movieEn}>{movie.movieName}</Text>
            )}
            {(settings.language === "hi" || settings.language === "both") && !!movie.movieNameHindi && (
              <Text style={s.movieHi}>{movie.movieNameHindi}</Text>
            )}
            <Text style={s.year}>({movie.year})</Text>
            <View style={{ marginTop: 14 }}>
              {movie.cast.map((c, i) => (
                <Text key={i} style={s.cast}>
                  {c.role === "hero" ? "🤵" : "👰"} {c.name}
                </Text>
              ))}
            </View>
          </>
        ) : (
          <>
            <Text style={{ fontSize: 44 }}>🤫</Text>
            <Text style={s.holdHint}>Hold to reveal{"\n"}(actor only!)</Text>
          </>
        )}
      </Pressable>

      <Text style={s.guessedLine}>Guessed this turn: {guessed}</Text>

      <View style={s.btnRow}>
        <Pressable style={[s.actionBtn, { backgroundColor: C.red }]} onPress={onSkip}>
          <Text style={s.actionText}>Skip ({skipsLeft})</Text>
        </Pressable>
        <Pressable style={[s.actionBtn, { backgroundColor: C.green }]} onPress={onNext}>
          <Text style={s.actionText}>Guessed ✓ Next</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <View style={[s.root, { alignItems: "center", justifyContent: "center" }]}>{children}</View>;
}

function Cta({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={s.cta} onPress={onPress}>
      <Text style={s.ctaText}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, padding: 24, paddingTop: 60 },
  bigEmoji: { fontSize: 64 },
  h1: { fontSize: 26, fontWeight: "800", color: C.text, marginTop: 10, textAlign: "center" },
  p: { color: C.dim, textAlign: "center", marginVertical: 14, fontSize: 15, lineHeight: 22 },
  cta: { backgroundColor: C.accent, borderRadius: 16, padding: 18, paddingHorizontal: 30, marginTop: 10 },
  ctaText: { fontSize: 17, fontWeight: "800", color: C.bg },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  teamTag: { fontSize: 16, fontWeight: "800" },
  timer: { fontSize: 40, fontWeight: "900", color: C.text, fontVariant: ["tabular-nums"] },
  skips: { fontSize: 18, color: C.accent, letterSpacing: 3 },
  card: {
    backgroundColor: C.card, borderRadius: 24, flex: 1, marginVertical: 20,
    alignItems: "center", justifyContent: "center", padding: 24,
  },
  holdHint: { color: C.dim, textAlign: "center", marginTop: 10, fontSize: 16 },
  movieEn: { fontSize: 30, fontWeight: "900", color: C.text, textAlign: "center" },
  movieHi: { fontSize: 26, fontWeight: "700", color: C.accent, textAlign: "center", marginTop: 6 },
  year: { color: C.dim, fontSize: 16, marginTop: 8 },
  cast: { color: C.text, fontSize: 17, textAlign: "center", marginTop: 4 },
  guessedLine: { color: C.dim, textAlign: "center", marginBottom: 12 },
  btnRow: { flexDirection: "row", gap: 12 },
  actionBtn: { flex: 1, borderRadius: 16, padding: 18, alignItems: "center" },
  actionText: { fontSize: 16, fontWeight: "800", color: "#fff" },
});
