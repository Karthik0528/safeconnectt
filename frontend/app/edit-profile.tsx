import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../src/auth";
import { useTheme } from "../src/theme";
import { Chip, GradientButton } from "../src/ui";

const INTERESTS = ["Food", "Hiking", "Beach", "Culture", "Nightlife", "Photography", "Art", "Wellness", "Coffee", "Books"];
const LANGUAGES = ["English", "Spanish", "French", "Japanese", "Hindi", "German", "Italian", "Portuguese", "Mandarin", "Arabic"];

export default function EditProfile() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const { colors } = useTheme();
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [interests, setInterests] = useState<string[]>(user?.interests || []);
  const [languages, setLanguages] = useState<string[]>(user?.languages || []);
  const [busy, setBusy] = useState(false);

  const toggle = (arr: string[], set: any, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const save = async () => {
    setBusy(true);
    try {
      await updateProfile({ name, bio, phone, interests, languages });
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} testID="edit-back">
            <Feather name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text }}>Edit profile</Text>
          <View style={{ width: 22 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <Field label="Name" colors={colors}>
            <TextInput testID="edit-name" value={name} onChangeText={setName} style={[styles.input, { color: colors.text, borderColor: colors.border }]} />
          </Field>
          <Field label="Phone" colors={colors}>
            <TextInput testID="edit-phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={[styles.input, { color: colors.text, borderColor: colors.border }]} />
          </Field>
          <Field label="Bio" colors={colors}>
            <TextInput
              testID="edit-bio"
              value={bio}
              onChangeText={setBio}
              multiline
              placeholder="Tell other travellers about yourself…"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.text, borderColor: colors.border, height: 100, textAlignVertical: "top" }]}
            />
          </Field>

          <Text style={[styles.label, { color: colors.textMuted }]}>Interests</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {INTERESTS.map((i) => (
              <Chip key={i} label={i} active={interests.includes(i)} onPress={() => toggle(interests, setInterests, i)} testID={`edit-interest-${i}`} />
            ))}
          </View>

          <Text style={[styles.label, { color: colors.textMuted, marginTop: 16 }]}>Languages</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {LANGUAGES.map((l) => (
              <Chip key={l} label={l} active={languages.includes(l)} onPress={() => toggle(languages, setLanguages, l)} testID={`edit-lang-${l}`} />
            ))}
          </View>

          <GradientButton title="Save" icon="check" onPress={save} loading={busy} testID="edit-save" style={{ marginTop: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children, colors }: any) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  input: { borderWidth: 1, borderRadius: 14, padding: 12, fontSize: 16 },
  label: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
});
