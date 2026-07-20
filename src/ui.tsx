import { ReactNode, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import * as Haptics from "expo-haptics";
import { FONT } from "./constants";
import { useThemeColors } from "./store";

/** Full-screen gradient stage — use as the root of every screen */
export function Screen({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const C = useThemeColors();
  return (
    <LinearGradient colors={C.bgGradient} style={[{ flex: 1 }, style]}>
      {children}
    </LinearGradient>
  );
}

/** Looping Lottie icon in a fixed square — pass a source from src/icons.ts (LOTTIE) */
export function LottieIcon({ source, size = 22, style }: { source: any; size?: number; style?: ViewStyle }) {
  return (
    <LottieView source={source} autoPlay loop
      style={[{ width: size, height: size }, style]} />
  );
}

/** Springy, glowing primary button with press-scale + haptic */
export function GlowButton({
  label, onPress, color, disabled, style, icon,
}: { label: string; onPress: () => void; color?: string; disabled?: boolean; style?: ViewStyle; icon?: ReactNode }) {
  const C = useThemeColors();
  const s = getStyles(C);
  const scale = useRef(new Animated.Value(1)).current;
  const btnColor = color || C.accent;
  
  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        disabled={disabled}
        onPressIn={() => Animated.spring(scale, { toValue: 0.94, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true }).start()}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onPress(); }}
        style={[
          s.btn,
          { backgroundColor: btnColor, shadowColor: btnColor, opacity: disabled ? 0.4 : 1 },
        ]}
      >
        {icon}
        <Text style={[s.btnText, { color: C.bg }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

/** Circular back / close button for screen corners; icon may be a string or a LottieIcon */
export function CornerButton({ icon, onPress }: { icon: ReactNode; onPress: () => void }) {
  const C = useThemeColors();
  const s = getStyles(C);
  return (
    <Pressable onPress={onPress} hitSlop={12} style={s.corner}>
      {typeof icon === "string"
        ? <Text style={{ color: C.text, fontSize: 18, fontFamily: FONT.bodyBold }}>{icon}</Text>
        : icon}
    </Pressable>
  );
}

/** Screen title with playful display font */
export function Title({ children }: { children: ReactNode }) {
  const C = useThemeColors();
  const s = getStyles(C);
  return <Text style={s.title}>{children}</Text>;
}

export function GlowCard({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const C = useThemeColors();
  const s = getStyles(C);
  return <View style={[s.card, style]}>{children}</View>;
}

const getStyles = (C: any) => StyleSheet.create({
  btn: {
    borderRadius: 18, paddingVertical: 17, paddingHorizontal: 28, alignItems: "center",
    flexDirection: "row", justifyContent: "center", gap: 8,
    shadowOpacity: 0.55, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  btnText: { fontSize: 17, fontFamily: FONT.displayBold, letterSpacing: 0.3 },
  corner: {
    position: "absolute", top: 52, left: 20, zIndex: 10,
    width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center",
    backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder,
  },
  title: { fontSize: 30, color: C.text, fontFamily: FONT.displayBold },
  card: {
    backgroundColor: C.card, borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: C.cardBorder,
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
});

