import { useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { downloadMovies } from "@/db";
import { DATA_URL, FONT } from "@/constants";
import { CornerButton, GlowButton, LottieIcon, Screen } from "@/ui";
import { LOTTIE } from "@/icons";
import { useThemeColors } from "@/store";

/** Screen 4 — Download Resources (movies.json → SQLite) */
export default function Download() {
  const [phase, setPhase] = useState<"idle" | "download" | "insert" | "done" | "error">("idle");
  const [pct, setPct] = useState(0);
  const [msg, setMsg] = useState("");
  const C = useThemeColors();
  const s = getStyles(C);

  async function start() {
    try {
      setPhase("download");
      const res = await downloadMovies(DATA_URL, (p, n) => { setPhase(p); setPct(n); });
      setMsg(res.updated ? `${res.count.toLocaleString()} movies saved offline!` : "Already up to date ✅");
      setPhase("done");
    } catch (e: any) {
      setMsg(e.message ?? "Download failed");
      setPhase("error");
    }
  }

  return (
    <Screen style={s.root}>
      <CornerButton icon={<LottieIcon source={LOTTIE.back} size={20} />} onPress={() => router.back()} />
      <Image source={require("../assets/icon_database.png")} style={s.icon} />
      <Text style={s.h1}>Movie Database</Text>
      <Text style={s.p}>
        Download all Bollywood movies (1980–2026) once.{"\n"}After this, the game works fully offline.
      </Text>

      {phase === "idle" && <GlowButton label="⬇  Download all resources" onPress={start} />}

      {(phase === "download" || phase === "insert") && (
        <View style={{ alignItems: "center", gap: 14 }}>
          <ActivityIndicator color={C.accent} size="large" />
          <Text style={s.p}>
            {phase === "download" ? "Downloading…" : `Saving to your phone… ${pct}%`}
          </Text>
          <View style={s.barBg}>
            <View style={[s.bar, { width: `${pct}%` }]} />
          </View>
        </View>
      )}

      {phase === "done" && (
        <>
          <Text style={[s.p, { color: C.green, fontFamily: FONT.bodyBold }]}>{msg}</Text>
          <GlowButton label="Continue → Game Setup" onPress={() => router.replace("/setup")} />
        </>
      )}

      {phase === "error" && (
        <>
          <Text style={[s.p, { color: C.red }]}>{msg}</Text>
          <GlowButton label="Retry" onPress={start} />
        </>
      )}
    </Screen>
  );
}

const getStyles = (C: any) => StyleSheet.create({
  root: { padding: 24, alignItems: "center", justifyContent: "center" },
  icon: { width: 100, height: 100, marginBottom: 12, resizeMode: "contain" },
  h1: { fontSize: 30, fontFamily: FONT.displayBold, color: C.text, marginTop: 10 },
  p: { color: C.dim, textAlign: "center", marginVertical: 16, fontSize: 15, lineHeight: 23, fontFamily: FONT.body },
  barBg: {
    width: 260, height: 12, borderRadius: 6, backgroundColor: C.card, overflow: "hidden",
    borderWidth: 1, borderColor: C.cardBorder,
  },
  bar: { height: 12, backgroundColor: C.accent, borderRadius: 6 },
});


