import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../../src/auth";
import { GradientButton } from "../../src/ui";

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!email || !password) {
      setErr("Email and password are required.");
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <LinearGradient colors={["#FFE4E6", "#FCE7F3"]} style={styles.hero}>
            <View style={styles.logoBadge}>
              <Feather name="map-pin" size={28} color="#fff" />
            </View>
            <Text style={styles.brand}>sa<Text style={{ color: "#EC4899" }}>Fe</Text>Connect</Text>
            <Text style={styles.tag}>Welcome back ✨</Text>
          </LinearGradient>

          <View style={styles.form}>
            <Text style={styles.title}>Sign in</Text>
            <Text style={styles.sub}>to your verified women-only space.</Text>

            <Field label="Email" icon="mail">
              <TextInput
                testID="login-email-input"
                placeholder="you@example.com"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </Field>
            <Field label="Password" icon="lock">
              <TextInput
                testID="login-password-input"
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                style={[styles.input, { flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!show}
              />
              <TouchableOpacity onPress={() => setShow(!show)} testID="toggle-password">
                <Feather name={show ? "eye-off" : "eye"} size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </Field>

            {err && <Text style={styles.err} testID="login-error">{err}</Text>}

            <GradientButton
              title="Sign in"
              onPress={submit}
              loading={busy}
              icon="log-in"
              testID="login-submit-button"
              style={{ marginTop: 16 }}
            />

            <View style={styles.signupRow}>
              <Text style={{ color: "#6B7280" }}>New to saFeConnect? </Text>
              <Link href="/auth/signup" testID="go-signup">
                <Text style={styles.signupLink}>Create account</Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginTop: 16 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.field}>
        <Feather name={icon} size={18} color="#8B5CF6" />
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: 32,
    paddingBottom: 48,
    alignItems: "center",
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  brand: { fontSize: 24, fontWeight: "800", color: "#1F1A24", letterSpacing: -0.5 },
  tag: { color: "#6B7280", marginTop: 4 },
  form: { padding: 24 },
  title: { fontSize: 28, fontWeight: "800", color: "#1F1A24" },
  sub: { color: "#6B7280", marginTop: 4, marginBottom: 8 },
  label: { fontSize: 12, color: "#6B7280", marginBottom: 6, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  input: { flex: 1, fontSize: 16, color: "#1F1A24" },
  err: { color: "#EF4444", marginTop: 12, fontSize: 13 },
  demoBox: { marginTop: 20, backgroundColor: "#F3F0FF", padding: 14, borderRadius: 14 },
  demoTitle: { fontWeight: "700", color: "#8B5CF6", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 },
  demoText: { color: "#1F1A24", marginTop: 4 },
  demoFill: { color: "#EC4899", fontWeight: "600", marginTop: 6 },
  signupRow: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  signupLink: { color: "#8B5CF6", fontWeight: "700" },
});
