import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../src/theme";
import { api } from "../src/api";
import { VerifiedBadge } from "../src/ui";

export default function Notifications() {
  const { colors } = useTheme();
  const router = useRouter();
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const m = await api<any[]>("/matches/incoming");
      setMatches(m);
    })();
  }, []);

  const respond = async (id: string, action: "accept" | "decline") => {
    await api(`/matches/${id}/respond?action=${action}`, { method: "POST" });
    setMatches((arr) => arr.filter((x) => x.id !== id));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="notif-back">
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text }}>Notifications</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <Text style={[styles.section, { color: colors.text }]}>Connection requests</Text>
        {matches.length === 0 ? (
          <Text style={{ color: colors.textMuted }}>No pending requests. You&apos;re all caught up ✨</Text>
        ) : (
          matches.map((m) => (
            <View key={m.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Image source={{ uri: m.from_user_profile?.avatar_url }} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ fontWeight: "700", color: colors.text }}>{m.from_user_profile?.name}</Text>
                  {m.from_user_profile?.verified && <VerifiedBadge size={10} />}
                </View>
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>{m.message || "Wants to connect"}</Text>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                  <TouchableOpacity
                    testID={`accept-${m.id}`}
                    onPress={() => respond(m.id, "accept")}
                    style={[styles.btn, { backgroundColor: colors.primary }]}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    testID={`decline-${m.id}`}
                    onPress={() => respond(m.id, "decline")}
                    style={[styles.btn, { backgroundColor: colors.chipBg }]}
                  >
                    <Text style={{ color: colors.text, fontWeight: "700" }}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  section: { fontSize: 14, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  card: { flexDirection: "row", gap: 12, padding: 14, borderRadius: 18, borderWidth: 1, marginBottom: 10 },
  avatar: { width: 52, height: 52, borderRadius: 999 },
  btn: { flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: "center" },
});
