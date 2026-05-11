import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../src/theme";
import { api } from "../src/api";

export default function MyTrips() {
  const { colors } = useTheme();
  const router = useRouter();
  const [trips, setTrips] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const t = await api<any[]>("/trips/mine");
      setTrips(t);
    })();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="trips-back">
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text }}>My trips</Text>
        <TouchableOpacity onPress={() => router.push("/trip/create")} testID="trips-add">
          <Feather name="plus-circle" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {trips.length === 0 ? (
          <Text style={{ color: colors.textMuted, textAlign: "center", marginTop: 60 }}>
            No trips yet. Tap + to plan one.
          </Text>
        ) : (
          trips.map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => router.push({ pathname: "/trip/[id]", params: { id: t.id } })}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              testID={`trips-card-${t.id}`}
            >
              <Image source={{ uri: t.cover_image }} style={styles.cover} />
              <View style={{ padding: 12 }}>
                <Text style={{ fontWeight: "800", fontSize: 18, color: colors.text }}>{t.destination}</Text>
                <Text style={{ color: colors.textMuted }}>{t.country} · {t.start_date} → {t.end_date}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  card: { borderRadius: 20, borderWidth: 1, marginBottom: 12, overflow: "hidden" },
  cover: { width: "100%", height: 160 },
});
