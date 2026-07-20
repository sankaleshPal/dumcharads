import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts, Fredoka_600SemiBold, Fredoka_700Bold } from "@expo-google-fonts/fredoka";
import { Nunito_500Medium, Nunito_700Bold } from "@expo-google-fonts/nunito";
import { View } from "react-native";
import { useStore, useThemeColors } from "@/store";

export default function Layout() {
  const [loaded, error] = useFonts({
    Fredoka_600SemiBold, Fredoka_700Bold, Nunito_500Medium, Nunito_700Bold,
  });
  const theme = useStore((s) => s.theme);
  const C = useThemeColors();

  useEffect(() => {
    if (error) {
      console.error("Font loading error:", error);
      throw error;
    }
  }, [error]);

  if (!loaded) return <View style={{ flex: 1, backgroundColor: C.bg }} />;

  return (
    <>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: C.bg },
          animation: "slide_from_right",
        }}
      >
        {/* gameplay manages its own exit — block swipe-back so a stray gesture can't kill a turn */}
        <Stack.Screen name="game" options={{ gestureEnabled: false, animation: "fade" }} />
      </Stack>
    </>
  );
}

