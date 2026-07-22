import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/auth";
import { useTheme, radii, spacing } from "../../src/theme";
import { GradientButton, GlassCard } from "../../src/ui";
import { api } from "../../src/api";
import { Feather } from "@expo/vector-icons";

export default function GuideEditProfileScreen() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const { colors } = useTheme();

  const [guideName, setGuideName] = useState(user?.name || "");
  const [age, setAge] = useState(String(user?.age || 25));
  const [gender, setGender] = useState(user?.gender || "Female");
  const [experienceYears, setExperienceYears] = useState(String(user?.experience_years || 3));
  const [languages, setLanguages] = useState((user?.languages || ["English", "Hindi"]).join(", "));
  const [pricePerHour, setPricePerHour] = useState("250");
  const [pricePerDay, setPricePerDay] = useState(String(user?.price_per_day || 1500));
  const [bio, setBio] = useState(user?.bio || "Certified female local travel guide.");
  const [services, setServices] = useState((user?.services || ["Heritage Walks", "Food & Shopping Escort"]).join(", "));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSaveGuideDetails = async () => {
    if (!guideName || !age || !gender || !experienceYears || !pricePerDay) {
      setError("Please fill in all required guide profile fields.");
      return;
    }

    const numAge = parseInt(age, 10);
    if (isNaN(numAge) || numAge < 18) {
      setError("Guide registration rejected: Guides must be at least 18 years old.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await api<{ ok: boolean; message: string }>("/guide/profile", {
        method: "POST",
        body: {
          name: guideName.trim(),
          age: numAge,
          gender: gender.trim(),
          experience_years: parseInt(experienceYears, 10) || 1,
          languages: languages.split(",").map((l) => l.trim()).filter(Boolean),
          price_per_hour: parseInt(pricePerHour, 10) || 250,
          price_per_day: parseInt(pricePerDay, 10) || 1500,
          bio: bio.trim(),
          services: services.split(",").map((s) => s.trim()).filter(Boolean),
        },
      });

      setSuccess(res.message || "Guide profile created & saved successfully!");
      await refresh();
      setTimeout(() => {
        router.back();
      }, 1200);
    } catch (e: any) {
      setError(e.message || "Failed to save guide profile details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
          <Feather name="map-pin" size={26} color="#fff" />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Create / Edit Guide Profile</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Set your guiding experience, pricing (₹/hr & ₹/day), and details to guide solo female travellers in India.
        </Text>
      </View>

      <GlassCard style={styles.card}>
        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.error + "22", borderColor: colors.error }]}>
            <Feather name="alert-circle" size={18} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        ) : null}

        {success ? (
          <View style={[styles.successBox, { backgroundColor: colors.success + "22", borderColor: colors.success }]}>
            <Feather name="check-circle" size={18} color={colors.success} />
            <Text style={[styles.successText, { color: colors.success }]}>{success}</Text>
          </View>
        ) : null}

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Guide Full Name *</Text>
          <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Feather name="user" size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="e.g. Meera Nair"
              placeholderTextColor={colors.textMuted}
              value={guideName}
              onChangeText={setGuideName}
            />
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Guide Age (18+) *</Text>
            <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Feather name="calendar" size={16} color={colors.textMuted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="28"
                placeholderTextColor={colors.textMuted}
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={[styles.field, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Sex / Gender *</Text>
            <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Feather name="users" size={16} color={colors.textMuted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Female"
                placeholderTextColor={colors.textMuted}
                value={gender}
                onChangeText={setGender}
              />
            </View>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Guiding Experience (Years) *</Text>
          <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Feather name="award" size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="5"
              placeholderTextColor={colors.textMuted}
              value={experienceYears}
              onChangeText={setExperienceYears}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Languages Known (Comma Separated) *</Text>
          <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Feather name="globe" size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="English, Hindi, Tamil, Malayalam"
              placeholderTextColor={colors.textMuted}
              value={languages}
              onChangeText={setLanguages}
            />
          </View>
        </View>

        {/* Pricing: Per Hour and Per Day in INR */}
        <Text style={[styles.sectionHeading, { color: colors.secondary, marginTop: 8 }]}>Guiding Fee Pricing (₹ / INR)</Text>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Price Per Hour (₹) *</Text>
            <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Text style={{ color: colors.secondary, fontWeight: "900", fontSize: 16 }}>₹</Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="250"
                placeholderTextColor={colors.textMuted}
                value={pricePerHour}
                onChangeText={setPricePerHour}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={[styles.field, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Price Per Day (₹) *</Text>
            <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Text style={{ color: colors.secondary, fontWeight: "900", fontSize: 16 }}>₹</Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="1500"
                placeholderTextColor={colors.textMuted}
                value={pricePerDay}
                onChangeText={setPricePerDay}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Services Offered (Comma Separated)</Text>
          <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Feather name="check-square" size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Heritage Palace Walks, Night Market Escort, Food Tours"
              placeholderTextColor={colors.textMuted}
              value={services}
              onChangeText={setServices}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Guide Biography / Summary</Text>
          <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface, height: 74, alignItems: "flex-start", paddingTop: 10 }]}>
            <Feather name="file-text" size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.input, { color: colors.text, textAlignVertical: "top" }]}
              placeholder="Tell travellers about your expertise and local knowledge..."
              placeholderTextColor={colors.textMuted}
              value={bio}
              onChangeText={setBio}
              multiline
            />
          </View>
        </View>

        <GradientButton
          title="Save & Publish Guide Profile"
          onPress={handleSaveGuideDetails}
          loading={loading}
          style={{ marginTop: 14 }}
        />
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingTop: 40, paddingBottom: 50 },
  header: { alignItems: "center", marginBottom: 20 },
  backBtn: { alignSelf: "flex-start", padding: 8, marginBottom: 8 },
  badge: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  title: { fontSize: 22, fontWeight: "900", textAlign: "center" },
  subtitle: { fontSize: 13, textAlign: "center", marginTop: 4, maxWidth: 340 },
  card: { padding: spacing.lg },
  sectionHeading: { fontSize: 14, fontWeight: "800", marginBottom: 10 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: radii.md, borderWidth: 1, marginBottom: 16 },
  errorText: { fontSize: 13, fontWeight: "600", flex: 1 },
  successBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: radii.md, borderWidth: 1, marginBottom: 16 },
  successText: { fontSize: 13, fontWeight: "600", flex: 1 },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "700", marginBottom: 6 },
  inputContainer: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: radii.md, paddingHorizontal: 12, height: 46, gap: 10 },
  input: { flex: 1, fontSize: 14 },
});
