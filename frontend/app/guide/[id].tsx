import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, TextInput, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "../../src/theme";
import { api } from "../../src/api";
import { GradientButton, VerifiedBadge } from "../../src/ui";

export default function GuideDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const [guide, setGuide] = useState<any | null>(null);
  const [showBook, setShowBook] = useState(false);
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const g = await api<any>(`/guides/${id}`);
        setGuide(g);
      } catch (e: any) {
        Alert.alert("Error", e.message);
      }
    })();
  }, [id]);

  const book = async () => {
    if (!date) {
      Alert.alert("Pick a date", "Add a date to confirm your booking.");
      return;
    }
    setBusy(true);
    try {
      await api(`/guides/${id}/book`, { method: "POST", body: { date, notes } });
      setShowBook(false);
      Alert.alert("Booked! 🎉", `${guide.name} will see your booking and contact you soon.`);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setBusy(false);
    }
  };

  if (!guide) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <LinearGradient colors={colors.gradientPrimary} style={styles.hero}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back} testID="guide-back">
            <Feather name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ alignItems: "center", paddingTop: 8 }}>
            <Image source={{ uri: guide.avatar_url }} style={styles.avatar} />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 }}>
              <Text style={styles.name}>{guide.name}</Text>
              <VerifiedBadge />
            </View>
            <Text style={{ color: "rgba(255,255,255,0.85)" }}>
              {guide.city}, {guide.country}
            </Text>
            <View style={{ flexDirection: "row", marginTop: 14, gap: 22 }}>
              <Stat n={guide.experience_years + "y"} l="Experience" />
              <Stat n={`⭐ ${guide.rating}`} l={`${guide.reviews_count} reviews`} />
              <Stat n={`$${guide.price_per_day}`} l="Per day" />
            </View>
          </View>
        </LinearGradient>

        <View style={{ padding: 20 }}>
          <Text style={[styles.h, { color: colors.text }]}>About</Text>
          <Text style={{ color: colors.textMuted, lineHeight: 22, marginTop: 6 }}>{guide.bio}</Text>

          <Text style={[styles.h, { color: colors.text, marginTop: 18 }]}>Languages</Text>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
            {guide.languages.map((l: string) => (
              <View key={l} style={[styles.tag, { backgroundColor: colors.chipBg }]}>
                <Feather name="message-square" size={12} color={colors.primary} />
                <Text style={{ color: colors.text, fontWeight: "600", fontSize: 13 }}>{l}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.h, { color: colors.text, marginTop: 18 }]}>Certifications</Text>
          <View style={{ marginTop: 6 }}>
            {guide.certifications?.map((c: string) => (
              <View key={c} style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 }}>
                <Feather name="award" size={16} color={colors.secondary} />
                <Text style={{ color: colors.text }}>{c}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bookBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textMuted, fontSize: 11, textTransform: "uppercase", fontWeight: "700" }}>From</Text>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800" }}>${guide.price_per_day}/day</Text>
        </View>
        <View style={{ minWidth: 160 }}>
          <GradientButton title="Book guide" icon="calendar" onPress={() => setShowBook(true)} testID="guide-book-btn" />
        </View>
      </View>

      <Modal visible={showBook} transparent animationType="slide" onRequestClose={() => setShowBook(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text, marginBottom: 4 }}>Book {guide.name}</Text>
            <Text style={{ color: colors.textMuted, marginBottom: 12 }}>Pick a date and add notes.</Text>
            <TextInput
              testID="book-date"
              placeholder="Date (YYYY-MM-DD)"
              placeholderTextColor={colors.textMuted}
              value={date}
              onChangeText={setDate}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />
            <TextInput
              testID="book-notes"
              placeholder="Anything they should know"
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              style={[styles.input, { height: 90, textAlignVertical: "top", color: colors.text, borderColor: colors.border }]}
            />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              <TouchableOpacity
                onPress={() => setShowBook(false)}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 999, alignItems: "center", backgroundColor: colors.chipBg }}
                testID="book-cancel"
              >
                <Text style={{ color: colors.text, fontWeight: "700" }}>Cancel</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <GradientButton title="Confirm" icon="check" onPress={book} loading={busy} testID="book-confirm" />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>{n}</Text>
      <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>{l}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  back: { width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  avatar: { width: 100, height: 100, borderRadius: 999, borderWidth: 3, borderColor: "#fff" },
  name: { color: "#fff", fontSize: 24, fontWeight: "800" },
  h: { fontSize: 18, fontWeight: "700" },
  tag: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  bookBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", gap: 12, padding: 16, paddingBottom: 24, borderTopWidth: 1 },
  modalBg: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  modalCard: { padding: 20, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 8, fontSize: 16 },
});
