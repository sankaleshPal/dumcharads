import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { movieCount, resetUsed } from "@/db";
import { useStore } from "@/store";
import { C, YEAR_MAX, YEAR_MIN } from "@/constants";
import type { Language } from "@/types";

const TIMERS = [5, 10, 15];
const ROUNDS = [1, 2, 3];

/** Game Setup — teams, turn timer, year filter (single/range), language */
export default function Setup() {
  const { settings, setSettings, teams, setTeamName, resetGame } = useStore();
  const [mode, setMode] = useState<"single" | "range">("range");
  const [count, setCount] = useState(0);

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

  const yearButtons = [];
  for (let y = YEAR_MAX; y >= YEAR_MIN; y--) yearButtons.push(y);

  return (
    <ScrollView style={s.root} contentContainerStyle={{ padding: 24, paddingTop: 60, paddingBottom: 48 }}>
      <Text style={s.h1}>Game Setup</Text>

      <Text style={s.label}>Teams</Text>
      {[0, 1].map((i) => (
        <TextInput
          key={i}
          style={[s.input, { borderLeftColor: teams[i as 0 | 1].color, borderLeftWidth: 6 }]}
          value={teams[i as 0 | 1].name}
          onChangeText={(t) => setTeamName(i as 0 | 1, t)}
        />
      ))}

      <Text style={s.label}>Timer per player (set before start)</Text>
      <View style={s.row}>
        {TIMERS.map((m) => (
          <Chip key={m} label={`${m} min`} active={settings.turnMinutes === m}
                onPress={() => setSettings({ turnMinutes: m })} />
        ))}
      </View>

      <Text style={s.label}>Rounds per team</Text>
      <View style={s.row}>
        {ROUNDS.map((r) => (
          <Chip key={r} label={String(r)} active={settings.roundsPerTeam === r}
                onPress={() => setSettings({ roundsPerTeam: r })} />
        ))}
      </View>

      <Text style={s.label}>Movie years</Text>
      <View style={s.row}>
        <Chip label="Year range" active={mode === "range"} onPress={() => setMode("range")} />
        <Chip label="Single year" active={mode === "single"} onPress={() => setMode("single")} />
      </View>

      {mode === "range" ? (
        <View style={s.row}>
          <YearPicker label="From" value={settings.yearFrom}
            onChange={(y) => setSettings({ yearFrom: Math.min(y, settings.yearTo) })} />
          <YearPicker label="To" value={settings.yearTo}
            onChange={(y) => setSettings({ yearTo: Math.max(y, settings.yearFrom) })} />
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
          {yearButtons.map((y) => (
            <Chip key={y} label={String(y)} active={settings.yearFrom === y && settings.yearTo === y}
                  onPress={() => setSingleYear(y)} />
          ))}
        </ScrollView>
      )}

      <Text style={[s.count, count === 0 && { color: C.red }]}>
        {count === 0 ? "No movies in this selection" : `${count.toLocaleString()} movies available`}
      </Text>

      <Text style={s.label}>Movie name language</Text>
      <View style={s.row}>
        {(["en", "hi", "both"] as Language[]).map((l) => (
          <Chip key={l} label={l === "en" ? "English" : l === "hi" ? "हिंदी" : "Both"}
                active={settings.language === l} onPress={() => setSettings({ language: l })} />
        ))}
      </View>

      <Pressable style={[s.cta, count === 0 && { opacity: 0.4 }]} disabled={count === 0} onPress={start}>
        <Text style={s.ctaText}>Start Game 🎬</Text>
      </Pressable>
    </ScrollView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[s.chip, active && s.chipActive]} onPress={onPress}>
      <Text style={[s.chipText, active && { color: C.bg }]}>{label}</Text>
    </Pressable>
  );
}

function YearPicker({ label, value, onChange }: { label: string; value: number; onChange: (y: number) => void }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: C.dim, marginBottom: 4 }}>{label}</Text>
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

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  h1: { fontSize: 28, fontWeight: "800", color: C.text, marginBottom: 8 },
  label: { color: C.dim, fontSize: 15, marginTop: 20, marginBottom: 8 },
  input: { backgroundColor: C.card, color: C.text, borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 10 },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: { backgroundColor: C.card, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, marginRight: 4 },
  chipActive: { backgroundColor: C.accent },
  chipText: { color: C.text, fontWeight: "700" },
  year: { color: C.text, fontSize: 20, fontWeight: "800", minWidth: 60, textAlign: "center" },
  stepBtn: { backgroundColor: C.card, borderRadius: 10, width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  stepText: { color: C.accent, fontSize: 22, fontWeight: "800" },
  count: { color: C.green, fontWeight: "700", marginTop: 12, fontSize: 15 },
  cta: { backgroundColor: C.accent, borderRadius: 16, padding: 18, alignItems: "center", marginTop: 28 },
  ctaText: { fontSize: 18, fontWeight: "800", color: C.bg },
});
