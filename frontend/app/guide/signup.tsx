import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/auth";
import { useTheme, radii, spacing } from "../../src/theme";
import { GradientButton, GlassCard } from "../../src/ui";
import { Feather } from "@expo/vector-icons";

export default function GuideSignupScreen() {
  const router = useRouter();
  const { guideSignup } = useAuth();
  const { colors } = useTheme();

  // Guide personal details
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("Female");
  const [dob, setDob] = useState("");
  const [age, setAge] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");

  // Guide professional details
  const [guideIdNum, setGuideIdNum] = useState("");
  const [tourismId, setTourismId] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [bio, setBio] = useState("");
  const [pricePerDay, setPricePerDay] = useState("");

  // Identification docs
  const [governmentId, setGovernmentId] = useState("");
  const [guideGovtId, setGuideGovtId] = useState("");
  const [addressProof, setAddressProof] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80");

  // Emergency Contact
  const [emName, setEmName] = useState("");
  const [emPhone, setEmPhone] = useState("");
  const [emRelation, setEmRelation] = useState("Family");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCompleteGuideSignup = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.endsWith("@gmail.com")) {
      setError("Guide registration rejected: Only official @gmail.com email addresses are allowed.");
      return;
    }

    if (!name || !password || !phone || !city || !guideIdNum || !tourismId || !governmentId) {
      setError("Please fill in all required Guide registration fields.");
      return;
    }

    const numAge = parseInt(age, 10);
    if (isNaN(numAge) || numAge < 18) {
      setError("Guide registration rejected: Guides must be at least 18 years old.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await guideSignup({
        name,
        nickname: nickname.trim() || name.split(" ")[0],
        username: username.trim() || name.toLowerCase().replace(/\s+/g, "_"),
        email: cleanEmail,
        password,
        phone,
        gender,
        dob,
        age: numAge,
        state,
        district,
        city,
        emergency_contact: { name: emName || "Guardian", phone: emPhone || phone, relation: emRelation },
        guide_id_num: guideIdNum,
        tourism_id: tourismId,
        guide_govt_id: guideGovtId,
        address_proof: addressProof,
        experience_years: parseInt(experienceYears, 10) || 1,
        certifications: ["Certified Tour Guide", "First Aid Certified"],
        services: ["Heritage Walks", "City Orientation", "Cultural Food Tours"],
        availability: "Available",
        price_per_day: parseInt(pricePerDay, 10) || 1500,
        bio,
        government_id: governmentId,
        avatar_url: avatarUrl,
        interests: ["Guiding", "Heritage", "Local History"],
        languages: ["English", "Hindi"],
      });
      router.replace("/(tabs)/home");
    } catch (e: any) {
      setError(e.message || "Guide registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
          <Feather name="map-pin" size={24} color="#fff" />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Certified Guide Registration</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Complete your professional guide application with your official @gmail.com address
        </Text>
      </View>

      <GlassCard style={styles.card}>
        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.error + "22", borderColor: colors.error }]}>
            <Feather name="alert-circle" size={18} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        ) : null}

        <View>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Guide Gmail Address (@gmail.com only) *</Text>
            <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Feather name="mail" size={18} color={colors.textMuted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="guide_name@gmail.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Basic Personal Information */}
            <View style={styles.sectionDivider}>
              <Text style={[styles.sectionTitle, { color: colors.secondary }]}>1. Personal Information</Text>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Full Name *</Text>
              <TextInput
                style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                placeholder="Enter your full name"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Nickname / Display Name *</Text>
              <TextInput
                style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                placeholder="Enter your display name / nickname"
                placeholderTextColor={colors.textMuted}
                value={nickname}
                onChangeText={setNickname}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Unique Username *</Text>
              <TextInput
                style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                placeholder="Choose a unique username"
                placeholderTextColor={colors.textMuted}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Password *</Text>
                <TextInput
                  style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Phone Number *</Text>
                <TextInput
                  style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                  placeholder="+91 9876543210"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Age *</Text>
                <TextInput
                  style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                  value={age}
                  onChangeText={setAge}
                  keyboardType="number-pad"
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>City *</Text>
                <TextInput
                  style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                  value={city}
                  onChangeText={setCity}
                />
              </View>
            </View>

            {/* Professional Guiding Credentials */}
            <View style={styles.sectionDivider}>
              <Text style={[styles.sectionTitle, { color: colors.secondary }]}>2. Guiding Credentials & Experience</Text>
            </View>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Guide License ID *</Text>
                <TextInput
                  style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                  value={guideIdNum}
                  onChangeText={setGuideIdNum}
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Tourism Dept ID *</Text>
                <TextInput
                  style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                  value={tourismId}
                  onChangeText={setTourismId}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Years Experience</Text>
                <TextInput
                  style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                  value={experienceYears}
                  onChangeText={setExperienceYears}
                  keyboardType="number-pad"
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Price / Day (₹)</Text>
                <TextInput
                  style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                  value={pricePerDay}
                  onChangeText={setPricePerDay}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Bio & Specializations</Text>
              <TextInput
                style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text, height: 60 }]}
                value={bio}
                onChangeText={setBio}
                multiline
              />
            </View>

            {/* Government Verification Proofs */}
            <View style={styles.sectionDivider}>
              <Text style={[styles.sectionTitle, { color: colors.secondary }]}>3. Identity Verification Proofs</Text>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Government ID / Aadhaar *</Text>
              <TextInput
                style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                value={governmentId}
                onChangeText={setGovernmentId}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Guide Certificate Proof ID</Text>
              <TextInput
                style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                value={guideGovtId}
                onChangeText={setGuideGovtId}
              />
            </View>

            <View style={[styles.noticeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Feather name="shield" size={16} color={colors.secondary} />
              <Text style={{ color: colors.textMuted, fontSize: 12, flex: 1 }}>
                Guide applications undergo strict safety governance verification by Platform Admins. Your account will be created with `verification_status = pending`.
              </Text>
            </View>

            <GradientButton title="Submit Guide Registration" onPress={handleCompleteGuideSignup} loading={loading} style={{ marginTop: 14 }} />
          </View>

        <View style={styles.footerRow}>
          <Text style={{ color: colors.textMuted }}>Already registered as a Guide? </Text>
          <TouchableOpacity onPress={() => router.push("/guide/login")}>
            <Text style={{ color: colors.secondary, fontWeight: "700" }}>Guide Login</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingTop: 50, paddingBottom: 50 },
  header: { alignItems: "center", marginBottom: 20 },
  badge: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  title: { fontSize: 24, fontWeight: "900" },
  subtitle: { fontSize: 13, marginTop: 4 },
  card: { padding: spacing.lg },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: radii.md, borderWidth: 1, marginBottom: 16 },
  errorText: { fontSize: 13, fontWeight: "600", flex: 1 },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "700", marginBottom: 6 },
  inputContainer: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: radii.md, paddingHorizontal: 14, height: 48, gap: 10 },
  singleInput: { borderWidth: 1, borderRadius: radii.md, paddingHorizontal: 14, height: 46, fontSize: 14 },
  input: { flex: 1, fontSize: 15 },
  row: { flexDirection: "row", gap: 10 },
  verifiedHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16, padding: 10, borderRadius: radii.sm, backgroundColor: "rgba(52, 211, 153, 0.15)" },
  otpNotice: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: radii.md, borderWidth: 1, marginBottom: 14 },
  sectionDivider: { borderTopWidth: 1, borderColor: "rgba(255, 255, 255, 0.1)", paddingTop: 14, marginTop: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: "800" },
  noticeCard: { flexDirection: "row", gap: 10, padding: 12, borderRadius: radii.md, borderWidth: 1, marginVertical: 10 },
  footerRow: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
});
