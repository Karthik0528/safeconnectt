import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "../../src/theme";
import { api } from "../../src/api";
import { Chip, GradientButton, VerifiedBadge } from "../../src/ui";

export default function ProfileView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await api<any[]>("/travellers/suggested");
        const u = list.find((x) => x.id === id);
        setUser(u || null);
      } catch (e: any) {
        Alert.alert("Error", e.message);
      }
    })();
  }, [id]);

  const sendReq = async () => {
    try {
      await api("/matches/request", { method: "POST", body: { target_user_id: id, message: "Hey, let's connect on SafeConnect!" } });
      setSent(true);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const chat = async () => {
    const c = await api<{ id: string }>("/chats/start", { method: "POST", body: { other_user_id: id } });
    router.push({ pathname: "/chat/[id]", params: { id: c.id } });
  };

  if (!user) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <LinearGradient colors={colors.gradientPrimary} style={styles.hero}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back} testID="profile-back">
            <Feather name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ alignItems: "center" }}>
            <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 }}>
              <Text style={styles.name}>{user.name}</Text>
              {user.verified && <VerifiedBadge />}
            </View>
            <Text style={{ color: "rgba(255,255,255,0.85)" }}>{user.age} · ⭐ {user.rating}</Text>
            <View style={{ flexDirection: "row", marginTop: 14, gap: 24 }}>
              <Stat n={user.trips_count} l="Trips" />
              <Stat n={user.countries_visited} l="Countries" />
              <Stat n={user.safety_score} l="Safety" />
            </View>
          </View>
        </LinearGradient>

        <View style={{ padding: 20 }}>
          {user.bio ? (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={{ color: colors.text, lineHeight: 22 }}>{user.bio}</Text>
            </View>
          ) : null}

          {user.interests?.length > 0 && (
            <>
              <Text style={[styles.h, { color: colors.text }]}>Interests</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {user.interests.map((i: string) => <Chip key={i} label={i} active />)}
              </View>
            </>
          )}

          {user.languages?.length > 0 && (
            <>
              <Text style={[styles.h, { color: colors.text, marginTop: 16 }]}>Languages</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {user.languages.map((l: string) => <Chip key={l} label={l} />)}
              </View>
            </>
          )}

          {user.latest_trip && (
            <>
              <Text style={[styles.h, { color: colors.text, marginTop: 16 }]}>Current adventure</Text>
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}>
                  ✈️ {user.latest_trip.destination}, {user.latest_trip.country}
                </Text>
                <Text style={{ color: colors.textMuted, marginTop: 4 }}>
                  {user.latest_trip.start_date} → {user.latest_trip.end_date}
                </Text>
              </View>
            </>
          )}

          <View style={{ flexDirection: "row", gap: 10, marginTop: 22 }}>
            <View style={{ flex: 1 }}>
              <GradientButton
                title={sent ? "Request sent" : "Connect"}
                icon={sent ? "check" : "user-plus"}
                onPress={sendReq}
                disabled={sent}
                testID="profile-connect"
              />
            </View>
            <TouchableOpacity onPress={chat} testID="profile-message" style={[styles.ghost, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Feather name="message-circle" size={18} color={colors.text} />
              <Text style={{ color: colors.text, fontWeight: "700" }}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ n, l }: { n: any; l: string }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>{n}</Text>
      <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>{l}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  back: { width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  avatar: { width: 100, height: 100, borderRadius: 999, borderWidth: 3, borderColor: "#fff" },
  name: { color: "#fff", fontSize: 24, fontWeight: "800" },
  h: { fontSize: 18, fontWeight: "700", marginTop: 10, marginBottom: 8 },
  card: { padding: 14, borderRadius: 16, borderWidth: 1, marginVertical: 6 },
  ghost: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 18, borderRadius: 999, borderWidth: 1 },
});
