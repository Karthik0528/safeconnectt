import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "../../src/theme";
import { api } from "../../src/api";
import { useAuth } from "../../src/auth";
import { VerifiedBadge } from "../../src/ui";

export default function ChatConversation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [other, setOther] = useState<any | null>(null);
  const [input, setInput] = useState("");
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    (async () => {
      const chats = await api<any[]>("/chats");
      const c = chats.find((x) => x.id === id);
      if (c) setOther(c.other);
    })();
  }, [id]);

  const load = async () => {
    const msgs = await api<any[]>(`/chats/${id}/messages`);
    setMessages(msgs);
  };

  useEffect(() => {
    load();
    const i = setInterval(load, 3000);
    return () => clearInterval(i);
  }, [id]);

  const send = async () => {
    const t = input.trim();
    if (!t) return;
    setInput("");
    await api("/chats/messages", { method: "POST", body: { chat_id: id, text: t } });
    await load();
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <View style={[styles.header, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()} testID="chat-back">
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        {other && <Image source={{ uri: other.avatar_url }} style={styles.headerAvatar} />}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={{ fontWeight: "800", color: colors.text, fontSize: 16 }}>{other?.name || "Loading…"}</Text>
            {other?.verified && <VerifiedBadge size={10} />}
          </View>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>Active now</Text>
        </View>
        <Feather name="more-vertical" size={20} color={colors.textMuted} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const isMe = item.sender_id === user?.id;
            return (
              <View
                style={[
                  styles.bubble,
                  isMe
                    ? [styles.me, { backgroundColor: colors.primary }]
                    : [styles.them, { backgroundColor: colors.surface, borderColor: colors.border }],
                ]}
              >
                <Text style={{ color: isMe ? "#fff" : colors.text, fontSize: 15, lineHeight: 22 }}>{item.text}</Text>
                <Text style={{ color: isMe ? "rgba(255,255,255,0.7)" : colors.textMuted, fontSize: 10, marginTop: 4, alignSelf: "flex-end" }}>
                  {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={{ color: colors.textMuted, textAlign: "center", marginTop: 40 }}>
              Say hi 👋 — start your first conversation.
            </Text>
          }
        />

        <View style={[styles.inputBar, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <TextInput
            testID="chat-input"
            value={input}
            onChangeText={setInput}
            placeholder="Message…"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.text }]}
            multiline
          />
          <TouchableOpacity onPress={send} disabled={!input.trim()} testID="chat-send" style={{ opacity: !input.trim() ? 0.4 : 1 }}>
            <View style={[styles.sendBtn, { backgroundColor: colors.primary }]}>
              <Feather name="send" size={18} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderBottomWidth: 1 },
  headerAvatar: { width: 38, height: 38, borderRadius: 999 },
  bubble: { maxWidth: "78%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, marginBottom: 8 },
  me: { alignSelf: "flex-end", borderBottomRightRadius: 4 },
  them: { alignSelf: "flex-start", borderWidth: 1, borderBottomLeftRadius: 4 },
  inputBar: { flexDirection: "row", alignItems: "flex-end", gap: 8, padding: 12, borderTopWidth: 1, paddingBottom: Platform.OS === "ios" ? 18 : 12 },
  input: { flex: 1, fontSize: 16, maxHeight: 100, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: "#F3F4F6" },
  sendBtn: { width: 40, height: 40, borderRadius: 999, alignItems: "center", justifyContent: "center" },
});
