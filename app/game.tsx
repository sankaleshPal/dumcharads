import { useEffect, useRef, useState } from "react";
import {
  Alert, Animated, BackHandler, Easing, Image, Pressable, StyleSheet, Text, View,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { nextMovie } from "@/db";
import { useStore, useThemeColors } from "@/store";
import { FONT } from "@/constants";
import { CornerButton, GlowButton, Screen } from "@/ui";
import type { Movie } from "@/types";

type TurnPhase = "ready" | "playing" | "turnOver" | "gameOver" | "poolEmpty";

/**
 * Per-player turn: configurable timer · unlimited Guessed✓Next · max 3 skips
 * (3rd skip zeroes the timer) · movies never repeat within a game.
 */
export default function Game() {
  const { settings, teams, addScore } = useStore();
  const totalTurns = settings.roundsPerTeam * 2;
  const C = useThemeColors();
  const s = getStyles(C);

  const [turnIdx, setTurnIdx] = useState(0);
  const [phase, setPhase] = useState<TurnPhase>("ready");
  const [secondsLeft, setSecondsLeft] = useState(settings.turnMinutes * 60);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [guessed, setGuessed] = useState(0);
  const [skipsLeft, setSkipsLeft] = useState(settings.maxSkips);
  const [endReason, setEndReason] = useState<"time" | "skips">("time");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---- animations (built-in Animated, native driver) ----
  const cardScale = useRef(new Animated.Value(1)).current;
  const cardShake = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;       // green celebration overlay
  const plusOneY = useRef(new Animated.Value(0)).current;
  const plusOneOpacity = useRef(new Animated.Value(0)).current;
  const timerPulse = useRef(new Animated.Value(1)).current;

  const teamIdx = (turnIdx % 2) as 0 | 1;
  const team = teams[teamIdx];

  // ---- exit guard: hardware back + ✕ button both confirm before quitting ----
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      confirmExit();
      return true; // never pop silently mid-game
    });
    return () => sub.remove();
  }, [phase]);

  function confirmExit() {
    if (phase === "gameOver" || phase === "poolEmpty") { router.replace("/result"); return; }
    Alert.alert("Leave game?", "Current scores will be lost.", [
      { text: "Keep playing", style: "cancel" },
      { text: "Quit", style: "destructive", onPress: () => { stopTimer(); router.replace("/home"); } },
    ]);
  }

  // ---- timer ----
  useEffect(() => {
    if (phase !== "playing") return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((sec) => {
        if (sec <= 1) { endTurn("time"); return 0; }
        return sec - 1;
      });
    }, 1000);
    return () => stopTimer();
  }, [phase]);

  // pulse the timer in the last 30s
  useEffect(() => {
    if (phase === "playing" && secondsLeft <= 30 && secondsLeft > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.sequence([
        Animated.timing(timerPulse, { toValue: 1.15, duration: 120, useNativeDriver: true }),
        Animated.spring(timerPulse, { toValue: 1, useNativeDriver: true }),
      ]).start();
    }
  }, [secondsLeft]);

  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  // ---- turn flow ----
  async function startTurn() {
    setGuessed(0);
    setSkipsLeft(settings.maxSkips);
    setSecondsLeft(settings.turnMinutes * 60);
    setEndReason("time");
    const m = await loadMovie(true);
    if (m) setPhase("playing");
  }

  async function loadMovie(first = false): Promise<Movie | null> {
    const m = await nextMovie(settings.yearFrom, settings.yearTo);
    if (!m) { stopTimer(); setPhase("poolEmpty"); return null; }
    setMovie(m);
    setRevealed(false);
    // card entrance: pop-in spring
    cardScale.setValue(first ? 0.6 : 0.8);
    Animated.spring(cardScale, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }).start();
    return m;
  }

  /** Guessed ✅ → celebrate → +1 → next movie */
  async function onNext() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setGuessed((g) => g + 1);
    addScore(teamIdx, 1);
    // green flash + floating +1
    flash.setValue(0.9);
    Animated.timing(flash, { toValue: 0, duration: 550, useNativeDriver: true }).start();
    plusOneY.setValue(0); plusOneOpacity.setValue(1);
    Animated.parallel([
      Animated.timing(plusOneY, { toValue: -90, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(plusOneOpacity, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
    await loadMovie();
  }

  /** Skip ❌ → shake → 3rd skip force-ends the turn */
  async function onSkip() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Animated.sequence(
      [12, -12, 8, -8, 0].map((x) =>
        Animated.timing(cardShake, { toValue: x, duration: 55, useNativeDriver: true })
      )
    ).start();
    const left = skipsLeft - 1;
    setSkipsLeft(left);
    if (left <= 0) { setSecondsLeft(0); endTurn("skips"); return; }
    await loadMovie();
  }

  function endTurn(reason: "time" | "skips") {
    stopTimer();
    setEndReason(reason);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setPhase(turnIdx + 1 >= totalTurns ? "gameOver" : "turnOver");
  }

  function nextTurn() {
    setTurnIdx((i) => i + 1);
    setPhase("ready");
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const lowTime = secondsLeft <= 30;

  // ---------- inter-turn screens ----------
  if (phase !== "playing") {
    const cfg = {
      ready: {
        icon: require("../assets/icon_charades.png"), title: `${team.name}'s turn`,
        sub: `${settings.turnMinutes} min on the clock · ${settings.maxSkips} skips\nPass the phone to the actor, then start!`,
        cta: "Start Turn ▶", onCta: startTurn,
      },
      turnOver: {
        emoji: endReason === "skips" ? "🙅" : "⏰",
        title: endReason === "skips" ? "All chances used!" : "Time's up!",
        sub: `${team.name} guessed ${guessed} movie${guessed === 1 ? "" : "s"}`,
        cta: "Next Player →", onCta: nextTurn,
      },
      gameOver: {
        emoji: "🏁", title: "Game over!",
        sub: `${team.name} guessed ${guessed} movie${guessed === 1 ? "" : "s"}`,
        cta: "Final Scoreboard 🏆", onCta: () => router.replace("/result"),
      },
      poolEmpty: {
        emoji: "🎬", title: "All movies used!",
        sub: "Every movie in your year filter has been played.",
        cta: "See Results", onCta: () => router.replace("/result"),
      },
    }[phase];

    return (
      <Screen style={s.center}>
        <CornerButton icon="✕" onPress={confirmExit} />
        {cfg.icon ? (
          <Image source={cfg.icon} style={s.phaseIcon} />
        ) : (
          <Text style={s.bigEmoji}>{cfg.emoji}</Text>
        )}
        <Text style={[s.h1, phase === "ready" ? { color: team.color } : null]}>{cfg.title}</Text>
        <Text style={s.p}>{cfg.sub}</Text>
        <GlowButton label={cfg.cta} onPress={cfg.onCta} />
      </Screen>
    );
  }


  // ---------- playing ----------
  return (
    <Screen style={{ padding: 24, paddingTop: 56 }}>
      <View style={s.topBar}>
        <Pressable onPress={confirmExit} hitSlop={12} style={s.exitMini}>
          <Text style={{ color: C.dim, fontSize: 16 }}>✕</Text>
        </Pressable>
        <Text style={[s.teamTag, { color: team.color }]}>{team.name}</Text>
        <Animated.Text
          style={[s.timer, lowTime && { color: C.red }, { transform: [{ scale: timerPulse }] }]}
        >
          {mm}:{ss}
        </Animated.Text>
        <Text style={s.skips}>
          {"●".repeat(skipsLeft)}
          <Text style={{ color: C.cardBorder }}>{"●".repeat(settings.maxSkips - skipsLeft)}</Text>
        </Text>
      </View>

      <Animated.View
        style={[s.cardWrap, { transform: [{ scale: cardScale }, { translateX: cardShake }] }]}
      >
        <Pressable
          style={s.card}
          onPressIn={() => setRevealed(true)}
          onPressOut={() => setRevealed(false)}
        >
          {revealed && movie ? (
            <>
              {settings.language === "en" && (
                <Text style={s.movieEn}>{movie.movieName}</Text>
              )}
              {settings.language === "hi" && (
                <Text style={s.movieHi}>{movie.movieNameHindi || movie.movieName}</Text>
              )}
              {settings.language === "both" && (
                <>
                  <Text style={s.movieEn}>{movie.movieName}</Text>
                  {!!movie.movieNameHindi && (
                    <Text style={s.movieHi}>{movie.movieNameHindi}</Text>
                  )}
                </>
              )}
              <Text style={s.year}>({movie.year})</Text>
              <View style={{ marginTop: 16 }}>
                {movie.cast.map((c, i) => (
                  <Text key={i} style={s.cast}>
                    {c.role === "hero" ? "🤵" : "👰"} {c.name}
                  </Text>
                ))}
              </View>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 48 }}>🤫</Text>
              <Text style={s.holdHint}>Hold to reveal{"\n"}(actor only!)</Text>
            </>
          )}
        </Pressable>

        {/* celebration overlay */}
        <Animated.View pointerEvents="none" style={[s.flash, { opacity: flash }]} />
        <Animated.Text
          pointerEvents="none"
          style={[s.plusOne, { opacity: plusOneOpacity, transform: [{ translateY: plusOneY }] }]}
        >
          +1 🎉
        </Animated.Text>
      </Animated.View>

      <Text style={s.guessedLine}>
        Guessed this turn: <Text style={{ color: C.green, fontFamily: FONT.bodyBold }}>{guessed}</Text>
      </Text>

      <View style={s.btnRow}>
        <GlowButton label={`Skip (${skipsLeft})`} color={C.red} onPress={onSkip} style={{ flex: 1 }} />
        <GlowButton label="Guessed ✓" color={C.green} onPress={onNext} style={{ flex: 1.4 }} />
      </View>
    </Screen>
  );
}

const getStyles = (C: any) => StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", padding: 24 },
  bigEmoji: { fontSize: 72 },
  phaseIcon: { width: 120, height: 120, marginBottom: 12, resizeMode: "contain" },
  h1: { fontSize: 30, fontFamily: FONT.displayBold, color: C.text, marginTop: 12, textAlign: "center" },
  p: { color: C.dim, textAlign: "center", marginVertical: 18, fontSize: 16, lineHeight: 24, fontFamily: FONT.body },
  topBar: { flexDirection: "row", alignItems: "center", gap: 12 },
  exitMini: {
    width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center",
    backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder,
  },
  teamTag: { fontSize: 16, fontFamily: FONT.displayBold, flex: 1 },
  timer: { fontSize: 42, fontFamily: FONT.displayBold, color: C.text, fontVariant: ["tabular-nums"] },
  skips: { fontSize: 16, color: C.accent, letterSpacing: 3, marginLeft: 4 },
  cardWrap: { flex: 1, marginVertical: 20 },
  card: {
    flex: 1, backgroundColor: C.card, borderRadius: 28, alignItems: "center", justifyContent: "center",
    padding: 24, borderWidth: 1.5, borderColor: C.cardBorder,
    shadowColor: C.pink, shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  flash: {
    ...StyleSheet.absoluteFillObject, borderRadius: 28, backgroundColor: C.green + "40",
    borderWidth: 2, borderColor: C.green,
  },
  plusOne: {
    position: "absolute", alignSelf: "center", top: "38%",
    fontSize: 44, fontFamily: FONT.displayBold, color: C.green,
    textShadowColor: C.green, textShadowRadius: 18, textShadowOffset: { width: 0, height: 0 },
  },
  holdHint: { color: C.dim, textAlign: "center", marginTop: 12, fontSize: 17, fontFamily: FONT.body },
  movieEn: { fontSize: 32, fontFamily: FONT.displayBold, color: C.text, textAlign: "center" },
  movieHi: { fontSize: 27, fontFamily: FONT.display, color: C.accent, textAlign: "center", marginTop: 8 },
  year: { color: C.dim, fontSize: 16, marginTop: 10, fontFamily: FONT.body },
  cast: { color: C.text, fontSize: 17, textAlign: "center", marginTop: 5, fontFamily: FONT.body },
  guessedLine: { color: C.dim, textAlign: "center", marginBottom: 14, fontSize: 15, fontFamily: FONT.body },
  btnRow: { flexDirection: "row", gap: 12 },
});

