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
    try {
      if (typeof (Appearance as any)?.setColorScheme === "function") {
        (Appearance as any).setColorScheme(val ? "dark" : "light");
      }
    } catch (e) {
      // Web browser fallback
    }
  };

  const doLogout = async () => {
    try {
      await logout();
      router.replace("/auth/login");
    } catch (error) {
      Alert.alert("Logout Failed", String(error));
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined" && window.confirm) {
      if (window.confirm("Sign out?\n\nYou'll need your password to sign back in.")) {
        doLogout();
      }
    } else {
      Alert.alert("Sign out?", "You'll need your password to sign back in.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign out", style: "destructive", onPress: doLogout },
      ]);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <LinearGradient colors={colors.gradientPrimary} style={styles.hero}>
          <View style={{ alignItems: "center", paddingHorizontal: 20, paddingTop: 28, paddingBottom: 44 }}>
            <Image source={{ uri: user.avatar_url || undefined }} style={styles.avatar} />
            <View style={{ flexDirection: "row", gap: 6, alignItems: "center", marginTop: 12 }}>
              <Text style={styles.name} testID="profile-name">{user.name}</Text>
              {user.verified && <VerifiedBadge size={16} showLabel />}
            </View>
            <Text style={{ color: "rgba(255,255,255,0.85)", marginTop: 4, fontSize: 15 }}>{user.email}</Text>
            <Text style={{ color: "rgba(255,255,255,0.75)", marginTop: 2, fontSize: 13, fontWeight: "600" }}>
              📍 {user.city || "Chennai"}, {user.state || "Tamil Nadu"}, India
            </Text>

            <View style={{ flexDirection: "row", marginTop: 18, gap: 36 }}>
              <Stat n={user.trips_count || 0} l="Trips" />
              <Stat n={user.countries_visited || 0} l="Countries" />
              <Stat n={user.rating || 5.0} l="Rating" decimal />
            </View>
          </View>
        </LinearGradient>

        <View style={[styles.scoreCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1.5 }}>
              Verification & Safety Status
            </Text>
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800", marginTop: 4 }}>
              Status: <Text style={{ color: user.verified ? "#34D399" : "#FBBF24" }}>{user.verification_status?.toUpperCase() || "PENDING"}</Text>
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 4, lineHeight: 18 }}>
              {user.verified
                ? "Your identity has been verified by Admin. Verified Badge active!"
                : "Your registration is under Admin review. Verified Badge unlocks after approval."}
            </Text>
          </View>
          <View style={[styles.scoreRing, { borderColor: user.verified ? "#34D399" : "#FBBF24" }]}>
            <Feather name={user.verified ? "award" : "clock"} size={26} color={user.verified ? "#34D399" : "#FBBF24"} />
          </View>
        </View>

        <Section title="Account & Portals">
          <Row icon="user" label="Edit Profile Details" onPress={() => router.push("/edit-profile")} testID="row-edit-profile" />
          <Row
            icon="map-pin"
            label="Create / Edit Guide Profile to Guide Travellers"
            onPress={() => router.push("/guide/edit-profile")}
            testID="row-guide-portal"
          />
          {user.role === "admin" && (
            <Row
              icon="shield"
              label="Admin Governance Dashboard"
              onPress={() => router.push("/admin")}
              testID="row-admin-dashboard"
            />
          )}
          <Row icon="calendar" label="My Bookings" onPress={() => router.push("/bookings")} testID="row-bookings" />
          <Row icon="map" label="My Trips" onPress={() => router.push("/trips")} testID="row-trips" />
        </Section>

        <Section title="Preferences & Safety">
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
          <Row icon="phone" label="Emergency Contacts (SOS)" onPress={() => router.push("/(tabs)/sos")} testID="row-em-contacts" />
          <Row icon="cpu" label="AI Safety Assistant" onPress={() => router.push("/ai-assistant")} testID="row-ai" />
        </Section>

        <Section title="System & Support">
          <Row icon="help-circle" label="Help & Support" onPress={() => Alert.alert("Support", "Email us at support@safeconnect.in")} testID="row-help" />
          <Row icon="shield" label="Privacy & Security" onPress={() => Alert.alert("Privacy", "JWT Protected. MongoDB persistence. Verified Women Travellers platform.")} testID="row-privacy" />
          <Row icon="log-out" label="Sign Out" onPress={handleLogout} danger testID="row-logout" />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ n, l, decimal }: { n: number; l: string; decimal?: boolean }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{ color: "#fff", fontSize: 24, fontWeight: "900" }}>{decimal ? n.toFixed(1) : n}</Text>
      <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 2 }}>{l}</Text>
    </View>
  );
}

function Section({ title, children }: any) {
  const { colors } = useTheme();
  return (
    <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
      <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: "900", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>
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
      <View style={[styles.rowIcon, { backgroundColor: danger ? "rgba(239,83,90,0.15)" : colors.chipBg }]}>
        <Feather name={icon} size={18} color={danger ? "#EF535A" : colors.primary} />
      </View>
      <Text style={{ color: danger ? "#EF535A" : colors.text, fontWeight: "700", flex: 1, fontSize: 15 }}>{label}</Text>
      <Feather name="chevron-right" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  hero: { borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: "#fff" },
  name: { color: "#fff", fontSize: 26, fontWeight: "900" },
  scoreCard: { marginHorizontal: 20, marginTop: -28, padding: 18, borderRadius: 20, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 14 },
  scoreRing: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
  rowIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
});
