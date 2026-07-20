import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { saveScore } from "@/db";
import { useStore } from "@/store";
import { C } from "@/constants";

/** Final scoreboard + winner */
export default function Result() {
  const { teams, resetGame } = useStore();
  const [a, b] = teams;
  const winner = a.score === b.score ? null : a.score > b.score ? a : b;

  useEffect(() => {
    saveScore(a.name, a.score, b.name, b.score);
  }, []);

  return (
    <View style={s.root}>
      <Text style={{ fontSize: 72 }}>🏆</Text>
      <Text style={s.h1}>{winner ? `${winner.name} wins!` : "It's a tie!"}</Text>

      <View style={s.board}>
        {teams.map((t, i) => (
          <View key={i} style={[s.teamRow, { borderLeftColor: t.color }]}>
            <Text style={s.teamName}>{t.name}</Text>
            <Text style={s.score}>{t.score}</Text>
          </View>
        ))}
      </View>

      <Pressable style={s.cta} onPress={() => { resetGame(); router.replace("/setup"); }}>
        <Text style={s.ctaText}>Play Again 🔁</Text>
      </Pressable>
      <Pressable onPress={() => router.replace("/home")}>
        <Text style={s.homeLink}>Back to Home</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center", padding: 24 },
  h1: { fontSize: 30, fontWeight: "900", color: C.text, marginVertical: 16, textAlign: "center" },
  board: { alignSelf: "stretch", gap: 10, marginVertical: 20 },
  teamRow: {
    backgroundColor: C.card, borderRadius: 14, padding: 18, borderLeftWidth: 6,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  teamName: { color: C.text, fontSize: 18, fontWeight: "700" },
  score: { color: C.accent, fontSize: 26, fontWeight: "900" },
  cta: { backgroundColor: C.accent, borderRadius: 16, padding: 18, paddingHorizontal: 32, marginTop: 8 },
  ctaText: { fontSize: 17, fontWeight: "800", color: C.bg },
  homeLink: { color: C.dim, marginTop: 18, fontSize: 15 },
});
