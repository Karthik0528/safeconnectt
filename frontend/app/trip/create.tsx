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
            <Text style={[styles.title, { color: colors.text }]}>Plan a new trip ✈️</Text>
            <Text style={{ color: colors.textMuted, marginTop: 4 }}>
              We'll match you with verified women going to the same place.
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
            <View style={{ flexDirection: "row", marginBottom: 8 }}>
              {["budget", "moderate", "luxury"].map((b) => (
                <Chip key={b} label={b.charAt(0).toUpperCase() + b.slice(1)} active={budget === b} onPress={() => setBudget(b)} testID={`budget-${b}`} />
              ))}
            </View>

            <Text style={[styles.label, { color: colors.textMuted, marginTop: 12 }]}>Interests</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {INTERESTS.map((i) => (
                <Chip key={i} label={i} active={interests.includes(i)} onPress={() => toggle(i)} testID={`interest-${i}`} />
              ))}
            </View>

            <Text style={[styles.label, { color: colors.textMuted, marginTop: 16 }]}>Cover photo</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {COVERS.map((u) => (
                <TouchableOpacity
                  key={u}
                  onPress={() => setCover(u)}
                  testID={`cover-${u.slice(-10)}`}
                  style={{
                    marginRight: 10,
                    borderRadius: 16,
                    padding: 3,
                    borderWidth: 2,
                    borderColor: cover === u ? colors.primary : "transparent",
                  }}
                >
                  {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
                  {require("react-native").Image && (
                    <View style={{ overflow: "hidden", borderRadius: 12 }}>
                      <View>
                        <ImageWrap uri={u} />
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Field label="Notes" colors={colors}>
              <TextInput
                testID="trip-notes"
                placeholder="Anything we should know (places to visit, friends joining…)"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, styles.textarea, { color: colors.text, borderColor: colors.border }]}
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </Field>

            <GradientButton title="Create trip" icon="check" testID="trip-submit" onPress={submit} loading={busy} style={{ marginTop: 12 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ImageWrap({ uri }: { uri: string }) {
  const { Image } = require("react-native");
  return <Image source={{ uri }} style={{ width: 100, height: 64 }} />;
}

function Field({ label, children, colors }: any) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { padding: 20, paddingTop: 24, paddingBottom: 28, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  back: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.8)", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  label: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  textarea: { minHeight: 90, textAlignVertical: "top" },
});
