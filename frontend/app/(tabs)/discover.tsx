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
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [tr, gs] = await Promise.all([
      api<any[]>("/travellers/suggested"),
      api<any[]>("/guides"),
    ]);
    setTravellers(tr);
    setGuides(gs);
  }, []);

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
    } catch (e: any) {
      console.warn(e.message);
    }
  };

  const openChat = async (otherId: string) => {
    const chat = await api<{ id: string }>("/chats/start", { method: "POST", body: { other_user_id: otherId } });
    router.push({ pathname: "/chat/[id]", params: { id: chat.id } });
  };

  const filteredTrav = travellers.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));
  const filteredGuides = guides.filter(
    (g) => g.name.toLowerCase().includes(search.toLowerCase()) || g.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        <Text style={[styles.title, { color: colors.text }]}>Discover</Text>
        <Text style={{ color: colors.textMuted, marginTop: 2 }}>
          Find verified women travellers & trusted local guides.
        </Text>

        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Feather name="search" size={18} color={colors.textMuted} />
          <TextInput
            testID="discover-search"
            placeholder={`Search ${active === "women" ? "travellers" : "guides or cities"}…`}
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            style={{ flex: 1, marginLeft: 8, color: colors.text }}
          />
        </View>

        <View style={{ flexDirection: "row", marginTop: 16, marginBottom: 8 }}>
          <Chip label="Travellers" active={active === "women"} onPress={() => setActive("women")} testID="tab-women" />
          <Chip label="Local guides" active={active === "guides"} onPress={() => setActive("guides")} testID="tab-guides" />
        </View>
      </View>

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
            <Text style={{ textAlign: "center", color: colors.textMuted, marginTop: 40 }}>
              No travellers match your search yet.
            </Text>
          }
        />
      ) : (
        <FlatList
          contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
          data={filteredGuides}
          keyExtractor={(g) => g.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
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
                    <VerifiedBadge size={11} />
                  </View>
                  <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                    {item.city}, {item.country} · {item.experience_years}y exp
                  </Text>
                  <Text style={{ color: colors.primary, fontWeight: "700", marginTop: 4 }}>
                    ${item.price_per_day}/day · ⭐ {item.rating} ({item.reviews_count})
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
});
