import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/auth";
import { useTheme, radii, spacing } from "../../src/theme";
import { GradientButton, GlassCard } from "../../src/ui";
import { Feather } from "@expo/vector-icons";

export default function GuideLoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { colors } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in both Guide Email/Username and Password.");
      return;
    }
    const cleanIdentifier = email.trim().toLowerCase();
    if (cleanIdentifier.includes("@") && !cleanIdentifier.endsWith("@gmail.com")) {
      setError("Guide login rejected: Only official @gmail.com email addresses are allowed.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(cleanIdentifier, password);
      router.replace("/(tabs)/home");
    } catch (e: any) {
      setError(e.message || "Invalid guide login credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={[styles.logoBadge, { backgroundColor: colors.secondary }]}>
          <Feather name="map-pin" size={28} color="#fff" />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Guide Portal Login</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Offer safe, certified local travel guiding to solo female travellers in India.
        </Text>
      </View>

      <GlassCard style={styles.card}>
        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.error + "22", borderColor: colors.error }]}>
            <Feather name="alert-circle" size={18} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Guide Email Address or Username</Text>
          <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Feather name="mail" size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="guide@safeconnect.in or your_username"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Password</Text>
          <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Feather name="lock" size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </View>

        <GradientButton title="Login as Certified Guide" onPress={handleLogin} loading={loading} style={{ marginTop: 16 }} />

        <View style={styles.footerRow}>
          <Text style={{ color: colors.textMuted }}>Want to register as a local Guide? </Text>
          <TouchableOpacity onPress={() => router.push("/guide/signup")}>
            <Text style={{ color: colors.secondary, fontWeight: "700" }}>Guide Sign Up</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>

      <View style={styles.portalSwitchRow}>
        <TouchableOpacity style={styles.switchBtn} onPress={() => router.push("/user/login")}>
          <Feather name="user" size={16} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: "700" }}>User Portal</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.switchBtn} onPress={() => router.push("/admin/login")}>
          <Feather name="shield" size={16} color={colors.textMuted} />
          <Text style={{ color: colors.textMuted, fontWeight: "700" }}>Admin Portal</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingTop: 60, paddingBottom: 40, justifyContent: "center" },
  header: { alignItems: "center", marginBottom: 24 },
  logoBadge: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  title: { fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
  subtitle: { fontSize: 14, textAlign: "center", marginTop: 6, maxWidth: 300 },
  card: { padding: spacing.lg },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: radii.md, borderWidth: 1, marginBottom: 16 },
  errorText: { fontSize: 13, fontWeight: "600", flex: 1 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "700", marginBottom: 6 },
  inputContainer: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: radii.md, paddingHorizontal: 14, height: 48, gap: 10 },
  input: { flex: 1, fontSize: 15 },
  footerRow: { flexDirection: "row", justifyContent: "center", marginTop: 22 },
  portalSwitchRow: { flexDirection: "row", justifyContent: "space-around", marginTop: 30 },
  switchBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 10, paddingHorizontal: 16 },
});
