import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/auth";
import { useTheme, radii, spacing } from "../../src/theme";
import { GradientButton, GlassCard, GhostButton } from "../../src/ui";
import { INDIAN_STATES, getCitiesForState } from "../../src/locations";
import { Feather } from "@expo/vector-icons";

export default function UserSignupScreen() {
  const router = useRouter();
  const { sendOtp, verifyOtp, userSignup } = useAuth();
  const { colors } = useTheme();

  // Step 1: OTP Email Verification, Step 2: Details
  const [step, setStep] = useState<"otp" | "details">("otp");
  const [email, setEmail] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  // User details
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("Female");
  const [dob, setDob] = useState("");
  const [age, setAge] = useState("24");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [unameMsg, setUnameMsg] = useState("");

  // Emergency contact
  const [emName, setEmName] = useState("");
  const [emPhone, setEmPhone] = useState("");
  const [emRelation, setEmRelation] = useState("Mother");

  // Identification docs
  const [governmentId, setGovernmentId] = useState("AADHAAR-8902-1234");
  const [selfie, setSelfie] = useState("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80");
  const [avatarUrl, setAvatarUrl] = useState("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      // Ignore network errors
    }
  };

  const handleSendOtp = async () => {
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const code = await sendOtp(email);
      setGeneratedOtp(code);
      setOtpSent(true);
    } catch (e: any) {
      setError(e.message || "Failed to send OTP code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpInput) {
      setError("Please enter the 6-digit OTP code.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await verifyOtp(email, otpInput);
      setEmailVerified(true);
      setStep("details");
    } catch (e: any) {
      setError(e.message || "Invalid OTP code");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSignup = async () => {
    if (!name || !username || !password || !phone || !dob || !age || !state || !city || !emName || !emPhone) {
      setError("Please fill in all required registration fields.");
      return;
    }

    const numAge = parseInt(age, 10);
    if (isNaN(numAge) || numAge < 18) {
      setError("Registration rejected: You must be at least 18 years old to join saFeConnect.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await userSignup({
        name,
        username: username.trim(),
        email,
        password,
        phone,
        gender,
        dob,
        age: numAge,
        state,
        district: district || city,
        city,
        emergency_contact: { name: emName, phone: emPhone, relation: emRelation },
        avatar_url: avatarUrl,
        government_id: governmentId,
        selfie: selfie,
        bio: "Solo traveller on saFeConnect India",
        interests: ["Heritage", "Solo Travel", "Safety"],
        languages: ["English", "Hindi"],
      });
      router.replace("/(tabs)/home");
    } catch (e: any) {
      setError(e.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const cityOptions = getCitiesForState(state);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>User Registration</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Step {step === "otp" ? "1: Email Verification" : "2: Personal & Identity Details"}
        </Text>
      </View>

      <GlassCard style={styles.card}>
        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.error + "22", borderColor: colors.error }]}>
            <Feather name="alert-circle" size={18} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        ) : null}

        {step === "otp" ? (
          <View>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
              <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Feather name="mail" size={18} color={colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="name@domain.com"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!otpSent}
                />
              </View>
            </View>

            {!otpSent ? (
              <GradientButton title="Send Verification OTP" onPress={handleSendOtp} loading={loading} />
            ) : (
              <View style={{ marginTop: 10 }}>
                {generatedOtp ? (
                  <View style={[styles.otpNotice, { backgroundColor: colors.primary + "22", borderColor: colors.primary }]}>
                    <Feather name="info" size={16} color={colors.primary} />
                    <Text style={{ color: colors.text, fontWeight: "600", fontSize: 13 }}>
                      Demo Code: <Text style={{ fontWeight: "900", color: colors.primary }}>{generatedOtp}</Text>
                    </Text>
                  </View>
                ) : null}

                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.text }]}>Enter 6-Digit OTP</Text>
                  <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                    <Feather name="key" size={18} color={colors.textMuted} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="123456"
                      placeholderTextColor={colors.textMuted}
                      value={otpInput}
                      onChangeText={setOtpInput}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>
                </View>

                <GradientButton title="Verify OTP & Continue" onPress={handleVerifyOtp} loading={loading} />
                <TouchableOpacity onPress={() => setOtpSent(false)} style={{ marginTop: 12, alignItems: "center" }}>
                  <Text style={{ color: colors.textMuted, fontSize: 13 }}>Change email address</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View>
            {/* Step 2: Full User Registration Form */}
            <View style={styles.verifiedHeader}>
              <Feather name="check-circle" size={16} color={colors.success} />
              <Text style={{ color: colors.success, fontWeight: "700", fontSize: 13 }}>
                Email Verified: {email}
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Full Name *</Text>
              <TextInput
                style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                placeholder="Priya Ananth"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Unique Username *</Text>
              <TextInput
                style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                placeholder="Choose a unique username"
                placeholderTextColor={colors.textMuted}
                value={username}
                onChangeText={(val) => {
                  setUsername(val);
                  setUnameMsg("");
                }}
                onBlur={() => checkUsernameAvailable(username)}
                autoCapitalize="none"
              />
              {unameMsg ? (
                <Text style={{ fontSize: 12, marginTop: 4, color: unameMsg.includes("✓") ? "#34D399" : colors.error, fontWeight: "700" }}>
                  {unameMsg}
                </Text>
              ) : null}
            </View>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Password *</Text>
                <TextInput
                  style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
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
                  placeholderTextColor={colors.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Age (Must be 18+) *</Text>
                <TextInput
                  style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                  placeholder="24"
                  placeholderTextColor={colors.textMuted}
                  value={age}
                  onChangeText={setAge}
                  keyboardType="number-pad"
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Sex / Gender</Text>
                <TextInput
                  style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                  value={gender}
                  onChangeText={setGender}
                />
              </View>
            </View>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Date of Birth (DD/MM/YYYY) *</Text>
              <TextInput
                style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                placeholder="15/08/1998"
                placeholderTextColor={colors.textMuted}
                value={dob}
                onChangeText={setDob}
              />
            </View>

            {/* State & City Inputs */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>State Name *</Text>
              <TextInput
                style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                placeholder="Enter State Name (e.g. Tamil Nadu, Maharashtra)"
                placeholderTextColor={colors.textMuted}
                value={state}
                onChangeText={setState}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>City *</Text>
                <TextInput
                  style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Chennai"
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>District</Text>
                <TextInput
                  style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                  value={district}
                  onChangeText={setDistrict}
                  placeholder="Chennai"
                />
              </View>
            </View>

            {/* Emergency Contact */}
            <View style={styles.sectionDivider}>
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>Emergency Contact Details</Text>
            </View>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Contact Name *</Text>
                <TextInput
                  style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                  placeholder="Mother / Guardian Name"
                  placeholderTextColor={colors.textMuted}
                  value={emName}
                  onChangeText={setEmName}
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Phone Number *</Text>
                <TextInput
                  style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                  placeholder="+91 9876543211"
                  placeholderTextColor={colors.textMuted}
                  value={emPhone}
                  onChangeText={setEmPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Identification Documents */}
            <View style={styles.sectionDivider}>
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>Identity Proof Documents</Text>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Aadhaar Card / Passport Number *</Text>
              <TextInput
                style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                placeholder="AADHAAR / Passport ID"
                placeholderTextColor={colors.textMuted}
                value={governmentId}
                onChangeText={setGovernmentId}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Selfie / Profile Photo URL</Text>
              <TextInput
                style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                value={selfie}
                onChangeText={(val) => {
                  setSelfie(val);
                  setAvatarUrl(val);
                }}
              />
            </View>

            <View style={[styles.noticeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Feather name="shield" size={16} color={colors.secondary} />
              <Text style={{ color: colors.textMuted, fontSize: 12, flex: 1 }}>
                Upon registration, your account will be submitted for Admin Review (`verification_status = pending`). You can immediately use the platform, and the Verified Badge will display automatically after approval.
              </Text>
            </View>

            <GradientButton title="Submit User Registration" onPress={handleCompleteSignup} loading={loading} style={{ marginTop: 14 }} />
          </View>
        )}

        <View style={styles.footerRow}>
          <Text style={{ color: colors.textMuted }}>Already registered? </Text>
          <TouchableOpacity onPress={() => router.push("/user/login")}>
            <Text style={{ color: colors.primary, fontWeight: "700" }}>Login here</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingTop: 50,
    paddingBottom: 50,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  card: {
    padding: spacing.lg,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  singleInput: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 14,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  verifiedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
    padding: 10,
    borderRadius: radii.sm,
    backgroundColor: "rgba(52, 211, 153, 0.15)",
  },
  otpNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
    marginRight: 8,
  },
  sectionDivider: {
    borderTopWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    paddingTop: 14,
    marginTop: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  noticeCard: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    marginVertical: 10,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
});
