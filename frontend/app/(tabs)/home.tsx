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
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/auth";
import { useTheme, ThemeColors } from "../../src/theme";
import { api } from "../../src/api";
import { SectionHeader, VerifiedBadge } from "../../src/ui";

export default function Home() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const [trips, setTrips] = useState<any[]>([]);
  const [travellers, setTravellers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [guideBookings, setGuideBookings] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
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

  const loadGuideBookings = useCallback(async () => {
    if (user?.role === "guide" || user?.is_guide) {
      try {
        const b = await api<any[]>("/bookings/guide-managed");
        setGuideBookings(b);
      } catch (e) {
        console.warn(e);
      }
    }
  }, [user]);

  useEffect(() => {
    load();
    loadGuideBookings();
  }, [load, loadGuideBookings]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([load(), loadGuideBookings()]);
    setRefreshing(false);
  };

  const handleAcceptBooking = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      await api(`/bookings/${bookingId}/accept`, { method: "POST" });
      Alert.alert("Booking Accepted 🎉", "You have confirmed this guiding session. Traveller notified!");
      await loadGuideBookings();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to accept booking.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      await api(`/bookings/${bookingId}/reject`, { method: "POST" });
      Alert.alert("Booking Declined", "You have declined this booking request.");
      await loadGuideBookings();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to decline booking.");
    } finally {
      setActionLoading(null);
    }
  };

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  const firstName = user?.name.split(" ")[0] || "Traveller";
  const isGuideUser = user?.role === "guide" || user?.is_guide;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        testID="home-scroll"
      >
        {/* Header Hero */}
        <LinearGradient colors={colors.gradientPrimary} style={styles.hero}>
          <View style={styles.topRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
                <Image
                  source={{
                    uri: user?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
                  }}
                  style={styles.avatar}
                />
              </TouchableOpacity>
              <View>
                <Text style={styles.greet}>{greeting},</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={styles.name}>{firstName}</Text>
                  {user?.verified && <VerifiedBadge size={14} />}
                </View>
                {isGuideUser ? (
                  <Text style={{ color: "#FBBF24", fontWeight: "800", fontSize: 11, marginTop: 2 }}>
                    ● CERTIFIED FEMALE LOCAL GUIDE
                  </Text>
                ) : null}
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => router.push("/bookings")} testID="my-bookings-btn">
                <Feather name="calendar" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => router.push("/sos")} testID="sos-btn">
                <Feather name="bell" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Verification Status Banner */}
          {!user?.verified ? (
            <TouchableOpacity style={styles.verificationBanner} onPress={() => router.push("/(tabs)/profile")}>
              <Feather name="alert-circle" size={16} color="#FBBF24" />
              <Text style={styles.verificationBannerText}>
                Identity Verification Pending: Complete onboarding to receive your Verified Shield Badge.
              </Text>
            </TouchableOpacity>
          ) : null}

          {/* Stats Bar */}
          <View style={styles.stats}>
            <Stat label="Safety score" value={`${user?.safety_score ?? 100}/100`} icon="shield" colors={colors} />
            <Stat label="Countries" value={String(user?.countries_visited || 0)} icon="globe" colors={colors} />
            <Stat label="Trips" value={String(user?.trips_count || 0)} icon="map" colors={colors} />
          </View>
        </LinearGradient>

        {/* GUIDES ONLY: Create / Edit Guide Details Banner */}
        {isGuideUser && (
          <View style={{ paddingHorizontal: 20, marginVertical: 14 }}>
            <TouchableOpacity
              onPress={() => router.push("/guide/edit-profile")}
              activeOpacity={0.85}
              testID="qa-create-guide-details"
            >
              <LinearGradient
                colors={["#F8BA7C", "#EA580C", "#D97706"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.guideHighlightCard}
              >
                <View style={styles.guideIconBadge}>
                  <Feather name="map-pin" size={24} color="#EA580C" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#FFFFFF", fontWeight: "900", fontSize: 17, letterSpacing: -0.3 }}>
                    Create / Edit Guide Details
                  </Text>
                  <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 12, marginTop: 3 }}>
                    Set your experience, languages, fee (₹) & guide female travellers safely
                  </Text>
                </View>
                <View style={styles.guideChevronBadge}>
                  <Feather name="arrow-right" size={18} color="#fff" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* GUIDES ONLY: Traveller Guiding Management Tab Section */}
        {isGuideUser && (
          <View style={{ paddingHorizontal: 20, marginBottom: 18 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Traveller Guiding Management</Text>
              <View style={{ backgroundColor: colors.chipBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 11 }}>
                  {guideBookings.length} Traveller Sessions
                </Text>
              </View>
            </View>

            {guideBookings.length === 0 ? (
              <View style={[styles.emptyGuideBookings, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Feather name="users" size={26} color={colors.primary} />
                <Text style={{ color: colors.text, fontWeight: "800", fontSize: 15, marginTop: 8 }}>
                  No Traveller Bookings Yet
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: "center", marginTop: 4, lineHeight: 18 }}>
                  When solo female travellers book your guiding service, their date, time, and location will appear here for your approval!
                </Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {guideBookings.map((b) => (
                  <View key={b.id} style={[styles.guideBookingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                      <Image
                        source={{ uri: b.user?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80" }}
                        style={styles.travellerAvatarImg}
                      />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Text style={{ fontWeight: "900", fontSize: 16, color: colors.text }}>{b.user?.name || "Traveller"}</Text>
                          {b.user?.verified && <VerifiedBadge size={12} />}
                        </View>
                        <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                          📞 {b.user?.phone || "+91-9876543210"} • 🛡️ {b.user?.safety_score ?? 100}/100 Safety
                        </Text>
                        <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 12, marginTop: 2 }}>
                          🗓️ Date/Time: {b.date} ({b.time || "Day Session"})
                        </Text>
                        <Text style={{ color: colors.secondary, fontWeight: "700", fontSize: 12, marginTop: 1 }}>
                          📍 Guiding Location: {b.place || b.user?.city || "Local Destination"}
                        </Text>
                        {b.notes ? (
                          <Text style={{ color: colors.textMuted, fontSize: 11, fontStyle: "italic", marginTop: 3 }}>
                            Traveller Notes: "{b.notes}"
                          </Text>
                        ) : null}
                      </View>

                      {/* Status Badge */}
                      <View style={[styles.statusBadge, {
                        backgroundColor: b.status === "confirmed" ? "rgba(52,211,153,0.18)" : b.status === "rejected" ? "rgba(239,83,90,0.18)" : "rgba(251,191,36,0.18)"
                      }]}>
                        <Text style={{
                          fontSize: 10,
                          fontWeight: "800",
                          color: b.status === "confirmed" ? "#34D399" : b.status === "rejected" ? "#EF535A" : "#FBBF24"
                        }}>
                          {(b.status || "PENDING").toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {/* Interactive Accept / Decline Buttons */}
                    {b.status !== "confirmed" && b.status !== "rejected" && (
                      <View style={{ flexDirection: "row", gap: 10, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" }}>
                        {actionLoading === b.id ? (
                          <ActivityIndicator color={colors.primary} />
                        ) : (
                          <>
                            <TouchableOpacity
                              style={[styles.guideActionBtn, { backgroundColor: "#34D399" }]}
                              onPress={() => handleAcceptBooking(b.id)}
                            >
                              <Feather name="check" size={14} color="#fff" />
                              <Text style={styles.guideActionText}>Accept Traveller</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[styles.guideActionBtn, { backgroundColor: "#EF535A" }]}
                              onPress={() => handleRejectBooking(b.id)}
                            >
                              <Feather name="x" size={14} color="#fff" />
                              <Text style={styles.guideActionText}>Decline</Text>
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickRow}>
          <QuickAction icon="plus-circle" label="New trip" onPress={() => router.push("/trip/create")} testID="qa-new-trip" />
          <QuickAction icon="cpu" label="AI tips" onPress={() => router.push("/ai-assistant")} testID="qa-ai" />
          <QuickAction icon="users" label="Find women" onPress={() => router.push("/(tabs)/discover")} testID="qa-find" />
          <QuickAction icon="map-pin" label="Guides" onPress={() => router.push({ pathname: "/(tabs)/discover", params: { tab: "guides" } })} testID="qa-guides" />
        </View>

        {/* Upcoming Trips */}
        <View style={styles.section}>
          <SectionHeader title="Your trips" action="New trip" onAction={() => router.push("/trip/create")} />
          {trips.length === 0 ? (
            <TouchableOpacity onPress={() => router.push("/trip/create")} testID="empty-trip-cta">
              <LinearGradient colors={colors.gradientPrimary} style={styles.emptyTrip}>
                <Feather name="map" size={24} color="#fff" />
                <Text style={styles.emptyTripText}>Plan your solo adventure in India</Text>
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
                  <LinearGradient colors={[colors.surface, colors.chipBg]} style={styles.tripCard}>
                    <Image source={{ uri: item.cover_image }} style={styles.tripImg} />
                    <View style={{ padding: 12 }}>
                      <Text style={{ fontWeight: "800", color: colors.text, fontSize: 16 }}>{item.destination}</Text>
                      <Text style={{ color: colors.textMuted, fontSize: 12 }}>{item.country} · {item.start_date}</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        {/* Suggested Solo Female Travellers */}
        <View style={styles.section}>
          <SectionHeader title="Female travellers nearby" action="See all" onAction={() => router.push("/(tabs)/discover")} />
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={travellers}
            keyExtractor={(t) => t.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => router.push({ pathname: "/user/[id]", params: { id: item.id } })}
                style={[styles.travellerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Image source={{ uri: item.avatar_url }} style={styles.travellerAvatar} />
                <Text style={{ fontWeight: "700", color: colors.text, fontSize: 13, marginTop: 8 }} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>{item.city || item.area || "India"}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Community Feed Preview */}
        <View style={styles.section}>
          <SectionHeader title="Community safety feed" action="Feed" onAction={() => router.push("/(tabs)/feed")} />
          {posts.map((post) => (
            <View key={post.id} style={[styles.postCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.postHeader}>
                <Image source={{ uri: post.user?.avatar_url }} style={styles.postAvatar} />
                <View>
                  <Text style={{ fontWeight: "700", color: colors.text }}>{post.user?.name}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11 }}>{post.location}</Text>
                </View>
              </View>
              <Text style={{ color: colors.text, marginTop: 8 }} numberOfLines={2}>{post.caption}</Text>
              {post.image_url ? <Image source={{ uri: post.image_url }} style={styles.postImg} /> : null}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value, icon, colors }: { label: string; value: string; icon: any; colors: ThemeColors }) {
  return (
    <View style={[styles.statTile, { backgroundColor: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.2)" }]}>
      <Feather name={icon} size={16} color="#fff" />
      <Text style={{ color: "#fff", fontWeight: "900", fontSize: 18, marginTop: 4 }}>{value}</Text>
      <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 11 }}>{label}</Text>
    </View>
  );
}

function QuickAction({ icon, label, onPress, testID }: { icon: any; label: string; onPress: () => void; testID?: string }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={styles.qaItem} testID={testID}>
      <View style={[styles.qaIcon, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Feather name={icon} size={22} color={colors.primary} />
      </View>
      <Text style={{ color: colors.text, fontSize: 12, fontWeight: "600", marginTop: 6 }}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 28, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: "#fff" },
  greet: { color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "600" },
  name: { color: "#fff", fontSize: 22, fontWeight: "900" },
  iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  verificationBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(251, 191, 36, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.3)",
    padding: 10,
    borderRadius: 12,
    marginTop: 14,
  },
  verificationBannerText: { color: "#FFF0F4", fontSize: 12, flex: 1 },
  guideHighlightCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    gap: 14,
    shadowColor: "#EA580C",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  guideIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FFF0F4",
    alignItems: "center",
    justifyContent: "center",
  },
  guideChevronBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: { fontSize: 18, fontWeight: "800" },
  emptyGuideBookings: { padding: 18, borderRadius: 18, borderWidth: 1, alignItems: "center" },
  guideBookingCard: { padding: 14, borderRadius: 18, borderWidth: 1 },
  travellerAvatarImg: { width: 50, height: 50, borderRadius: 25 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  guideActionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, borderRadius: 12 },
  guideActionText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  stats: { flexDirection: "row", gap: 10, marginTop: 18 },
  statTile: { flex: 1, padding: 12, borderRadius: 16, borderWidth: 1, alignItems: "center" },
  quickRow: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 16, marginVertical: 20 },
  qaItem: { alignItems: "center", flex: 1 },
  qaIcon: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  emptyTrip: { padding: 20, borderRadius: 20, alignItems: "center" },
  emptyTripText: { color: "#fff", fontWeight: "800", fontSize: 16, marginTop: 8 },
  emptyTripSub: { color: "rgba(255,255,255,0.85)", fontSize: 12, textAlign: "center", marginTop: 4 },
  tripCard: { width: 180, borderRadius: 18, overflow: "hidden" },
  tripImg: { width: "100%", height: 110 },
  travellerCard: { width: 100, padding: 12, borderRadius: 18, borderWidth: 1, alignItems: "center", marginRight: 10 },
  travellerAvatar: { width: 52, height: 52, borderRadius: 26 },
  postCard: { padding: 14, borderRadius: 18, borderWidth: 1, marginBottom: 12 },
  postHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  postAvatar: { width: 38, height: 38, borderRadius: 19 },
  postImg: { width: "100%", height: 180, borderRadius: 14, marginTop: 10 },
});
