import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { getMeta, movieCount } from "@/db";
import { useStore } from "@/store";
import { AVATARS, C } from "@/constants";

/** Screen 3 — Home (game cards) */
export default function Home() {
  const user = useStore((s) => s.user);
  const [count, setCount] = useState(0);
  const [hasData, setHasData] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const v = await getMeta("dataVersion");
        setHasData(!!v);
        setCount(await movieCount());
      })();
    }, [])
  );

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={{ fontSize: 40 }}>{AVATARS[user?.avatarId ?? 0]}</Text>
        <Text style={s.hi}>Hi, {user?.name ?? "Player"}!</Text>
      </View>

      <Pressable
        style={s.card}
        onPress={() => router.push(hasData ? "/setup" : "/download")}
      >
        <Text style={s.cardEmoji}>🎭</Text>
        <Text style={s.cardTitle}>Dumb Charades</Text>
        <Text style={s.cardSub}>Bollywood Movies · 1980–2026</Text>
        {hasData ? (
          <View style={s.badgeGreen}>
            <Text style={s.badgeText}>▶ Play · {count.toLocaleString()} movies</Text>
          </View>
        ) : (
          <View style={s.badgeAmber}>
            <Text style={s.badgeText}>⬇ Download required</Text>
          </View>
        )}
      </Pressable>

      <Text style={s.coming}>More games coming soon…</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, padding: 24, paddingTop: 70 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 32 },
  hi: { fontSize: 26, fontWeight: "800", color: C.text },
  card: { backgroundColor: C.card, borderRadius: 24, padding: 28, alignItems: "center" },
  cardEmoji: { fontSize: 64 },
  cardTitle: { fontSize: 26, fontWeight: "800", color: C.text, marginTop: 8 },
  cardSub: { fontSize: 14, color: C.dim, marginTop: 4, marginBottom: 16 },
  badgeGreen: { backgroundColor: C.green, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 8 },
  badgeAmber: { backgroundColor: C.accent, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 8 },
  badgeText: { fontWeight: "800", color: C.bg },
  coming: { color: C.dim, textAlign: "center", marginTop: 28 },
});
