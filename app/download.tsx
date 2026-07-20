import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { downloadMovies } from "@/db";
import { C, DATA_URL } from "@/constants";

/** Screen 4 — Download Resources (movies.json → SQLite) */
export default function Download() {
  const [phase, setPhase] = useState<"idle" | "download" | "insert" | "done" | "error">("idle");
  const [pct, setPct] = useState(0);
  const [msg, setMsg] = useState("");

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
    <View style={s.root}>
      <Text style={s.emoji}>📦</Text>
      <Text style={s.h1}>Movie Database</Text>
      <Text style={s.p}>
        Download all Bollywood movies (1980–2026) once.{"\n"}After this, the game works fully offline.
      </Text>

      {phase === "idle" && (
        <Pressable style={s.cta} onPress={start}>
          <Text style={s.ctaText}>⬇ Download all resources</Text>
        </Pressable>
      )}

      {(phase === "download" || phase === "insert") && (
        <View style={{ alignItems: "center", gap: 12 }}>
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
          <Text style={[s.p, { color: C.green, fontWeight: "700" }]}>{msg}</Text>
          <Pressable style={s.cta} onPress={() => router.replace("/setup")}>
            <Text style={s.ctaText}>Continue → Game Setup</Text>
          </Pressable>
        </>
      )}

      {phase === "error" && (
        <>
          <Text style={[s.p, { color: C.red }]}>{msg}</Text>
          <Pressable style={s.cta} onPress={start}>
            <Text style={s.ctaText}>Retry</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, padding: 24, alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 64 },
  h1: { fontSize: 28, fontWeight: "800", color: C.text, marginTop: 8 },
  p: { color: C.dim, textAlign: "center", marginVertical: 16, fontSize: 15, lineHeight: 22 },
  cta: { backgroundColor: C.accent, borderRadius: 16, padding: 18, paddingHorizontal: 28 },
  ctaText: { fontSize: 16, fontWeight: "800", color: C.bg },
  barBg: { width: 240, height: 10, borderRadius: 5, backgroundColor: C.card, overflow: "hidden" },
  bar: { height: 10, backgroundColor: C.accent },
});
