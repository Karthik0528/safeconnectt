import React, { useRef, useState } from "react";
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

  const getFallbackAiReply = (msg: string): string => {
    const m = msg.toLowerCase();
    if (m.includes("tokyo") || m.includes("japan") || m.includes("neighborhood")) {
      return "🏯 **Tokyo Solo Women Safety Guide:**\n\n• **Safest Areas:** Ginza, Roppongi (daytime), Shibuya, Shinjuku (stay on main lit streets).\n• **Koban (Police Boxes):** Located at every major train station exit — officers speak basic English.\n• **Women-Only Trains:** Active during morning/evening rush hours (look for pink car floor markings).\n• **24/7 Safe Havens:** Lawson, 7-Eleven, and FamilyMart stores are everywhere if you ever need shelter or assistance.";
    }
    if (m.includes("bali") || m.includes("trip") || m.includes("itinerary") || m.includes("5-day")) {
      return "🌴 **5-Day Safe Solo Bali Itinerary:**\n\n• **Day 1-2 (Ubud):** Stay at verified female-friendly villas near Sacred Monkey Forest; take daytime yoga classes.\n• **Day 3 (Canggu):** Beachfront cafes, sunset at Echo Beach with trusted groups.\n• **Day 4-5 (Uluwatu):** Kecak Fire Dance, cliff views. Book certified female local guides via saFeConnect.\n• **Safety Rule:** Always use Grab or Gojek apps for rides rather than unmetered street taxis.";
    }
    if (m.includes("unsafe") || m.includes("night") || m.includes("dark") || m.includes("walking")) {
      return "🚨 **Immediate Steps If Feeling Unsafe at Night:**\n\n1. **Enter a Public Space:** Step immediately into a well-lit hotel lobby, restaurant, or store.\n2. **Use Fake Call:** Tap 'Fake Call' in saFeConnect SOS tab to pretend you are meeting someone right away.\n3. **Share Live Location:** Send your real-time GPS link to your emergency contacts.\n4. **Hold SOS Button:** Hold the red SOS button if you feel in immediate danger — alerts emergency contacts instantly.";
    }
    if (m.includes("translate") || m.includes("spanish") || m.includes("police") || m.includes("help")) {
      return "🗣️ **Essential Spanish Safety Phrases:**\n\n• *Necesito ayuda, por favor llame a la policía.* (I need help, please call the police.)\n• *¿Dónde está la comisaría más cercana?* (Where is the nearest police station?)\n• *Por favor déjame en paz.* (Please leave me alone.)\n• **Emergency Number in Spain/Europe:** Call **112** (free, works on all mobile networks).";
    }
    return `💜 **SafeAI Travel Advice:**\n\nRegarding *'${msg}'*:\n\n• **Location Awareness:** Always download offline maps (Google Maps / Maps.me) before exploring new areas.\n• **Emergency Contacts:** Ensure at least 1 contact is added under your saFeConnect SOS tab.\n• **Local Guides:** Connect with verified female local guides on saFeConnect for safe neighborhood orientation.\n• **Stay Connected:** Keep your phone charged and check in with family at scheduled times.`;
  };

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
      console.log("AI Chat API notice, using fallback response:", e);
      const fallbackText = getFallbackAiReply(text);
      setMessages((m) => [...m, { id: `a-${Date.now()}`, role: "assistant", text: fallbackText }]);
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
          <Feather name="cpu" size={26} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 24 }}>SafeAI</Text>
          <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 15 }}>
            {busy ? "Thinking..." : "Online · trained for women's safety"}
          </Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
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
                <Text style={{ color: colors.textMuted }}>SafeAI is thinking...</Text>
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
                <Text style={{ color: colors.text, flex: 1, fontSize: 16, lineHeight: 21 }}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={[styles.inputBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            testID="ai-input"
            value={input}
            onChangeText={setInput}
            placeholder="Ask SafeAI anything..."
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
  header: { flexDirection: "row", alignItems: "center", gap: 14, padding: 20, paddingTop: 18, paddingBottom: 26, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  back: { width: 46, height: 46, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  aiAvatar: { width: 54, height: 54, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center" },
  bubble: { maxWidth: "88%", paddingHorizontal: 16, paddingVertical: 14, borderRadius: 22, marginBottom: 10 },
  userBubble: { alignSelf: "flex-end", borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: "flex-start", borderWidth: 1, borderBottomLeftRadius: 4 },
  suggestion: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 20, marginBottom: 10 },
  inputBar: { flexDirection: "row", alignItems: "flex-end", gap: 10, padding: 12, paddingHorizontal: 16, borderTopWidth: 1, paddingBottom: Platform.OS === "ios" ? 18 : 12 },
  input: { flex: 1, fontSize: 18, maxHeight: 100, minHeight: 34, paddingVertical: 6 },
  sendBtn: { width: 54, height: 54, borderRadius: 999, alignItems: "center", justifyContent: "center" },
});
