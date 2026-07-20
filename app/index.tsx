import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { getUser } from "@/db";
import { useStore } from "@/store";
import { C } from "@/constants";

/** Screen 1 — Welcome / Splash */
export default function Welcome() {
  const setUser = useStore((s) => s.setUser);

  useEffect(() => {
    const t = setTimeout(go, 2500);
    return () => clearTimeout(t);
  }, []);

  async function go() {
    const u = await getUser();
    if (u) {
      setUser({ name: u.name, avatarId: u.avatarId });
      router.replace("/home");
    } else {
      router.replace("/signup");
    }
  }

  return (
    <Pressable style={s.root} onPress={go}>
      <Text style={s.emoji}>🎬</Text>
      <Text style={s.title}>Dumb Charades</Text>
      <Text style={s.sub}>Family Party Game</Text>
      <View style={{ flex: 1 }} />
      <Text style={s.credit}>Made by Sankalesh Harak</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.bg, padding: 24 },
  emoji: { fontSize: 80, marginTop: 180 },
  title: { fontSize: 36, fontWeight: "800", color: C.text, marginTop: 12 },
  sub: { fontSize: 16, color: C.dim, marginTop: 4 },
  credit: { color: C.accent, fontSize: 14, marginBottom: 40, fontWeight: "600" },
});
