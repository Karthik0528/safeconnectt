import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/auth";
import { useTheme, radii, spacing } from "../../src/theme";
import { GradientButton, GlassCard } from "../../src/ui";
import { INDIAN_STATES, getCitiesForState } from "../../src/locations";
import { Feather } from "@expo/vector-icons";

export default function GuideSignupScreen() {
  const router = useRouter();
  const { sendOtp, verifyOtp, guideSignup } = useAuth();
  const { colors } = useTheme();

  // Step 1: OTP Email Verification, Step 2: Full Guide Details
  const [step, setStep] = useState<"otp" | "details">("otp");
  const [email, setEmail] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // User fields
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("Female");
  const [dob, setDob] = useState("");
  const [age, setAge] = useState("28");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");

  // Emergency contact
  const [emName, setEmName] = useState("");
  const [emPhone, setEmPhone] = useState("");
  const [emRelation, setEmRelation] = useState("Family");

  // User Identity
  const [governmentId, setGovernmentId] = useState("AADHAAR-9012-7890");
  const [selfie, setSelfie] = useState("https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80");
  const [avatarUrl, setAvatarUrl] = useState("https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80");

  // Guide specific fields
  const [guideIdNum, setGuideIdNum] = useState("IND-GUIDE-8821");
  const [tourismId, setTourismId] = useState("RAJ-TOURISM-442");
  const [guideGovtId, setGuideGovtId] = useState("RAJ-GOVT-ID-PROOF");
  const [addressProof, setAddressProof] = useState("ELECTRICITY-BILL-PROOF");
  const [experienceYears, setExperienceYears] = useState("5");
  const [languages, setLanguages] = useState("English, Hindi, Rajasthani");
  const [certifications, setCertifications] = useState("Government Licensed Guide, Women Safety Certified");
  const [bio, setBio] = useState("Professional female local guide specializing in heritage palace walks and safe culinary tours.");
  const [services, setServices] = useState("Heritage Palace Walks, Night Market Escort, Food & Textile Tours");
  const [availability, setAvailability] = useState("Available");
  const [pricePerDay, setPricePerDay] = useState("1800");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      setStep("details");
    } catch (e: any) {
      setError(e.message || "Invalid OTP code");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteGuideSignup = async () => {
    if (!name || !password || !phone || !dob || !age || !guideIdNum || !pricePerDay) {
      setError("Please fill in all required registration fields.");
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
        emergency_contact: { name: emName || "Contact", phone: emPhone || phone, relation: emRelation },
        avatar_url: avatarUrl,
        government_id: governmentId,
        selfie: selfie,
        guide_id_num: guideIdNum,
        tourism_id: tourismId,
        guide_govt_id: guideGovtId,
        address_proof: addressProof,
        experience_years: parseInt(experienceYears) || 3,
        languages: languages.split(",").map((l) => l.trim()),
        certifications: certifications.split(",").map((c) => c.trim()),
        bio,
        services: services.split(",").map((s) => s.trim()),
        availability,
        price_per_day: parseInt(pricePerDay) || 1800,
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
        <Text style={[styles.title, { color: colors.text }]}>Guide Registration Portal</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Step {step === "otp" ? "1: Email Verification" : "2: Personal & Professional Credentials"}
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
              <Text style={[styles.label, { color: colors.text }]}>Guide Email Address *</Text>
              <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Feather name="mail" size={18} color={colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="guide@safeconnect.in"
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

                <GradientButton title="Verify OTP & Proceed" onPress={handleVerifyOtp} loading={loading} />
              </View>
            )}
          </View>
        ) : (
          <View>
            {/* Step 2: Full Guide Registration */}
            <View style={styles.verifiedHeader}>
              <Feather name="check-circle" size={16} color={colors.success} />
              <Text style={{ color: colors.success, fontWeight: "700", fontSize: 13 }}>
                Verified Email: {email}
              </Text>
            </View>

            {/* Basic Personal Information */}
            <View style={styles.sectionDivider}>
              <Text style={[styles.sectionTitle, { color: colors.secondary }]}>1. Personal Information</Text>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Full Name *</Text>
              <TextInput
                style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                placeholder="Priya Sharma"
                value={name}
                onChangeText={setName}
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
                <Text style={[styles.label, { color: colors.text }]}>State *</Text>
                <TextInput
                  style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                  value={state}
                  onChangeText={setState}
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

            {/* Emergency Contact */}
            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Emergency Contact Name</Text>
                <TextInput
                  style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                  placeholder="Relative Name"
                  value={emName}
                  onChangeText={setEmName}
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Emergency Phone</Text>
                <TextInput
                  style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                  placeholder="+91 9876543211"
                  value={emPhone}
                  onChangeText={setEmPhone}
                />
              </View>
            </View>

            {/* Professional Guide Documents & Credentials */}
            <View style={styles.sectionDivider}>
              <Text style={[styles.sectionTitle, { color: colors.secondary }]}>2. Guide Credentials & Documents</Text>
            </View>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Professional Guide ID *</Text>
                <TextInput
                  style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                  placeholder="IND-GUIDE-8821"
                  value={guideIdNum}
                  onChangeText={setGuideIdNum}
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Tourism Dept ID (Optional)</Text>
                <TextInput
                  style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                  placeholder="TOURISM-DEPT-ID"
                  value={tourismId}
                  onChangeText={setTourismId}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Govt Identity Proof *</Text>
                <TextInput
                  style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                  placeholder="Aadhaar / Passport"
                  value={governmentId}
                  onChangeText={setGovernmentId}
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Address Proof *</Text>
                <TextInput
                  style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                  placeholder="Utility Bill / Ration Card"
                  value={addressProof}
                  onChangeText={setAddressProof}
                />
              </View>
            </View>

            {/* Experience, Services, Pricing */}
            <View style={styles.sectionDivider}>
              <Text style={[styles.sectionTitle, { color: colors.secondary }]}>3. Guiding Experience & Pricing (₹ INR)</Text>
            </View>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Years of Experience</Text>
                <TextInput
                  style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                  placeholder="5"
                  value={experienceYears}
                  onChangeText={setExperienceYears}
                  keyboardType="number-pad"
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Price Per Day (₹ INR) *</Text>
                <TextInput
                  style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                  placeholder="1800"
                  value={pricePerDay}
                  onChangeText={setPricePerDay}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Languages Spoken</Text>
              <TextInput
                style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                placeholder="English, Hindi, Rajasthani"
                value={languages}
                onChangeText={setLanguages}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Certifications</Text>
              <TextInput
                style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                placeholder="Licensed Tour Guide, First Aid Trained"
                value={certifications}
                onChangeText={setCertifications}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Services Offered</Text>
              <TextInput
                style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                placeholder="Heritage Walks, Night Escort, Shopping Tours"
                value={services}
                onChangeText={setServices}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Guide Bio</Text>
              <TextInput
                style={[styles.singleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text, height: 70 }]}
                placeholder="Describe your expertise and travel safety commitment..."
                value={bio}
                onChangeText={setBio}
                multiline
              />
            </View>

            <View style={[styles.noticeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Feather name="shield" size={16} color={colors.secondary} />
              <Text style={{ color: colors.textMuted, fontSize: 12, flex: 1 }}>
                Guide applications are reviewed by Admin (`verification_status = pending`). After Admin approval, your Guide Listing will automatically display the Verified Badge.
              </Text>
            </View>

            <GradientButton title="Submit Guide Application" onPress={handleCompleteGuideSignup} loading={loading} style={{ marginTop: 14 }} />
          </View>
        )}

        <View style={styles.footerRow}>
          <Text style={{ color: colors.textMuted }}>Already registered as a Guide? </Text>
          <TouchableOpacity onPress={() => router.push("/guide/login")}>
            <Text style={{ color: colors.secondary, fontWeight: "700" }}>Login here</Text>
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
