import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../src/theme";
import { api } from "../../src/api";
import { VerifiedBadge } from "../../src/ui";

export default function ChatList() {
  const { colors } = useTheme();
  const router = useRouter();
  const [chats, setChats] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const c = await api<any[]>("/chats");
    setChats(c);
  }, []);

  useEffect(() => {
    load();
    const i = setInterval(load, 5000);
    return () => clearInterval(i);
  }, [load]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        <Text style={[styles.title, { color: colors.text }]}>Messages</Text>
        <Text style={{ color: colors.textMuted, marginTop: 2 }}>
          Chat with women going your way.
        </Text>
      </View>

      <FlatList
        contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
        data={chats}
        keyExtractor={(c) => c.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 48 }}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.chipBg }]}>
              <Feather name="message-circle" size={28} color={colors.primary} />
            </View>
            <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16, marginTop: 12 }}>No chats yet</Text>
            <Text style={{ color: colors.textMuted, marginTop: 4, textAlign: "center", maxWidth: 260 }}>
              Head to Discover and message a verified traveller to start your first conversation.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/discover")}
              style={[styles.discoverBtn, { backgroundColor: colors.primary }]}
              testID="chat-go-discover"
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>Go to Discover</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push({ pathname: "/chat/[id]", params: { id: item.id } })}
            testID={`chat-list-${item.id}`}
            style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Image
              source={{ uri: item.other?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80" }}
              style={styles.avatar}
            />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ fontWeight: "700", color: colors.text, fontSize: 15 }}>{item.other?.name || "Member"}</Text>
                {item.other?.verified && <VerifiedBadge size={10} />}
              </View>
              <Text numberOfLines={1} style={{ color: colors.textMuted, marginTop: 2 }}>
                {item.last_message || "Say hi 👋"}
              </Text>
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 11 }}>
              {new Date(item.last_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: "800", letterSpacing: -0.7 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 18, borderWidth: 1, marginBottom: 10 },
  avatar: { width: 52, height: 52, borderRadius: 999 },
  emptyIcon: { width: 64, height: 64, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  discoverBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999, marginTop: 16 },
});
