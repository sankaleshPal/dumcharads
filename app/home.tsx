import { useCallback, useRef, useState } from "react";
import { Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { getMeta, movieCount } from "@/db";
import { useStore, useThemeColors } from "@/store";
import { AVATARS, FONT } from "@/constants";
import { Screen } from "@/ui";

/** Screen 3 — Home (game cards) */
export default function Home() {
  const { user, theme, toggleTheme } = useStore();
  const [count, setCount] = useState(0);
  const [hasData, setHasData] = useState(false);
  const cardScale = useRef(new Animated.Value(1)).current;
  const C = useThemeColors();
  const s = getStyles(C);

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
    <Screen style={s.root}>
      <View style={s.header}>
        <View style={s.avatarRing}>
          <Text style={{ fontSize: 34 }}>{AVATARS[user?.avatarId ?? 0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.hiSmall}>Welcome back</Text>
          <Text style={s.hi}>{user?.name ?? "Player"}!</Text>
        </View>
        <Pressable onPress={toggleTheme} style={s.themeToggle}>
          <Text style={{ fontSize: 20 }}>{theme === "dark" ? "☀️" : "🌙"}</Text>
        </Pressable>
      </View>

      <Animated.View style={{ transform: [{ scale: cardScale }] }}>
        <Pressable
          onPressIn={() => Animated.spring(cardScale, { toValue: 0.96, useNativeDriver: true }).start()}
          onPressOut={() => Animated.spring(cardScale, { toValue: 1, friction: 3, useNativeDriver: true }).start()}
          onPress={() => router.push(hasData ? "/setup" : "/download")}
          style={s.card}
        >
          <Image source={require("../assets/icon_family_play.png")} style={s.cardIcon} />
          <Text style={s.cardTitle}>Dumb Charades</Text>
          <Text style={s.cardSub}>Bollywood Movies · 1980–2026</Text>
          <View style={[s.badge, { backgroundColor: hasData ? C.green : C.accent }]}>
            <Text style={[s.badgeText, { color: C.bg }]}>
              {hasData ? `▶  Play · ${count.toLocaleString()} movies` : "⬇  Download required"}
            </Text>
          </View>
        </Pressable>
      </Animated.View>

      <View style={s.comingCard}>
        <Image source={require("../assets/icon_microphone.png")} style={s.comingIcon} />
        <Text style={s.coming}>Antakshari — coming soon</Text>
      </View>
    </Screen>
  );
}

const getStyles = (C: any) => StyleSheet.create({
  root: { padding: 24, paddingTop: 64 },
  header: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 30 },
  avatarRing: {
    width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center",
    backgroundColor: C.card, borderWidth: 2, borderColor: C.accent,
  },
  hiSmall: { color: C.dim, fontSize: 13, fontFamily: FONT.body },
  hi: { fontSize: 26, fontFamily: FONT.displayBold, color: C.text },
  themeToggle: {
    width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center",
    backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder,
  },
  card: {
    backgroundColor: C.card, borderRadius: 28, padding: 30, alignItems: "center",
    borderWidth: 1.5, borderColor: C.cardBorder,
    shadowColor: C.pink, shadowOpacity: 0.35, shadowRadius: 22, shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  cardIcon: { width: 90, height: 90, marginBottom: 10, resizeMode: "contain" },
  cardTitle: { fontSize: 28, fontFamily: FONT.displayBold, color: C.text, marginTop: 10 },
  cardSub: { fontSize: 14, color: C.dim, marginTop: 4, marginBottom: 18, fontFamily: FONT.body },
  badge: { borderRadius: 999, paddingHorizontal: 20, paddingVertical: 10 },
  badgeText: { fontFamily: FONT.bodyBold, fontSize: 15 },
  comingCard: {
    marginTop: 20, backgroundColor: C.card + "88", borderRadius: 22, padding: 20,
    alignItems: "center", borderWidth: 1, borderColor: C.cardBorder, borderStyle: "dashed",
    flexDirection: "row", justifyContent: "center", gap: 10,
  },
  comingIcon: { width: 34, height: 34, resizeMode: "contain" },
  coming: { color: C.dim, fontFamily: FONT.body, fontSize: 14 },
});


