import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Switch, Appearance } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/auth";
import { useTheme } from "../../src/theme";
import { VerifiedBadge } from "../../src/ui";

export default function Profile() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { colors, isDark } = useTheme();
  const [darkOverride, setDarkOverride] = useState<boolean>(isDark);

  if (!user) return null;

  const toggleDark = (val: boolean) => {
    setDarkOverride(val);
    Appearance.setColorScheme(val ? "dark" : "light");
  };

  const handleLogout = () =>
    Alert.alert("Sign out?", "You'll need your password to sign back in.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/auth/login");
        },
      },
    ]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <LinearGradient colors={colors.gradientPrimary} style={styles.hero}>
          <View style={{ alignItems: "center", paddingHorizontal: 20, paddingVertical: 24 }}>
            <Image source={{ uri: user.avatar_url || undefined }} style={styles.avatar} />
            <View style={{ flexDirection: "row", gap: 6, alignItems: "center", marginTop: 12 }}>
              <Text style={styles.name} testID="profile-name">{user.name}</Text>
              {user.verified && <VerifiedBadge />}
            </View>
            <Text style={{ color: "rgba(255,255,255,0.85)", marginTop: 4 }}>{user.email}</Text>
            <View style={{ flexDirection: "row", marginTop: 14, gap: 24 }}>
              <Stat n={user.trips_count} l="Trips" />
              <Stat n={user.countries_visited} l="Countries" />
              <Stat n={user.rating} l="Rating" decimal />
            </View>
          </View>
        </LinearGradient>

        <View style={[styles.scoreCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 }}>
              Safety score
            </Text>
            <Text style={{ color: colors.text, fontSize: 28, fontWeight: "800", marginTop: 2 }}>
              {user.safety_score}/100
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }}>
              Boost it by adding emergency contacts & finishing verification.
            </Text>
          </View>
          <View style={[styles.scoreRing, { borderColor: colors.primary }]}>
            <Feather name="shield" size={28} color={colors.primary} />
          </View>
        </View>

        <Section title="Account">
          <Row icon="user" label="Edit profile" onPress={() => router.push("/edit-profile")} testID="row-edit-profile" />
          <Row icon="map-pin" label="Become a Local Guide" onPress={() => router.push("/guide/register")} testID="row-become-guide" />
          <Row icon="calendar" label="My bookings" onPress={() => router.push("/bookings")} testID="row-bookings" />
          <Row icon="map" label="My trips" onPress={() => router.push("/trips")} testID="row-trips" />
        </Section>

        <Section title="Preferences">
          <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.rowIcon, { backgroundColor: colors.chipBg }]}>
              <Feather name="moon" size={18} color={colors.primary} />
            </View>
            <Text style={{ color: colors.text, fontWeight: "600", flex: 1 }}>Dark mode</Text>
            <Switch
              testID="dark-mode-toggle"
              value={darkOverride}
              onValueChange={toggleDark}
              trackColor={{ true: colors.primary, false: "#E5E7EB" }}
            />
          </View>
          <Row icon="bell" label="Notifications" onPress={() => Alert.alert("Notifications", "Configure push alerts in your device settings.")} testID="row-notifs" />
          <Row icon="globe" label="Language" onPress={() => Alert.alert("Language", "More languages coming soon.")} testID="row-language" />
        </Section>

        <Section title="Safety">
          <Row icon="phone" label="Emergency contacts" onPress={() => router.push("/(tabs)/sos")} testID="row-em-contacts" />
          <Row icon="cpu" label="AI assistant" onPress={() => router.push("/ai-assistant")} testID="row-ai" />
        </Section>

        <Section title="Support">
          <Row icon="help-circle" label="Help center" onPress={() => Alert.alert("Help", "Email us at hello@safeconnect.app")} testID="row-help" />
          <Row icon="shield" label="Privacy & policy" onPress={() => Alert.alert("Privacy", "End-to-end encrypted. Data never sold. Verified women only.")} testID="row-privacy" />
          <Row icon="log-out" label="Sign out" onPress={handleLogout} danger testID="row-logout" />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ n, l, decimal }: { n: number; l: string; decimal?: boolean }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800" }}>{decimal ? n.toFixed(1) : n}</Text>
      <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, marginTop: 2 }}>{l}</Text>
    </View>
  );
}

function Section({ title, children }: any) {
  const { colors } = useTheme();
  return (
    <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
      <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function Row({ icon, label, onPress, danger, testID }: any) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: danger ? "#FEE2E2" : colors.chipBg }]}>
        <Feather name={icon} size={18} color={danger ? "#DC2626" : colors.primary} />
      </View>
      <Text style={{ color: danger ? "#DC2626" : colors.text, fontWeight: "600", flex: 1 }}>{label}</Text>
      <Feather name="chevron-right" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  hero: { borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  avatar: { width: 96, height: 96, borderRadius: 999, borderWidth: 3, borderColor: "#fff" },
  name: { color: "#fff", fontSize: 24, fontWeight: "800" },
  scoreCard: { marginHorizontal: 20, marginTop: -20, padding: 18, borderRadius: 22, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  scoreRing: { width: 60, height: 60, borderRadius: 999, borderWidth: 3, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 8 },
  rowIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
});
