import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../src/theme";
import { api } from "../../src/api";
import { Chip, GradientButton } from "../../src/ui";
import { useAuth } from "../../src/auth";

const LANGS = ["English", "Spanish", "French", "Japanese", "Hindi", "German", "Italian", "Portuguese", "Mandarin", "Arabic", "Turkish", "Korean"];

export default function GuideRegister() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [years, setYears] = useState("");
  const [price, setPrice] = useState("");
  const [bio, setBio] = useState("");
  const [languages, setLanguages] = useState<string[]>(user?.languages || ["English"]);
  const [certs, setCerts] = useState("");
  const [busy, setBusy] = useState(false);
  const [existing, setExisting] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const mine = await api<any>("/guides/mine");
        if (mine && mine.id) {
          setExisting(mine);
          setName(mine.name);
          setCity(mine.city);
          setCountry(mine.country);
          setYears(String(mine.experience_years));
          setPrice(String(mine.price_per_day));
          setBio(mine.bio);
          setLanguages(mine.languages);
          setCerts((mine.certifications || []).join(", "));
        }
      } catch {}
    })();
  }, []);

  const toggleLang = (l: string) =>
    setLanguages((arr) => (arr.includes(l) ? arr.filter((x) => x !== l) : [...arr, l]));

  const submit = async () => {
    if (!name || !city || !country || !bio || !years || !price || languages.length === 0) {
      Alert.alert("Missing info", "Please complete name, city, country, languages, years, price and bio.");
      return;
    }
    setBusy(true);
    try {
      const r = await api<any>("/guides/register", {
        method: "POST",
        body: {
          name,
          city,
          country,
          languages,
          experience_years: Number(years),
          bio,
          price_per_day: Number(price),
          avatar_url: user?.avatar_url,
          certifications: certs.split(",").map((s) => s.trim()).filter(Boolean),
        },
      });
      Alert.alert(
        existing ? "Profile updated" : "You're now a verified guide 🎉",
        `You'll appear when travellers search for guides in ${r.city}, ${r.country}.`,
      );
      router.replace({ pathname: "/guide/[id]", params: { id: r.id } });
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <LinearGradient colors={["#FFE4E6", "#FCE7F3"]} style={styles.hero}>
            <TouchableOpacity onPress={() => router.back()} style={styles.back} testID="guide-reg-back">
              <Feather name="arrow-left" size={20} color={colors.text} />
            </TouchableOpacity>
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Feather name="map-pin" size={20} color="#fff" />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              {existing ? "Edit your guide profile" : "Become a Local Guide"}
            </Text>
            <Text style={{ color: colors.textMuted, marginTop: 4, lineHeight: 20 }}>
              Help solo women travellers explore your city safely. List your languages, experience and price.
              Travellers can find you by location.
            </Text>
          </LinearGradient>

          <View style={{ padding: 20 }}>
            <Field label="Display name" colors={colors}>
              <TextInput testID="gr-name" value={name} onChangeText={setName} style={[styles.input, { color: colors.text, borderColor: colors.border }]} />
            </Field>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Field label="City" colors={colors}>
                  <TextInput testID="gr-city" placeholder="Tokyo" placeholderTextColor={colors.textMuted} value={city} onChangeText={setCity} style={[styles.input, { color: colors.text, borderColor: colors.border }]} />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Country" colors={colors}>
                  <TextInput testID="gr-country" placeholder="Japan" placeholderTextColor={colors.textMuted} value={country} onChangeText={setCountry} style={[styles.input, { color: colors.text, borderColor: colors.border }]} />
                </Field>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Field label="Experience (years)" colors={colors}>
                  <TextInput testID="gr-years" placeholder="3" placeholderTextColor={colors.textMuted} value={years} onChangeText={setYears} keyboardType="numeric" style={[styles.input, { color: colors.text, borderColor: colors.border }]} />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Price / day ($)" colors={colors}>
                  <TextInput testID="gr-price" placeholder="65" placeholderTextColor={colors.textMuted} value={price} onChangeText={setPrice} keyboardType="numeric" style={[styles.input, { color: colors.text, borderColor: colors.border }]} />
                </Field>
              </View>
            </View>

            <Text style={[styles.label, { color: colors.textMuted }]}>Languages you speak</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
              {LANGS.map((l) => (
                <Chip key={l} label={l} active={languages.includes(l)} onPress={() => toggleLang(l)} testID={`gr-lang-${l}`} />
              ))}
            </View>

            <Field label="Bio (what makes your tours special)" colors={colors}>
              <TextInput
                testID="gr-bio"
                placeholder="I run safe nighttime food walks for solo women…"
                placeholderTextColor={colors.textMuted}
                value={bio}
                onChangeText={setBio}
                multiline
                style={[styles.input, { color: colors.text, borderColor: colors.border, height: 100, textAlignVertical: "top" }]}
              />
            </Field>
            <Field label="Certifications (comma-separated)" colors={colors}>
              <TextInput
                testID="gr-certs"
                placeholder="Licensed Tour Guide, First Aid"
                placeholderTextColor={colors.textMuted}
                value={certs}
                onChangeText={setCerts}
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              />
            </Field>

            <GradientButton
              title={existing ? "Update guide profile" : "Publish guide profile"}
              icon="check"
              onPress={submit}
              loading={busy}
              testID="gr-submit"
              style={{ marginTop: 16 }}
            />
            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 12, textAlign: "center" }}>
              By publishing you confirm the info is accurate. Travellers can find you under
              {city || country ? ` "${[city, country].filter(Boolean).join(", ")}"` : " your city"}.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children, colors }: any) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { padding: 20, paddingTop: 16, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  back: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.85)", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  badge: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  title: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  label: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
});
