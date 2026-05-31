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
      <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
        <Text style={[styles.title, { color: colors.text }]}>Messages</Text>
        <Text style={{ color: colors.textMuted, marginTop: 6, fontSize: 16, lineHeight: 22 }}>
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
          <View style={{ alignItems: "center", marginTop: 120 }}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.chipBg }]}>
              <Feather name="message-circle" size={34} color={colors.primary} />
            </View>
            <Text style={{ color: colors.text, fontWeight: "900", fontSize: 22, marginTop: 18 }}>No chats yet</Text>
            <Text style={{ color: colors.textMuted, marginTop: 8, textAlign: "center", maxWidth: 280, fontSize: 17, lineHeight: 23 }}>
              Head to Discover and message a verified traveller to start your first conversation.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/discover")}
              style={[styles.discoverBtn, { backgroundColor: colors.primary }]}
              testID="chat-go-discover"
            >
              <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>Go to Discover</Text>
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
  title: { fontSize: 38, fontWeight: "900" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 18, borderWidth: 1, marginBottom: 10 },
  avatar: { width: 52, height: 52, borderRadius: 999 },
  emptyIcon: { width: 86, height: 86, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  discoverBtn: { paddingHorizontal: 34, paddingVertical: 16, borderRadius: 999, marginTop: 24 },
});
