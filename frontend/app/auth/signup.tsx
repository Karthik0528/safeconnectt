import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useTheme, radii, spacing } from "../../src/theme";
import { GlassCard } from "../../src/ui";

export default function Signup() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: 40 }}>
        <View style={styles.header}>
          <Text style={[styles.brand, { color: colors.text }]}>
            Join sa<Text style={{ color: colors.primary }}>Fe</Text>Connect
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Select your registration portal to get started
          </Text>
        </View>

        <GlassCard style={styles.card}>
          <TouchableOpacity
            style={[styles.portalBtn, { backgroundColor: colors.surface, borderColor: colors.primary }]}
            onPress={() => router.push("/user/signup")}
          >
            <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
              <Feather name="user" size={24} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.portalTitle, { color: colors.text }]}>Register as Traveller (User)</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }}>
                Full user profile with Indian states, emergency contacts, and Aadhaar/Passport verification.
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.portalBtn, { backgroundColor: colors.surface, borderColor: colors.secondary, marginTop: 14 }]}
            onPress={() => router.push("/guide/signup")}
          >
            <View style={[styles.iconCircle, { backgroundColor: colors.secondary }]}>
              <Feather name="map-pin" size={24} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.portalTitle, { color: colors.text }]}>Register as Local Guide</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }}>
                Professional guide profile with Guide ID, Tourism Dept ID, Address Proof, Services, and Pricing.
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </GlassCard>

        <View style={styles.footerRow}>
          <Text style={{ color: colors.textMuted }}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/auth/login")}>
            <Text style={{ color: colors.primary, fontWeight: "700" }}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", marginBottom: 24 },
  brand: { fontSize: 28, fontWeight: "900" },
  subtitle: { fontSize: 14, marginTop: 6 },
  card: { padding: spacing.lg },
  portalBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: radii.md,
    borderWidth: 1.5,
    gap: 14,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  portalTitle: { fontSize: 16, fontWeight: "800" },
  footerRow: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
});
