import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "../../src/theme";
import { api } from "../../src/api";
import { Chip } from "../../src/ui";

export default function TripDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const [trip, setTrip] = useState<any | null>(null);
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [t, m] = await Promise.all([
          api<any>(`/trips/${id}`),
          api<any[]>(`/travellers/suggested`),
        ]);
        setTrip(t);
        setMatches(m.slice(0, 5));
      } catch (e: any) {
        Alert.alert("Error", e.message);
      }
    })();
  }, [id]);

  const remove = async () => {
    Alert.alert("Delete trip?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await api(`/trips/${id}`, { method: "DELETE" });
          router.back();
        },
      },
    ]);
  };

  if (!trip) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={{ position: "relative" }}>
          <Image source={{ uri: trip.cover_image }} style={styles.cover} />
          <LinearGradient colors={["transparent", "rgba(0,0,0,0.6)"]} style={styles.overlay} />
          <TouchableOpacity onPress={() => router.back()} style={styles.back} testID="trip-back">
            <Feather name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={remove} style={[styles.back, { right: 16, left: undefined, backgroundColor: "rgba(239,68,68,0.8)" }]} testID="trip-delete">
            <Feather name="trash-2" size={18} color="#fff" />
          </TouchableOpacity>
          <View style={styles.heroFoot}>
            <Text style={styles.dest}>{trip.destination}</Text>
            <Text style={styles.country}>{trip.country}</Text>
          </View>
        </View>

        <View style={{ padding: 20 }}>
          <View style={styles.dateRow}>
            <View style={[styles.dateBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Feather name="calendar" size={16} color={colors.primary} />
              <View>
                <Text style={{ fontSize: 11, color: colors.textMuted, textTransform: "uppercase", fontWeight: "700" }}>Start</Text>
                <Text style={{ color: colors.text, fontWeight: "700" }}>{trip.start_date}</Text>
              </View>
            </View>
            <View style={[styles.dateBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Feather name="flag" size={16} color={colors.secondary} />
              <View>
                <Text style={{ fontSize: 11, color: colors.textMuted, textTransform: "uppercase", fontWeight: "700" }}>End</Text>
                <Text style={{ color: colors.text, fontWeight: "700" }}>{trip.end_date}</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Details</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Row icon="dollar-sign" label="Budget" value={trip.budget} colors={colors} />
            <Row icon="home" label="Accommodation" value={trip.accommodation || "Hotel"} colors={colors} />
            {trip.notes ? <Row icon="edit-3" label="Notes" value={trip.notes} colors={colors} /> : null}
          </View>

          {trip.interests?.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Interests</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {trip.interests.map((i: string) => <Chip key={i} label={i} active />)}
              </View>
            </>
          )}

          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>Women going your way</Text>
          {matches.map((m) => (
            <TouchableOpacity
              key={m.id}
              onPress={() => router.push({ pathname: "/profile/[id]", params: { id: m.id } })}
              style={[styles.matchRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              testID={`trip-match-${m.id}`}
            >
              <Image source={{ uri: m.avatar_url }} style={{ width: 48, height: 48, borderRadius: 999 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: "700" }}>{m.name}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>{m.bio || `${m.age} · ${m.countries_visited} countries`}</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ icon, label, value, colors }: any) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.chipBg, alignItems: "center", justifyContent: "center" }}>
        <Feather name={icon} size={16} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.textMuted, fontSize: 11, textTransform: "uppercase", fontWeight: "700", letterSpacing: 1 }}>{label}</Text>
        <Text style={{ color: colors.text, fontWeight: "600", textTransform: "capitalize" }}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: { width: "100%", height: 320 },
  overlay: { position: "absolute", left: 0, right: 0, bottom: 0, height: 200 },
  back: { position: "absolute", top: 16, left: 16, width: 40, height: 40, borderRadius: 14, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" },
  heroFoot: { position: "absolute", bottom: 20, left: 20, right: 20 },
  dest: { color: "#fff", fontSize: 32, fontWeight: "800", letterSpacing: -0.5 },
  country: { color: "rgba(255,255,255,0.85)", fontSize: 16 },
  dateRow: { flexDirection: "row", gap: 10, marginTop: -28, marginBottom: 16 },
  dateBox: { flex: 1, padding: 12, borderRadius: 16, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginTop: 16, marginBottom: 10 },
  card: { padding: 12, borderRadius: 16, borderWidth: 1 },
  matchRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 16, borderWidth: 1, marginBottom: 8 },
});
