import { useEffect, useRef } from "react";
import { Animated, Image, Pressable, StyleSheet, Text } from "react-native";
import { router } from "expo-router";
import { getUser } from "@/db";
import { useStore, useThemeColors } from "@/store";
import { FONT } from "@/constants";
import { Screen } from "@/ui";

/** Screen 1 — Welcome / Splash */
export default function Welcome() {
  const setUser = useStore((s) => s.setUser);
  const C = useThemeColors();
  const s = getStyles(C);
  const pop = useRef(new Animated.Value(0.4)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(pop, { toValue: 1, friction: 4, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 900, useNativeDriver: true }),
    ]).start();
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
    <Pressable style={{ flex: 1 }} onPress={go}>
      <Screen style={s.root}>
        <Animated.Image
          source={require("../assets/splash_clapper.png")}
          style={[s.logo, { transform: [{ scale: pop }] }]}
        />
        <Animated.View style={{ opacity: fade, alignItems: "center" }}>
          <Text style={s.title}>Dumb Charades</Text>
          <Text style={s.sub}>Family Party Game</Text>
        </Animated.View>
        <Animated.Text style={[s.credit, { opacity: fade }]}>Made by Sankalesh Harak</Animated.Text>
      </Screen>
    </Pressable>
  );
}

const getStyles = (C: any) => StyleSheet.create({
  root: { alignItems: "center", justifyContent: "center", padding: 24 },
  logo: { width: 140, height: 140, marginBottom: 20, resizeMode: "contain" },
  title: {
    fontSize: 40, fontFamily: FONT.displayBold, color: C.text,
    textShadowColor: C.pink, textShadowRadius: 24, textShadowOffset: { width: 0, height: 0 },
  },
  sub: { fontSize: 17, color: C.dim, marginTop: 6, fontFamily: FONT.body },
  credit: {
    position: "absolute", bottom: 44, color: C.accent, fontSize: 14, fontFamily: FONT.bodyBold,
  },
});


