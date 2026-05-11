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
  Image,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../src/auth";
import { GradientButton } from "../../src/ui";

const AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
];

export default function Signup() {
  const router = useRouter();
  const { signup } = useAuth();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [idImage, setIdImage] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pickImage = async (setter: (b64: string) => void) => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.6,
    });
    if (!res.canceled && res.assets[0]?.base64) {
      setter(`data:image/jpeg;base64,${res.assets[0].base64}`);
    }
  };

  const submit = async () => {
    setBusy(true);
    setErr(null);
    try {
      await signup({
        name,
        email: email.trim().toLowerCase(),
        password,
        age: Number(age),
        phone,
        bio: "",
        interests: [],
        languages: ["English"],
        avatar_url: avatar,
        id_image_b64: idImage,
        selfie_b64: selfie,
      });
      router.replace("/(tabs)/home");
    } catch (e: any) {
      setErr(e.message || "Signup failed");
    } finally {
      setBusy(false);
    }
  };

  const canStep1 = name && email && password && age && phone && Number(age) >= 18;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          <LinearGradient colors={["#FCE7F3", "#EDE9FE"]} style={styles.hero}>
            <TouchableOpacity onPress={() => router.back()} style={styles.back}>
              <Feather name="arrow-left" size={20} color="#1F1A24" />
            </TouchableOpacity>
            <Text style={styles.brand}>Join sa<Text style={{ color: "#EC4899" }}>Fe</Text>Connect</Text>
            <Text style={styles.tag}>Verified women only · Step {step} of 2</Text>
          </LinearGradient>

          <View style={styles.form}>
            {step === 1 ? (
              <>
                <Text style={styles.title}>Your details</Text>

                <Field label="Full name" icon="user">
                  <TextInput
                    testID="signup-name"
                    placeholder="Jane Doe"
                    placeholderTextColor="#9CA3AF"
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                  />
                </Field>

                <View style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Field label="Age" icon="calendar">
                      <TextInput
                        testID="signup-age"
                        placeholder="18+"
                        placeholderTextColor="#9CA3AF"
                        style={styles.input}
                        value={age}
                        onChangeText={setAge}
                        keyboardType="numeric"
                      />
                    </Field>
                  </View>
                  <View style={{ flex: 2 }}>
                    <Field label="Phone" icon="phone">
                      <TextInput
                        testID="signup-phone"
                        placeholder="+1 555 0100"
                        placeholderTextColor="#9CA3AF"
                        style={styles.input}
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                      />
                    </Field>
                  </View>
                </View>

                <Field label="Email" icon="mail">
                  <TextInput
                    testID="signup-email"
                    placeholder="you@example.com"
                    placeholderTextColor="#9CA3AF"
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </Field>

                <Field label="Password" icon="lock">
                  <TextInput
                    testID="signup-password"
                    placeholder="Min 6 characters"
                    placeholderTextColor="#9CA3AF"
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </Field>

                {err && <Text style={styles.err}>{err}</Text>}

                <GradientButton
                  title="Next"
                  icon="arrow-right"
                  testID="signup-next"
                  onPress={() => canStep1 && setStep(2)}
                  disabled={!canStep1}
                  style={{ marginTop: 20 }}
                />
              </>
            ) : (
              <>
                <Text style={styles.title}>Verify it&apos;s really you</Text>
                <Text style={styles.sub}>
                  Upload a government ID + selfie. We use this to keep SafeConnect women-only and safe.
                </Text>

                <Text style={styles.label}>Pick your avatar</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {AVATARS.map((a) => (
                    <TouchableOpacity
                      key={a}
                      onPress={() => setAvatar(a)}
                      testID={`avatar-pick-${a.slice(-10)}`}
                      style={{
                        marginRight: 8,
                        borderRadius: 999,
                        padding: 3,
                        borderWidth: 2,
                        borderColor: avatar === a ? "#8B5CF6" : "transparent",
                      }}
                    >
                      <Image source={{ uri: a }} style={{ width: 56, height: 56, borderRadius: 999 }} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <UploadCard
                  label="Government ID"
                  hint="Driver's license, passport, etc."
                  image={idImage}
                  onPick={() => pickImage(setIdImage)}
                  testID="upload-id"
                />
                <UploadCard
                  label="Selfie"
                  hint="A clear, well-lit photo of your face."
                  image={selfie}
                  onPick={() => pickImage(setSelfie)}
                  testID="upload-selfie"
                />

                <Text style={styles.note}>
                  💡 Your documents are encrypted at rest. Verification badges appear after our team
                  reviews — usually under 24h.
                </Text>

                {err && <Text style={styles.err}>{err}</Text>}

                <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
                  <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn} testID="signup-back">
                    <Feather name="arrow-left" size={18} color="#1F1A24" />
                    <Text style={{ fontWeight: "600", color: "#1F1A24" }}>Back</Text>
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <GradientButton
                      title="Create account"
                      icon="check"
                      testID="signup-submit"
                      onPress={submit}
                      loading={busy}
                    />
                  </View>
                </View>
              </>
            )}

            <View style={styles.signupRow}>
              <Text style={{ color: "#6B7280" }}>Already have an account? </Text>
              <Link href="/auth/login" testID="go-login">
                <Text style={styles.signupLink}>Sign in</Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function UploadCard({
  label,
  hint,
  image,
  onPick,
  testID,
}: {
  label: string;
  hint: string;
  image: string | null;
  onPick: () => void;
  testID: string;
}) {
  return (
    <TouchableOpacity testID={testID} onPress={onPick} activeOpacity={0.8} style={styles.upload}>
      {image ? (
        <Image source={{ uri: image }} style={{ width: 56, height: 56, borderRadius: 12 }} />
      ) : (
        <View style={styles.uploadIcon}>
          <Feather name="upload-cloud" size={22} color="#8B5CF6" />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: "700", color: "#1F1A24" }}>{label}</Text>
        <Text style={{ color: "#6B7280", fontSize: 13, marginTop: 2 }}>{image ? "Tap to replace" : hint}</Text>
      </View>
      <Feather name={image ? "check-circle" : "chevron-right"} size={20} color={image ? "#10B981" : "#9CA3AF"} />
    </TouchableOpacity>
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
    <View style={{ marginTop: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.field}>
        <Feather name={icon} size={18} color="#8B5CF6" />
        <View style={{ flex: 1 }}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingTop: 32, paddingBottom: 32, paddingHorizontal: 24, borderBottomLeftRadius: 36, borderBottomRightRadius: 36 },
  back: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.8)", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  brand: { fontSize: 26, fontWeight: "800", color: "#1F1A24", letterSpacing: -0.5 },
  tag: { color: "#6B7280", marginTop: 4 },
  form: { padding: 24 },
  title: { fontSize: 22, fontWeight: "800", color: "#1F1A24" },
  sub: { color: "#6B7280", marginTop: 4, marginBottom: 8 },
  label: { fontSize: 12, color: "#6B7280", marginBottom: 6, marginTop: 4, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  field: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#F3F4F6" },
  input: { fontSize: 16, color: "#1F1A24" },
  err: { color: "#EF4444", marginTop: 12, fontSize: 13 },
  note: { color: "#6B7280", fontSize: 12, marginTop: 12, lineHeight: 18 },
  upload: { marginTop: 12, flexDirection: "row", alignItems: "center", gap: 14, padding: 14, backgroundColor: "#F9FAFB", borderRadius: 16, borderWidth: 1, borderColor: "#F3F4F6" },
  uploadIcon: { width: 56, height: 56, borderRadius: 12, backgroundColor: "#F3F0FF", alignItems: "center", justifyContent: "center" },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 18, paddingVertical: 16, borderRadius: 999, backgroundColor: "#F3F4F6" },
  signupRow: { flexDirection: "row", justifyContent: "center", marginTop: 28 },
  signupLink: { color: "#8B5CF6", fontWeight: "700" },
});
