import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../src/theme";
import { api } from "../src/api";
import { VerifiedBadge } from "../src/ui";

export default function MyBookings() {
  const { colors } = useTheme();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const b = await api<any[]>("/bookings/mine");
      setItems(b);
    })();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="bookings-back">
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text }}>My bookings</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {items.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <View style={{ width: 64, height: 64, borderRadius: 999, backgroundColor: colors.chipBg, alignItems: "center", justifyContent: "center" }}>
              <Feather name="calendar" size={28} color={colors.primary} />
            </View>
            <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16, marginTop: 12 }}>No bookings yet</Text>
            <Text style={{ color: colors.textMuted, marginTop: 4 }}>Browse verified local guides to get started.</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/discover?tab=guides")} style={[styles.cta, { backgroundColor: colors.primary }]}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>Find guides</Text>
            </TouchableOpacity>
          </View>
        ) : (
          items.map((b) => (
            <TouchableOpacity
              key={b.id}
              onPress={() => router.push({ pathname: "/guide/[id]", params: { id: b.guide_id } })}
              style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
              testID={`booking-${b.id}`}
            >
              <Image source={{ uri: b.guide?.avatar_url }} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ fontWeight: "700", color: colors.text }}>{b.guide?.name}</Text>
                  <VerifiedBadge size={10} />
                </View>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                  {b.guide?.city} · {b.date}
                </Text>
                <Text style={{ color: colors.success, fontWeight: "600", fontSize: 12, marginTop: 2 }}>● {b.status}</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 18, borderWidth: 1, marginBottom: 10 },
  avatar: { width: 50, height: 50, borderRadius: 999 },
  cta: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999, marginTop: 16 },
});
