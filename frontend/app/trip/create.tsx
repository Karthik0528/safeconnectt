import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../src/theme";
import { api } from "../../src/api";
import { useAuth } from "../../src/auth";
import { Chip, GradientButton } from "../../src/ui";

const INTERESTS = ["Food", "Hiking", "Beach", "Culture", "Nightlife", "Photography", "Art", "Wellness"];
const COVERS = [
  "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1476900543704-4312b78632f8?auto=format&fit=crop&w=800&q=80",
];

export default function CreateTrip() {
  const { colors } = useTheme();
  const { refresh } = useAuth();
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [country, setCountry] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [budget, setBudget] = useState("moderate");
  const [interests, setInterests] = useState<string[]>([]);
  const [cover, setCover] = useState(COVERS[0]);
  const [busy, setBusy] = useState(false);

  const toggle = (i: string) =>
    setInterests((arr) => (arr.includes(i) ? arr.filter((x) => x !== i) : [...arr, i]));

  const submit = async () => {
    if (!destination || !country || !startDate || !endDate) {
      Alert.alert("Missing fields", "Please add destination, country, and dates.");
      return;
    }
    setBusy(true);
    try {
      const t = await api<any>("/trips", {
        method: "POST",
        body: {
          destination,
          country,
          start_date: startDate,
          end_date: endDate,
          budget,
          notes,
          interests,
          cover_image: cover,
        },
      });
      await refresh();
      router.replace({ pathname: "/trip/[id]", params: { id: t.id } });
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <LinearGradient colors={colors.gradientSoft} style={styles.hero}>
            <TouchableOpacity onPress={() => router.back()} style={styles.back}>
              <Feather name="arrow-left" size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>Plan a new trip</Text>
            <Text style={{ color: colors.textMuted, marginTop: 8, fontSize: 17, lineHeight: 24 }}>
              We will match you with verified women going to the same place.
            </Text>
          </LinearGradient>

          <View style={{ padding: 20 }}>
            <Field label="Destination" colors={colors}>
              <TextInput
                testID="trip-destination"
                placeholder="e.g. Tokyo"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                value={destination}
                onChangeText={setDestination}
              />
            </Field>
            <Field label="Country" colors={colors}>
              <TextInput
                testID="trip-country"
                placeholder="e.g. Japan"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                value={country}
                onChangeText={setCountry}
              />
            </Field>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Field label="Start date" colors={colors}>
                  <TextInput
                    testID="trip-start"
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textMuted}
                    style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                    value={startDate}
                    onChangeText={setStartDate}
                  />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="End date" colors={colors}>
                  <TextInput
                    testID="trip-end"
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textMuted}
                    style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                    value={endDate}
                    onChangeText={setEndDate}
                  />
                </Field>
              </View>
            </View>

            <Text style={[styles.label, { color: colors.textMuted }]}>Budget</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
              {["budget", "moderate", "luxury"].map((b) => (
                <TouchableOpacity
                  key={b}
                  onPress={() => setBudget(b)}
                  style={[
                    styles.budgetBtn,
                    {
                      borderColor: budget === b ? colors.primary : colors.border,
                      backgroundColor: budget === b ? colors.chipBg : colors.surface,
                    },
                  ]}
                >
                  <Text style={{ color: budget === b ? colors.primary : colors.text, fontWeight: "600" }}>
                    {b.charAt(0).toUpperCase() + b.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.textMuted }]}>Interests for this trip</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {INTERESTS.map((i) => (
                <Chip key={i} label={i} selected={interests.includes(i)} onPress={() => toggle(i)} />
              ))}
            </View>

            <Field label="Notes & ideas" colors={colors}>
              <TextInput
                placeholder="What are you excited about?"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                style={[styles.input, { color: colors.text, borderColor: colors.border, height: 80 }]}
                value={notes}
                onChangeText={setNotes}
              />
            </Field>

            <GradientButton title="Save trip" onPress={submit} loading={busy} style={{ marginTop: 12 }} testID="trip-submit" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children, colors }: { label: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { padding: 24, paddingTop: 32 },
  back: { marginBottom: 12 },
  title: { fontSize: 28, fontWeight: "800" },
  label: { fontSize: 13, fontWeight: "700", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15 },
  budgetBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignItems: "center" },
});
