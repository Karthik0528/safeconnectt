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
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../src/theme";
import { api } from "../src/api";

type Msg = { role: "user" | "assistant"; text: string; id: string };

const SUGGESTIONS = [
  "Safest neighborhoods in Tokyo for solo women?",
  "Plan a 5-day Bali trip with safety tips.",
  "What to do if I feel unsafe walking at night?",
  "Translate 'I need help, please call the police' to Spanish.",
];

export default function AiAssistant() {
  const { colors } = useTheme();
  const router = useRouter();
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "intro",
      role: "assistant",
      text: "Hi! I'm SafeAI, your women-only solo travel companion. Ask me anything — safe routes, packing, scams to avoid, cultural tips, translations. 💜",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<FlatList>(null);

  const send = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || busy) return;
    setInput("");
    const userMsg: Msg = { id: `u-${Date.now()}`, role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setBusy(true);
    try {
      const r = await api<{ reply: string }>("/ai/chat", {
        method: "POST",
        body: { session_id: sessionId, message: text },
      });
      setMessages((m) => [...m, { id: `a-${Date.now()}`, role: "assistant", text: r.reply }]);
    } catch (e: any) {
      setMessages((m) => [...m, { id: `e-${Date.now()}`, role: "assistant", text: `(Error) ${e.message}` }]);
    } finally {
      setBusy(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <LinearGradient colors={colors.gradientPrimary} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back} testID="ai-back">
          <Feather name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.aiAvatar}>
          <Feather name="cpu" size={20} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 18 }}>SafeAI</Text>
          <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
            {busy ? "Thinking…" : "Online · trained for women's safety"}
          </Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View
              testID={`msg-${item.role}`}
              style={[
                styles.bubble,
                item.role === "user"
                  ? [styles.userBubble, { backgroundColor: colors.primary }]
                  : [styles.aiBubble, { backgroundColor: colors.surface, borderColor: colors.border }],
              ]}
            >
              <Text style={{ color: item.role === "user" ? "#fff" : colors.text, fontSize: 15, lineHeight: 22 }}>
                {item.text}
              </Text>
            </View>
          )}
          ListFooterComponent={
            busy ? (
              <View style={[styles.bubble, styles.aiBubble, { backgroundColor: colors.surface, borderColor: colors.border, flexDirection: "row", gap: 8 }]}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ color: colors.textMuted }}>SafeAI is thinking…</Text>
              </View>
            ) : null
          }
        />

        {messages.length <= 1 && (
          <View style={{ paddingHorizontal: 16 }}>
            <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
              Try asking
            </Text>
            {SUGGESTIONS.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => send(s)}
                testID={`suggestion-${s.slice(0, 10)}`}
                style={[styles.suggestion, { backgroundColor: colors.chipBg }]}
              >
                <Feather name="zap" size={14} color={colors.primary} />
                <Text style={{ color: colors.text, flex: 1, fontSize: 13 }}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={[styles.inputBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            testID="ai-input"
            value={input}
            onChangeText={setInput}
            placeholder="Ask SafeAI anything…"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.text }]}
            multiline
          />
          <TouchableOpacity
            onPress={() => send()}
            disabled={busy || !input.trim()}
            testID="ai-send"
            style={{ opacity: !input.trim() ? 0.4 : 1 }}
          >
            <LinearGradient colors={colors.gradientPrimary} style={styles.sendBtn}>
              <Feather name="send" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16, paddingTop: 12, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  back: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  aiAvatar: { width: 40, height: 40, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center" },
  bubble: { maxWidth: "85%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, marginBottom: 8 },
  userBubble: { alignSelf: "flex-end", borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: "flex-start", borderWidth: 1, borderBottomLeftRadius: 4 },
  suggestion: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 14, marginBottom: 6 },
  inputBar: { flexDirection: "row", alignItems: "flex-end", gap: 8, padding: 10, paddingHorizontal: 14, borderTopWidth: 1, paddingBottom: Platform.OS === "ios" ? 18 : 10 },
  input: { flex: 1, fontSize: 16, maxHeight: 100, minHeight: 24, paddingVertical: 6 },
  sendBtn: { width: 40, height: 40, borderRadius: 999, alignItems: "center", justifyContent: "center" },
});
