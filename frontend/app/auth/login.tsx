import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../../src/auth";
import { useTheme, radii, spacing } from "../../src/theme";
import { GradientButton, GlassCard } from "../../src/ui";

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const { colors } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!email || !password) {
      setErr("Email/Username and password are required.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace("/(tabs)/home");
    } catch (e: any) {
      setErr(e.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: 40, paddingBottom: 40 }}>
        <View style={styles.header}>
          <View style={[styles.logoBadge, { backgroundColor: colors.primary }]}>
            <Feather name="shield" size={28} color="#fff" />
          </View>
          <Text style={[styles.brand, { color: colors.text }]}>
            sa<Text style={{ color: colors.primary }}>Fe</Text>Connect
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Production-Ready Solo Female Travellers Platform
          </Text>
        </View>

        {/* Portals Selection Card */}
        <View style={styles.portalCardRow}>
          <TouchableOpacity
            style={[styles.portalBox, { backgroundColor: colors.surface, borderColor: colors.primary }]}
            onPress={() => router.push("/user/login")}
          >
            <Feather name="user" size={20} color={colors.primary} />
            <Text style={[styles.portalText, { color: colors.text }]}>User Portal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.portalBox, { backgroundColor: colors.surface, borderColor: colors.secondary }]}
            onPress={() => router.push("/guide/login")}
          >
            <Feather name="map-pin" size={20} color={colors.secondary} />
            <Text style={[styles.portalText, { color: colors.text }]}>Guide Portal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.portalBox, { backgroundColor: colors.surface, borderColor: "#8B5CF6" }]}
            onPress={() => router.push("/admin/login")}
          >
            <Feather name="shield" size={20} color="#8B5CF6" />
            <Text style={[styles.portalText, { color: colors.text }]}>Admin Portal</Text>
          </TouchableOpacity>
        </View>

        <GlassCard style={styles.card}>
          <Text style={[styles.title, { color: colors.text }]}>Direct Login</Text>

          {err ? (
            <View style={[styles.errorBox, { backgroundColor: colors.error + "22", borderColor: colors.error }]}>
              <Feather name="alert-circle" size={18} color={colors.error} />
              <Text style={{ color: colors.error, fontSize: 13, flex: 1 }}>{err}</Text>
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Email Address or Username</Text>
            <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Feather name="mail" size={18} color={colors.textMuted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="user@safeconnect.in or your_username"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
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

          <GradientButton title="Sign In" onPress={submit} loading={busy} style={{ marginTop: 16 }} />

          <View style={styles.signupRow}>
            <Text style={{ color: colors.textMuted }}>New to saFeConnect? </Text>
            <TouchableOpacity onPress={() => router.push("/user/signup")}>
              <Text style={{ color: colors.primary, fontWeight: "700" }}>Register User</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", marginBottom: 20 },
  logoBadge: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  brand: { fontSize: 24, fontWeight: "900" },
  subtitle: { fontSize: 13, marginTop: 4 },
  portalCardRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, gap: 8 },
  portalBox: { flex: 1, paddingVertical: 14, borderRadius: radii.md, borderWidth: 1.5, alignItems: "center", gap: 6 },
  portalText: { fontSize: 12, fontWeight: "800" },
  card: { padding: spacing.lg },
  title: { fontSize: 20, fontWeight: "800", marginBottom: 16 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: radii.md, borderWidth: 1, marginBottom: 14 },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "700", marginBottom: 6 },
  inputContainer: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: radii.md, paddingHorizontal: 14, height: 46, gap: 10 },
  input: { flex: 1, fontSize: 15 },
  signupRow: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
});
