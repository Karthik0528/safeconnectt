import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/auth";
import { useTheme, radii, spacing } from "../../src/theme";
import { GradientButton, GlassCard } from "../../src/ui";
import { Feather } from "@expo/vector-icons";

export default function AdminLoginScreen() {
  const router = useRouter();
  const { adminLogin } = useAuth();
  const { colors } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAdminLogin = async () => {
    if (!email || !password) {
      setError("Please enter Admin Email and Password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await adminLogin(email, password);
      router.replace("/admin");
    } catch (e: any) {
      setError(e.message || "Admin login failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={[styles.logoBadge, { backgroundColor: "#8B5CF6" }]}>
          <Feather name="shield" size={28} color="#fff" />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Admin Portal</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Restricted Platform Governance & Safety Administration.
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
          <Text style={[styles.label, { color: colors.text }]}>Admin Email Address or Username</Text>
          <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Feather name="mail" size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Enter Admin Email or Username"
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

        <GradientButton title="Login to Admin Dashboard" onPress={handleAdminLogin} loading={loading} style={{ marginTop: 12 }} />

        <View style={styles.portalSwitchRow}>
          <TouchableOpacity style={styles.switchBtn} onPress={() => router.push("/user/login")}>
            <Feather name="user" size={16} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: "700" }}>User Portal</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.switchBtn} onPress={() => router.push("/guide/login")}>
            <Feather name="map-pin" size={16} color={colors.secondary} />
            <Text style={{ color: colors.secondary, fontWeight: "700" }}>Guide Portal</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingTop: 60, paddingBottom: 40, justifyContent: "center" },
  header: { alignItems: "center", marginBottom: 24 },
  logoBadge: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  title: { fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
  subtitle: { fontSize: 14, textAlign: "center", marginTop: 6, maxWidth: 320 },
  card: { padding: spacing.lg },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: radii.md, borderWidth: 1, marginBottom: 16 },
  errorText: { fontSize: 13, fontWeight: "600", flex: 1 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "700", marginBottom: 6 },
  inputContainer: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: radii.md, paddingHorizontal: 14, height: 48, gap: 10 },
  input: { flex: 1, fontSize: 15 },
  portalSwitchRow: { flexDirection: "row", justifyContent: "space-around", marginTop: 24, borderTopWidth: 1, borderColor: "rgba(255, 255, 255, 0.1)", paddingTop: 16 },
  switchBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
});
