import { useEffect, useRef } from "react";
import { Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { saveScore } from "@/db";
import { useStore, useThemeColors } from "@/store";
import { FONT } from "@/constants";
import { GlowButton, Screen } from "@/ui";

/** Final scoreboard + winner */
export default function Result() {
  const { teams, resetGame } = useStore();
  const [a, b] = teams;
  const winner = a.score === b.score ? null : a.score > b.score ? a : b;
  const bounce = useRef(new Animated.Value(0)).current;
  const rowsFade = useRef(new Animated.Value(0)).current;
  const C = useThemeColors();
  const s = getStyles(C);

  useEffect(() => {
    saveScore(a.name, a.score, b.name, b.score);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -14, duration: 420, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 420, useNativeDriver: true }),
      ])
    ).start();
    Animated.timing(rowsFade, { toValue: 1, duration: 700, useNativeDriver: true }).start();
  }, []);

  return (
    <Screen style={s.root}>
      <Animated.Image
        source={winner ? require("../assets/icon_trophy.png") : require("../assets/icon_handshake.png")}
        style={[s.trophyImage, { transform: [{ translateY: bounce }] }]}
      />
      <Text style={[s.h1, winner && { color: winner.color }]}>
        {winner ? `${winner.name} wins!` : "It's a tie!"}
      </Text>

      <Animated.View style={[s.board, { opacity: rowsFade }]}>
        {teams.map((t, i) => (
          <View key={i} style={[s.teamRow, { borderLeftColor: t.color }]}>
            <Text style={s.teamName}>{t.name}</Text>
            <Text style={[s.score, { color: t.color }]}>{t.score}</Text>
          </View>
        ))}
      </Animated.View>

      <GlowButton label="Play Again 🔁" onPress={() => { resetGame(); router.replace("/setup"); }} />
      <Pressable onPress={() => { resetGame(); router.replace("/home"); }}>
        <Text style={s.homeLink}>Back to Home</Text>
      </Pressable>
    </Screen>
  );
}

const getStyles = (C: any) => StyleSheet.create({
  root: { alignItems: "center", justifyContent: "center", padding: 24 },
  trophyImage: { width: 140, height: 140, marginBottom: 12, resizeMode: "contain" },
  h1: { fontSize: 32, fontFamily: FONT.displayBold, color: C.text, marginVertical: 18, textAlign: "center" },
  board: { alignSelf: "stretch", gap: 12, marginBottom: 28 },
  teamRow: {
    backgroundColor: C.card, borderRadius: 18, padding: 20, borderLeftWidth: 6,
    borderWidth: 1, borderColor: C.cardBorder,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  teamName: { color: C.text, fontSize: 19, fontFamily: FONT.display },
  score: { fontSize: 30, fontFamily: FONT.displayBold },
  homeLink: { color: C.dim, marginTop: 20, fontSize: 15, fontFamily: FONT.body },
});


