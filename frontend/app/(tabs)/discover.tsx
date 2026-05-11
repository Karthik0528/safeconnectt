import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "../../src/theme";
import { api } from "../../src/api";
import { Chip, VerifiedBadge } from "../../src/ui";

export default function Discover() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [active, setActive] = useState<"women" | "guides">(params.tab === "guides" ? "guides" : "women");
  const [travellers, setTravellers] = useState<any[]>([]);
  const [guides, setGuides] = useState<any[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const qs = cityFilter ? `?city=${encodeURIComponent(cityFilter)}` : "";
    const [tr, gs, locs] = await Promise.all([
      api<any[]>("/travellers/suggested"),
      api<any[]>("/guides" + qs),
      api<{ cities: string[]; countries: string[] }>("/guides/locations"),
    ]);
    setTravellers(tr);
    setGuides(gs);
    setCities(locs.cities);
    setCountries(locs.countries);
  }, [cityFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const sendRequest = async (id: string) => {
    try {
      await api("/matches/request", { method: "POST", body: { target_user_id: id, message: "Hey, let's connect!" } });
      setTravellers((t) => t.map((x) => (x.id === id ? { ...x, _requested: true } : x)));
    } catch {}
  };

  const openChat = async (otherId: string) => {
    const chat = await api<{ id: string }>("/chats/start", { method: "POST", body: { other_user_id: otherId } });
    router.push({ pathname: "/chat/[id]", params: { id: chat.id } });
  };

  const term = search.trim().toLowerCase();
  const filteredTrav = travellers.filter((t) => t.name.toLowerCase().includes(term));
  const filteredGuides = guides.filter(
    (g) =>
      !term ||
      g.name.toLowerCase().includes(term) ||
      g.city.toLowerCase().includes(term) ||
      g.country.toLowerCase().includes(term)
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        <Text style={[styles.title, { color: colors.text }]}>Discover</Text>
        <Text style={{ color: colors.textMuted, marginTop: 2 }}>
          Find verified women travellers & local guides by city.
        </Text>

        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Feather name="search" size={18} color={colors.textMuted} />
          <TextInput
            testID="discover-search"
            placeholder={`Search ${active === "women" ? "travellers" : "guides, cities, countries"}…`}
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            style={{ flex: 1, marginLeft: 8, color: colors.text }}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")} testID="clear-search">
              <Feather name="x-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={{ flexDirection: "row", marginTop: 14, marginBottom: 6 }}>
          <Chip label="Travellers" active={active === "women"} onPress={() => setActive("women")} testID="tab-women" />
          <Chip label="Local guides" active={active === "guides"} onPress={() => setActive("guides")} testID="tab-guides" />
        </View>
      </View>

      {active === "guides" && (
        <View style={{ paddingHorizontal: 20, marginTop: 6 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Chip
              label="All cities"
              active={!cityFilter}
              onPress={() => setCityFilter(null)}
              testID="city-all"
            />
            {cities.map((c) => (
              <Chip key={c} label={c} active={cityFilter === c} onPress={() => setCityFilter(c)} testID={`city-${c}`} />
            ))}
            {cities.length === 0 && countries.length === 0 && (
              <Text style={{ color: colors.textMuted, fontSize: 12, alignSelf: "center", marginLeft: 8 }}>
                No guides registered yet — be the first ✨
              </Text>
            )}
          </ScrollView>
        </View>
      )}

      {active === "women" ? (
        <FlatList
          contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
          data={filteredTrav}
          keyExtractor={(t) => t.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity
                onPress={() => router.push({ pathname: "/profile/[id]", params: { id: item.id } })}
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
                testID={`disc-traveller-${item.id}`}
              >
                <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ fontWeight: "700", fontSize: 16, color: colors.text }}>{item.name}</Text>
                    {item.verified && <VerifiedBadge size={11} />}
                  </View>
                  <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                    {item.age} · {item.countries_visited} countries · ⭐ {item.rating}
                  </Text>
                  {item.latest_trip && (
                    <Text style={{ color: colors.primary, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                      ✈️ {item.latest_trip.destination}, {item.latest_trip.country}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
              {item.bio ? <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 10 }} numberOfLines={2}>{item.bio}</Text> : null}
              <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                <TouchableOpacity
                  testID={`request-${item.id}`}
                  onPress={() => sendRequest(item.id)}
                  disabled={item._requested}
                  style={[styles.actionBtn, { backgroundColor: item._requested ? "#E5E7EB" : colors.primary }]}
                >
                  <Feather name={item._requested ? "check" : "user-plus"} size={16} color="#fff" />
                  <Text style={{ color: "#fff", fontWeight: "700" }}>{item._requested ? "Sent" : "Connect"}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => openChat(item.id)}
                  testID={`message-${item.id}`}
                  style={[styles.actionBtn, { backgroundColor: colors.chipBg }]}
                >
                  <Feather name="message-circle" size={16} color={colors.text} />
                  <Text style={{ color: colors.text, fontWeight: "700" }}>Message</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 60 }}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.chipBg }]}>
                <Feather name="users" size={28} color={colors.primary} />
              </View>
              <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16, marginTop: 12 }}>No travellers yet</Text>
              <Text style={{ color: colors.textMuted, marginTop: 4, textAlign: "center", maxWidth: 280 }}>
                As more verified women join, you&apos;ll see them here. Invite a friend ✨
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          contentContainerStyle={{ padding: 20, paddingBottom: 160 }}
          data={filteredGuides}
          keyExtractor={(g) => g.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListHeaderComponent={
            <TouchableOpacity
              onPress={() => router.push("/guide/register")}
              testID="cta-become-guide"
              style={{ marginBottom: 14 }}
            >
              <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.becomeCard}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700", letterSpacing: 1.5 }}>FOR WOMEN GUIDES</Text>
                  <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800", marginTop: 4 }}>Become a Local Guide</Text>
                  <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 12, marginTop: 4 }}>
                    Earn by helping solo women explore your city safely.
                  </Text>
                </View>
                <View style={styles.becomeIcon}>
                  <Feather name="map-pin" size={22} color="#fff" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push({ pathname: "/guide/[id]", params: { id: item.id } })}
              testID={`guide-${item.id}`}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={{ flexDirection: "row", gap: 12 }}>
                <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ fontWeight: "700", fontSize: 16, color: colors.text }}>{item.name}</Text>
                    {item.verified && <VerifiedBadge size={11} />}
                  </View>
                  <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                    📍 {item.city}, {item.country} · {item.experience_years}y exp
                  </Text>
                  <Text style={{ color: colors.primary, fontWeight: "700", marginTop: 4 }}>
                    ${item.price_per_day}/day{item.reviews_count > 0 ? ` · ⭐ ${item.rating} (${item.reviews_count})` : ""}
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color={colors.textMuted} />
              </View>
              <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 8 }} numberOfLines={2}>{item.bio}</Text>
              <View style={{ flexDirection: "row", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                {item.languages.slice(0, 3).map((l: string) => (
                  <View key={l} style={[styles.tag, { backgroundColor: colors.chipBg }]}>
                    <Text style={{ color: colors.text, fontSize: 11, fontWeight: "600" }}>{l}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 40 }}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.chipBg }]}>
                <Feather name="map-pin" size={28} color={colors.primary} />
              </View>
              <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16, marginTop: 12 }}>
                {cityFilter ? `No guides in ${cityFilter} yet` : "No guides yet"}
              </Text>
              <Text style={{ color: colors.textMuted, marginTop: 4, textAlign: "center", maxWidth: 280 }}>
                Be the first to share your city — tap “Become a Local Guide” above.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: "800", letterSpacing: -0.7 },
  searchBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16, borderWidth: 1, marginTop: 16 },
  card: { padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 12 },
  avatar: { width: 60, height: 60, borderRadius: 999 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 999 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  becomeCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 18, borderRadius: 22 },
  becomeIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center" },
  emptyIcon: { width: 64, height: 64, borderRadius: 999, alignItems: "center", justifyContent: "center" },
});
