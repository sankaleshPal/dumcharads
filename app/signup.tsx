import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { saveUser } from "@/db";
import { useStore, useThemeColors } from "@/store";
import { AVATARS, FONT } from "@/constants";

/** Screen 2 — Local Signup (name + avatar, fully offline) */
export default function Signup() {
  const [name, setName] = useState("");
  const [avatarId, setAvatarId] = useState<number | null>(null);
  const setUser = useStore((s) => s.setUser);
  const C = useThemeColors();
  const s = getStyles(C);
  const valid = name.trim().length >= 2 && name.trim().length <= 20 && avatarId !== null;

  async function submit() {
    if (!valid) return;
    await saveUser(name.trim(), avatarId!);
    setUser({ name: name.trim(), avatarId: avatarId! });
    router.replace("/home");
  }

  return (
    <View style={s.root}>
      <Text style={s.h1}>Create your player</Text>
      <TextInput
        style={s.input}
        placeholder="Your name"
        placeholderTextColor={C.dim}
        value={name}
        onChangeText={setName}
        maxLength={20}
      />
      <Text style={s.label}>Choose your avatar</Text>
      <FlatList
        data={AVATARS}
        numColumns={4}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item, index }) => (
          <Pressable
            style={[s.avatar, avatarId === index && s.avatarSel]}
            onPress={() => setAvatarId(index)}
          >
            <Text style={{ fontSize: 40 }}>{item}</Text>
          </Pressable>
        )}
      />
      <Pressable style={[s.cta, !valid && { opacity: 0.4 }]} disabled={!valid} onPress={submit}>
        <Text style={[s.ctaText, { color: C.bg }]}>Let's Play 🎉</Text>
      </Pressable>
    </View>
  );
}

const getStyles = (C: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, padding: 24, paddingTop: 70 },
  h1: { fontSize: 28, fontWeight: "800", color: C.text, marginBottom: 20 },
  input: {
    backgroundColor: C.card, color: C.text, borderRadius: 14, padding: 16,
    fontSize: 18, marginBottom: 24, borderWidth: 1, borderColor: C.cardBorder,
  },
  label: { color: C.dim, fontSize: 16, marginBottom: 12 },
  avatar: {
    flex: 1, aspectRatio: 1, margin: 6, borderRadius: 18, backgroundColor: C.card,
    alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "transparent",
  },
  avatarSel: { borderColor: C.accent, transform: [{ scale: 1.06 }] },
  cta: { backgroundColor: C.accent, borderRadius: 16, padding: 18, alignItems: "center", marginTop: 12 },
  ctaText: { fontSize: 18, fontWeight: "800" },
});
