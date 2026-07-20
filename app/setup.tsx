import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { movieCount, resetUsed } from "@/db";
import { useStore, useThemeColors } from "@/store";
import { FONT, YEAR_MAX, YEAR_MIN } from "@/constants";
import { CornerButton, GlowButton, Screen, Title } from "@/ui";
import type { Language } from "@/types";

const TIMERS = [5, 10, 15];
const ROUNDS = [1, 2, 3];

/** Game Setup — teams, turn timer, year filter (single/range), language */
export default function Setup() {
  const { settings, setSettings, teams, setTeamName, resetGame } = useStore();
  const [mode, setMode] = useState<"single" | "range">("range");
  const [count, setCount] = useState(0);
  const [showCustom, setShowCustom] = useState(false);
  const C = useThemeColors();
  const s = getStyles(C);

  useEffect(() => {
    movieCount(settings.yearFrom, settings.yearTo).then(setCount);
  }, [settings.yearFrom, settings.yearTo]);

  function setSingleYear(y: number) {
    setSettings({ yearFrom: y, yearTo: y });
  }

  async function start() {
    await resetUsed();          // no-repeat guarantee: fresh pool per game
    resetGame();
    router.push("/game");
  }

  const yearButtons: number[] = [];
  for (let y = YEAR_MAX; y >= YEAR_MIN; y--) yearButtons.push(y);

  return (
    <Screen>
      <CornerButton icon="←" onPress={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 108, paddingBottom: 48 }}>
        <Title>Game Setup</Title>

        <Text style={s.label}>TEAMS</Text>
        {[0, 1].map((i) => (
          <TextInput
            key={i}
            style={[s.input, { borderLeftColor: teams[i as 0 | 1].color, borderLeftWidth: 6 }]}
            value={teams[i as 0 | 1].name}
            onChangeText={(t) => setTeamName(i as 0 | 1, t)}
            placeholderTextColor={C.dim}
          />
        ))}

        {!showCustom ? (
          <View style={{ marginTop: 30, gap: 14 }}>
            <GlowButton label="Start Game 🎬" onPress={start} disabled={count === 0} />
            <Pressable style={s.customizeBtn} onPress={() => setShowCustom(true)}>
              <Text style={s.customizeText}>Customize Settings ⚙️</Text>
            </Pressable>
            <View style={[s.countPill, { alignSelf: "center", marginTop: 10 }]}>
              <Text style={[s.count, count === 0 && { color: C.red }]}>
                {count === 0 ? "No movies in this selection" : `🎬 ${count.toLocaleString()} movies ready`}
              </Text>
            </View>
          </View>
        ) : (
          <>
            <Text style={s.label}>TIMER PER PLAYER</Text>
            <View style={s.row}>
              {TIMERS.map((m) => (
                <Chip key={m} label={`${m} min`} active={settings.turnMinutes === m}
                      onPress={() => setSettings({ turnMinutes: m })} />
              ))}
            </View>

            <Text style={s.label}>ROUNDS PER TEAM</Text>
            <View style={s.row}>
              {ROUNDS.map((r) => (
                <Chip key={r} label={String(r)} active={settings.roundsPerTeam === r}
                      onPress={() => setSettings({ roundsPerTeam: r })} />
              ))}
            </View>

            <Text style={s.label}>MOVIE YEARS</Text>
            <View style={s.row}>
              <Chip label="Year range" active={mode === "range"} onPress={() => setMode("range")} />
              <Chip label="Single year" active={mode === "single"} onPress={() => setMode("single")} />
            </View>

            {mode === "range" ? (
              <View style={[s.row, { marginTop: 12 }]}>
                <YearPicker label="From" value={settings.yearFrom}
                  onChange={(y) => setSettings({ yearFrom: Math.min(y, settings.yearTo) })} />
                <YearPicker label="To" value={settings.yearTo}
                  onChange={(y) => setSettings({ yearTo: Math.max(y, settings.yearFrom) })} />
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }}>
                {yearButtons.map((y) => (
                  <Chip key={y} label={String(y)} active={settings.yearFrom === y && settings.yearTo === y}
                        onPress={() => setSingleYear(y)} />
                ))}
              </ScrollView>
            )}

            <View style={s.countPill}>
              <Text style={[s.count, count === 0 && { color: C.red }]}>
                {count === 0 ? "No movies in this selection" : `🎬 ${count.toLocaleString()} movies ready`}
              </Text>
            </View>

            <Text style={s.label}>MOVIE NAME LANGUAGE</Text>
            <View style={s.row}>
              {(["en", "hi", "both"] as Language[]).map((l) => (
                <Chip key={l} label={l === "en" ? "English" : l === "hi" ? "हिंदी" : "Both"}
                      active={settings.language === l} onPress={() => setSettings({ language: l })} />
              ))}
            </View>

            <GlowButton label="Start Game 🎬" onPress={start} disabled={count === 0} style={{ marginTop: 30 }} />
            <Pressable style={s.customizeBtn} onPress={() => setShowCustom(false)}>
              <Text style={s.customizeText}>Hide Customization ✕</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const C = useThemeColors();
  const s = getStyles(C);
  return (
    <Pressable style={[s.chip, active && s.chipActive]} onPress={onPress}>
      <Text style={[s.chipText, active && { color: C.bg }]}>{label}</Text>
    </Pressable>
  );
}

function YearPicker({ label, value, onChange }: { label: string; value: number; onChange: (y: number) => void }) {
  const C = useThemeColors();
  const s = getStyles(C);
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: C.dim, marginBottom: 6, fontFamily: FONT.body }}>{label}</Text>
      <View style={[s.row, { alignItems: "center" }]}>
        <Pressable style={s.stepBtn} onPress={() => value > YEAR_MIN && onChange(value - 1)}>
          <Text style={s.stepText}>−</Text>
        </Pressable>
        <Text style={s.year}>{value}</Text>
        <Pressable style={s.stepBtn} onPress={() => value < YEAR_MAX && onChange(value + 1)}>
          <Text style={s.stepText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const getStyles = (C: any) => StyleSheet.create({
  label: {
    color: C.dim, fontSize: 12, marginTop: 24, marginBottom: 10,
    fontFamily: FONT.bodyBold, letterSpacing: 1.5,
  },
  input: {
    backgroundColor: C.card, color: C.text, borderRadius: 14, padding: 15, fontSize: 16,
    marginBottom: 10, fontFamily: FONT.bodyBold, borderWidth: 1, borderColor: C.cardBorder,
  },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: {
    backgroundColor: C.card, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 11,
    marginRight: 4, borderWidth: 1, borderColor: C.cardBorder,
  },
  chipActive: { backgroundColor: C.accent, borderColor: C.accent },
  chipText: { color: C.text, fontFamily: FONT.bodyBold, fontSize: 14 },
  year: { color: C.text, fontSize: 22, fontFamily: FONT.displayBold, minWidth: 64, textAlign: "center" },
  stepBtn: {
    backgroundColor: C.card, borderRadius: 12, width: 42, height: 42,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.cardBorder,
  },
  stepText: { color: C.accent, fontSize: 22, fontFamily: FONT.displayBold },
  countPill: {
    marginTop: 16, alignSelf: "flex-start", backgroundColor: C.card, borderRadius: 999,
    paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: C.cardBorder,
  },
  count: { color: C.green, fontFamily: FONT.bodyBold, fontSize: 14 },
  customizeBtn: {
    padding: 16, alignItems: "center", justifyContent: "center",
    borderRadius: 18, borderWidth: 1, borderColor: C.cardBorder, backgroundColor: C.card,
    marginTop: 8,
  },
  customizeText: {
    color: C.accent, fontFamily: FONT.bodyBold, fontSize: 16,
  },
});

