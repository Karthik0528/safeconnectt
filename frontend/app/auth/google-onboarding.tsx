import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../src/auth";
import { useTheme, radii, spacing } from "../../src/theme";
import { GradientButton, GlassCard } from "../../src/ui";
import { api } from "../../src/api";
import { Feather } from "@expo/vector-icons";

export default function GoogleOnboardingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; name?: string; avatar_url?: string; role?: string }>();
  const { completeGoogleOnboarding } = useAuth();
  const { colors } = useTheme();

  // Empty username by default — let user type manually
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("24");
  const [gender, setGender] = useState("Female");
  const [dob, setDob] = useState("15/08/1998");
  const [country] = useState("India");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [governmentId, setGovernmentId] = useState("");
  const [idType, setIdType] = useState<"Aadhaar" | "Passport" | "Voter ID">("Aadhaar");

  // Checkboxes
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [safetyPolicyAccepted, setSafetyPolicyAccepted] = useState(false);

  // Policy Modal
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unameMsg, setUnameMsg] = useState("");

  const checkUsernameAvailable = async (uname: string) => {
    if (!uname || uname.length < 3) return;
    try {
      const res = await api<{ available: boolean; message: string }>(`/auth/check-username?username=${encodeURIComponent(uname)}`);
      if (!res.available) {
        setUnameMsg(res.message);
      } else {
        setUnameMsg("✓ Username available");
      }
    } catch {
      // Ignore network errors on check
    }
  };

  const handleSubmit = async () => {
    if (!username || !password || !phone || !age || !gender || !dob || !state || !district || !city || !governmentId) {
      setError("Please complete all required profile details.");
      return;
    }

    const numAge = parseInt(age, 10);
    if (isNaN(numAge) || numAge < 18) {
      setError("Registration rejected: You must be at least 18 years old to join saFeConnect.");
      return;
    }

    if (!termsAccepted || !safetyPolicyAccepted) {
      setError("You must review and accept both Women's Safety & Terms Checkboxes below.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await completeGoogleOnboarding({
        email: params.email || "user@gmail.com",
        name: params.name || username,
        username: username.trim(),
        password: password,
        phone: phone.trim(),
        age: numAge,
        gender: gender,
        dob: dob,
        country: country,
        state: state.trim(),
        district: district.trim(),
        city: city.trim(),
        government_id: `${idType.toUpperCase()}-${governmentId.trim()}`,
        selfie: params.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        role: params.role || "user",
        terms_accepted: termsAccepted,
        safety_policy_accepted: safetyPolicyAccepted,
      });
      router.replace("/(tabs)/home");
    } catch (e: any) {
      setError(e.message || "Failed to complete onboarding profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: "#EA4335" }]}>
          <Feather name="user-check" size={28} color="#fff" />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Complete Your Traveller Profile</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Authenticated via Google ({params.email || "Google Account"}). Type your account & location details.
        </Text>
      </View>

      <GlassCard style={styles.card}>
        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.error + "22", borderColor: colors.error }]}>
            <Feather name="alert-circle" size={18} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        ) : null}

        {/* 1. Account Credentials */}
        <Text style={[styles.sectionHeading, { color: colors.primary }]}>1. Account Security & Username</Text>
        
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Choose Unique Username *</Text>
          <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Feather name="user" size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Type your desired username"
              placeholderTextColor={colors.textMuted}
              value={username}
              onChangeText={(val) => {
                setUsername(val);
                setUnameMsg("");
              }}
              onBlur={() => checkUsernameAvailable(username)}
              autoCapitalize="none"
            />
          </View>
          {unameMsg ? (
            <Text style={{ fontSize: 12, marginTop: 4, color: unameMsg.includes("✓") ? "#34D399" : colors.error, fontWeight: "700" }}>
              {unameMsg}
            </Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Create Account Password *</Text>
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

        {/* Demographics: Age, Sex, DOB */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Age (Must be 18+) *</Text>
            <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Feather name="calendar" size={16} color={colors.textMuted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="24"
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
          <Text style={[styles.label, { color: colors.text }]}>Date of Birth (DD/MM/YYYY) *</Text>
          <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Feather name="clock" size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="15/08/1998"
              placeholderTextColor={colors.textMuted}
              value={dob}
              onChangeText={setDob}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Mobile Phone Number (+91) *</Text>
          <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Feather name="phone" size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="+91-9876543210"
              placeholderTextColor={colors.textMuted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* 2. Manual Location Details */}
        <Text style={[styles.sectionHeading, { color: colors.primary, marginTop: 14 }]}>2. Location Details</Text>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Country</Text>
          <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface, opacity: 0.8 }]}>
            <Feather name="globe" size={18} color={colors.textMuted} />
            <TextInput style={[styles.input, { color: colors.text }]} value="India (Bharatiya)" editable={false} />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>State Name *</Text>
          <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Feather name="map" size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Type State Name (e.g. Maharashtra, Tamil Nadu)"
              placeholderTextColor={colors.textMuted}
              value={state}
              onChangeText={setState}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>District Name *</Text>
          <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Feather name="navigation" size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Type District Name (e.g. Mumbai Suburban, Chennai)"
              placeholderTextColor={colors.textMuted}
              value={district}
              onChangeText={setDistrict}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Area Living / City Name *</Text>
          <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Feather name="map-pin" size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="e.g. Bandra West / Koramangala / Connaught Place"
              placeholderTextColor={colors.textMuted}
              value={city}
              onChangeText={setCity}
            />
          </View>
        </View>

        {/* 3. Government Identity Verification */}
        <Text style={[styles.sectionHeading, { color: colors.primary, marginTop: 14 }]}>
          3. Government Identity Verification (Woman Traveller)
        </Text>

        <View style={styles.womanNotice}>
          <Feather name="shield" size={16} color="#EC4899" />
          <Text style={{ color: "#FFF0F4", fontSize: 12, flex: 1, lineHeight: 17 }}>
            <Text style={{ fontWeight: "800", color: "#F472B6" }}>Woman Identity Safeguard</Text>: saFeConnect is an exclusive platform for female travellers. Government ID proof must verify female gender identity.
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
          {(["Aadhaar", "Passport", "Voter ID"] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.chip,
                {
                  flex: 1,
                  alignItems: "center",
                  backgroundColor: idType === t ? colors.primary : colors.chipBg,
                  borderColor: idType === t ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setIdType(t)}
            >
              <Text style={{ color: idType === t ? "#fff" : colors.text, fontWeight: "700", fontSize: 12 }}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>{idType} Document Number *</Text>
          <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Feather name="file-text" size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={`Enter ${idType} Number`}
              placeholderTextColor={colors.textMuted}
              value={governmentId}
              onChangeText={setGovernmentId}
              autoCapitalize="characters"
            />
          </View>
        </View>

        {/* 4. MANDATORY POLICY CHECKBOXES */}
        <View style={[styles.policySection, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={{ color: colors.text, fontWeight: "800", fontSize: 15, marginBottom: 10 }}>
            Women&apos;s Safety Policies & Platform Terms
          </Text>

          {/* Checkbox 1 */}
          <TouchableOpacity style={styles.checkboxRow} onPress={() => setTermsAccepted(!termsAccepted)}>
            <View style={[styles.checkbox, { borderColor: termsAccepted ? colors.primary : colors.border, backgroundColor: termsAccepted ? colors.primary : "transparent" }]}>
              {termsAccepted && <Feather name="check" size={14} color="#fff" />}
            </View>
            <Text style={{ color: colors.text, fontSize: 13, flex: 1, lineHeight: 18 }}>
              I agree to saFeConnect <Text style={{ color: colors.primary, fontWeight: "800" }}>Terms of Service</Text>, <Text style={{ color: colors.primary, fontWeight: "800" }}>Privacy Policy</Text>, and Community Guidelines.
            </Text>
          </TouchableOpacity>

          {/* Checkbox 2 */}
          <TouchableOpacity style={styles.checkboxRow} onPress={() => setSafetyPolicyAccepted(!safetyPolicyAccepted)}>
            <View style={[styles.checkbox, { borderColor: safetyPolicyAccepted ? colors.primary : colors.border, backgroundColor: safetyPolicyAccepted ? colors.primary : "transparent" }]}>
              {safetyPolicyAccepted && <Feather name="check" size={14} color="#fff" />}
            </View>
            <Text style={{ color: colors.text, fontSize: 13, flex: 1, lineHeight: 18 }}>
              I confirm that I am a <Text style={{ color: "#EC4899", fontWeight: "800" }}>woman traveller</Text> and understand that fake identities, harassment, or rule violations result in <Text style={{ color: colors.error, fontWeight: "800" }}>instant account ban & legal prosecution</Text>.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ marginTop: 10, alignItems: "center" }} onPress={() => setShowPolicyModal(true)}>
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700", textDecorationLine: "underline" }}>
              Read Full Women&apos;s Safety Policy & Legal Code
            </Text>
          </TouchableOpacity>
        </View>

        <GradientButton
          title="Complete Profile & Get Verified"
          onPress={handleSubmit}
          loading={loading}
          style={{ marginTop: 16 }}
        />
      </GlassCard>

      {/* Policy Modal */}
      <Modal visible={showPolicyModal} transparent animationType="slide" onRequestClose={() => setShowPolicyModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Feather name="shield" size={22} color="#EC4899" />
              <Text style={[styles.modalTitle, { color: colors.text }]}>saFeConnect Women&apos;s Safety Policy</Text>
              <TouchableOpacity onPress={() => setShowPolicyModal(false)}>
                <Feather name="x" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380, marginVertical: 14 }}>
              <Text style={[styles.policyParagraph, { color: colors.text }]}>
                <Text style={{ fontWeight: "800" }}>1. Zero-Tolerance Harassment Code:</Text> saFeConnect enforces a strict zero-tolerance policy against physical, verbal, or digital harassment. Violators are immediately banned and reported to law enforcement agencies across India.
              </Text>
              <Text style={[styles.policyParagraph, { color: colors.text }]}>
                <Text style={{ fontWeight: "800" }}>2. Mandatory Identity Authentication:</Text> All member profiles and local guides undergo multi-level government document review by platform security administrators before receiving the Verified Shield badge.
              </Text>
              <Text style={[styles.policyParagraph, { color: colors.text }]}>
                <Text style={{ fontWeight: "800" }}>3. Real-Time Emergency SOS Protocol:</Text> Triggering the SOS alert broadcasts your live GPS coordinates directly to designated emergency contacts, nearby verified female travellers, and local safety helplines.
              </Text>
              <Text style={[styles.policyParagraph, { color: colors.text }]}>
                <Text style={{ fontWeight: "800" }}>4. Data Confidentiality:</Text> Your uploaded government identity documents are encrypted with AES-256 and stored strictly for administrative verification purposes.
              </Text>
            </ScrollView>

            <GradientButton title="I Understand & Agree" onPress={() => setShowPolicyModal(false)} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingTop: 50, paddingBottom: 50 },
  header: { alignItems: "center", marginBottom: 20 },
  badge: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  title: { fontSize: 22, fontWeight: "900", textAlign: "center" },
  subtitle: { fontSize: 13, textAlign: "center", marginTop: 4, maxWidth: 340 },
  card: { padding: spacing.lg },
  sectionHeading: { fontSize: 15, fontWeight: "800", marginBottom: 12 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: radii.md, borderWidth: 1, marginBottom: 16 },
  errorText: { fontSize: 13, fontWeight: "600", flex: 1 },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "700", marginBottom: 6 },
  inputContainer: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: radii.md, paddingHorizontal: 12, height: 46, gap: 10 },
  input: { flex: 1, fontSize: 14 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  womanNotice: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(236, 72, 153, 0.15)", borderWidth: 1, borderColor: "rgba(236, 72, 153, 0.3)", padding: 12, borderRadius: radii.md, marginBottom: 12 },
  policySection: { marginTop: 16, padding: 14, borderRadius: radii.md, borderWidth: 1 },
  checkboxRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginVertical: 8 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center", marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: { width: "100%", maxWidth: 440, borderRadius: 20, borderWidth: 1, padding: 20 },
  modalHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  modalTitle: { fontSize: 16, fontWeight: "800", flex: 1 },
  policyParagraph: { fontSize: 13, lineHeight: 19, marginBottom: 12 },
});
