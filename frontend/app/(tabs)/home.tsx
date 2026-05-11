import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/auth";
import { useTheme } from "../../src/theme";
import { api } from "../../src/api";
import { SectionHeader, VerifiedBadge } from "../../src/ui";

export default function Home() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [trips, setTrips] = useState<any[]>([]);
  const [travellers, setTravellers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [t, tr, p] = await Promise.all([
        api<any[]>("/trips/mine"),
        api<any[]>("/travellers/suggested"),
        api<any[]>("/posts"),
      ]);
      setTrips(t);
      setTravellers(tr.slice(0, 8));
      setPosts(p.slice(0, 4));
    } catch (e) {
      console.warn(e);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  const firstName = user?.name.split(" ")[0] || "Traveller";

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        testID="home-scroll"
      >
        {/* Header */}
        <LinearGradient
          colors={colors.gradientSoft}
          style={styles.headerHero}
        >
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.greet, { color: colors.textMuted }]}>{greeting},</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={[styles.name, { color: colors.text }]} testID="home-greeting">
                  {firstName} 👋
                </Text>
                {user?.verified && <VerifiedBadge />}
              </View>
            </View>
            <TouchableOpacity onPress={() => router.push("/notifications")} style={[styles.iconBtn, { backgroundColor: colors.surface }]} testID="home-bell">
              <Feather name="bell" size={18} color={colors.text} />
              <View style={styles.bellDot} />
            </TouchableOpacity>
          </View>

          {/* Safety stat tiles */}
          <View style={styles.stats}>
            <Stat label="Safety score" value={`${user?.safety_score || 85}%`} icon="shield" colors={colors} />
            <Stat label="Countries" value={String(user?.countries_visited || 0)} icon="globe" colors={colors} />
            <Stat label="Trips" value={String(user?.trips_count || 0)} icon="map" colors={colors} />
          </View>
        </LinearGradient>

        {/* Quick actions */}
        <View style={styles.quickRow}>
          <QuickAction icon="plus-circle" label="New trip" onPress={() => router.push("/trip/create")} testID="qa-new-trip" />
          <QuickAction icon="cpu" label="AI tips" onPress={() => router.push("/ai-assistant")} testID="qa-ai" />
          <QuickAction icon="users" label="Find women" onPress={() => router.push("/(tabs)/discover")} testID="qa-find" />
          <QuickAction icon="map-pin" label="Guides" onPress={() => router.push({ pathname: "/(tabs)/discover", params: { tab: "guides" } })} testID="qa-guides" />
        </View>

        {/* Upcoming trip */}
        <View style={styles.section}>
          <SectionHeader title="Your trips" action="New trip" onAction={() => router.push("/trip/create")} />
          {trips.length === 0 ? (
            <TouchableOpacity onPress={() => router.push("/trip/create")} testID="empty-trip-cta">
              <LinearGradient colors={colors.gradientPrimary} style={styles.emptyTrip}>
                <Feather name="map" size={24} color="#fff" />
                <Text style={styles.emptyTripText}>Plan your first solo adventure ✨</Text>
                <Text style={styles.emptyTripSub}>Tap to create a trip and find women going your way.</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={trips}
              keyExtractor={(t) => t.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  testID={`trip-card-${item.id}`}
                  onPress={() => router.push({ pathname: "/trip/[id]", params: { id: item.id } })}
                  style={{ marginRight: 12 }}
                >
                  <View style={[styles.tripCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Image source={{ uri: item.cover_image }} style={styles.tripImg} />
                    <View style={{ padding: 12 }}>
                      <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>{item.destination}</Text>
                      <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                        {item.country} · {item.start_date}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        {/* Suggested travellers */}
        <View style={styles.section}>
          <SectionHeader title="Women going your way" action="See all" onAction={() => router.push("/(tabs)/discover")} />
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={travellers}
            keyExtractor={(t) => t.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.travCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => router.push({ pathname: "/profile/[id]", params: { id: item.id } })}
                testID={`traveller-${item.id}`}
              >
                <Image source={{ uri: item.avatar_url }} style={styles.travAvatar} />
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 }}>
                  <Text style={{ fontWeight: "700", color: colors.text }} numberOfLines={1}>{item.name.split(" ")[0]}</Text>
                  {item.verified && <VerifiedBadge size={11} />}
                </View>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>{item.age} · {item.countries_visited} 🌍</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* AI tip card */}
        <TouchableOpacity onPress={() => router.push("/ai-assistant")} style={styles.section} testID="ai-tip-card">
          <LinearGradient colors={colors.gradientPrimary} style={styles.aiCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiBadge}>AI · TIP OF THE DAY</Text>
              <Text style={styles.aiTitle}>Ask our AI for safe night-time routes in your next city.</Text>
              <View style={styles.aiCta}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>Chat with SafeAI</Text>
                <Feather name="arrow-right" size={16} color="#fff" />
              </View>
            </View>
            <View style={styles.aiOrb}>
              <Feather name="cpu" size={36} color="#fff" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Community feed preview */}
        <View style={styles.section}>
          <SectionHeader title="Community feed" action="View all" onAction={() => router.push("/feed")} />
          {posts.map((p) => (
            <TouchableOpacity
              key={p.id}
              onPress={() => router.push("/feed")}
              style={[styles.postCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              testID={`home-post-${p.id}`}
            >
              <Image source={{ uri: p.image_url }} style={styles.postImg} />
              <View style={{ padding: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  {p.user && <Image source={{ uri: p.user.avatar_url }} style={{ width: 24, height: 24, borderRadius: 999 }} />}
                  <Text style={{ fontWeight: "700", color: colors.text }}>{p.user?.name || "Member"}</Text>
                  {p.user?.verified && <VerifiedBadge size={10} />}
                </View>
                <Text style={{ color: colors.text, marginTop: 6 }} numberOfLines={2}>{p.caption}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>📍 {p.location}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value, icon, colors }: any) {
  return (
    <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
      <Feather name={icon} size={16} color={colors.primary} />
      <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text, marginTop: 4 }}>{value}</Text>
      <Text style={{ fontSize: 11, color: colors.textMuted }}>{label}</Text>
    </View>
  );
}

function QuickAction({ icon, label, onPress, testID }: any) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} testID={testID} style={[styles.qa, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <LinearGradient colors={colors.gradientPrimary} style={styles.qaIcon}>
        <Feather name={icon} size={18} color="#fff" />
      </LinearGradient>
      <Text style={{ fontSize: 12, color: colors.text, fontWeight: "600", marginTop: 6 }}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerHero: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerRow: { flexDirection: "row", alignItems: "center" },
  greet: { fontSize: 14 },
  name: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5, marginTop: 2 },
  iconBtn: { width: 44, height: 44, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  bellDot: { position: "absolute", top: 10, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: "#EC4899" },
  stats: { flexDirection: "row", gap: 10, marginTop: 20 },
  statBox: { flex: 1, padding: 14, borderRadius: 18 },
  quickRow: { flexDirection: "row", paddingHorizontal: 16, marginTop: -8, marginBottom: 16, gap: 10 },
  qa: { flex: 1, alignItems: "center", padding: 12, borderRadius: 18, borderWidth: 1 },
  qaIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  section: { paddingHorizontal: 20, marginTop: 16 },
  emptyTrip: { padding: 24, borderRadius: 24, alignItems: "flex-start", gap: 6 },
  emptyTripText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  emptyTripSub: { color: "rgba(255,255,255,0.85)", fontSize: 13 },
  tripCard: { width: 240, borderRadius: 20, borderWidth: 1, overflow: "hidden" },
  tripImg: { width: "100%", height: 120 },
  travCard: { width: 110, padding: 12, borderRadius: 16, borderWidth: 1, alignItems: "center", marginRight: 10 },
  travAvatar: { width: 60, height: 60, borderRadius: 999 },
  aiCard: { padding: 20, borderRadius: 24, flexDirection: "row", alignItems: "center", gap: 16 },
  aiBadge: { color: "rgba(255,255,255,0.85)", fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  aiTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginTop: 6, lineHeight: 24 },
  aiCta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
  aiOrb: { width: 64, height: 64, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  postCard: { borderRadius: 20, borderWidth: 1, marginBottom: 12, overflow: "hidden" },
  postImg: { width: "100%", height: 180 },
});
