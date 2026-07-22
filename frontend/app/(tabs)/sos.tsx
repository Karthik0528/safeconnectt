import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Alert,
  Modal,
  TextInput,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useTheme } from "../../src/theme";
import { api } from "../../src/api";

export default function SOS() {
  const { colors } = useTheme();
  const [contacts, setContacts] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [active, setActive] = useState<any | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRel, setNewRel] = useState("Family");
  const [busy, setBusy] = useState(false);
  const [showFakeCall, setShowFakeCall] = useState(false);
  const [fakeCallStatus, setFakeCallStatus] = useState<"ringing" | "connected">("ringing");
  const [callTimer, setCallTimer] = useState(0);

  useEffect(() => {
    let interval: any;
    if (showFakeCall && fakeCallStatus === "connected") {
      interval = setInterval(() => {
        setCallTimer((prev) => prev + 1);
      }, 1000);
    } else {
      setCallTimer(0);
    }
    return () => clearInterval(interval);
  }, [showFakeCall, fakeCallStatus]);

  const triggerFakeCall = () => {
    setFakeCallStatus("ringing");
    setCallTimer(0);
    setShowFakeCall(true);
  };

  const answerFakeCall = () => {
    setFakeCallStatus("connected");
  };

  const endFakeCall = () => {
    setShowFakeCall(false);
    setFakeCallStatus("ringing");
    setCallTimer(0);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 2200, easing: Easing.out(Easing.ease), useNativeDriver: true })
    ).start();
  }, [pulse]);

  const load = async () => {
    const [c, a] = await Promise.all([api<any[]>("/emergency/contacts"), api<any[]>("/sos/alerts")]);
    setContacts(c);
    setAlerts(a);
    setActive(a.find((x) => x.status === "active") || null);
  };

  useEffect(() => {
    load();
  }, []);

  const trigger = async () => {

  if (contacts.length === 0) {
    Alert.alert(
      "Add a contact first",
      "Add at least one emergency contact."
    );
    return;
  }

  setBusy(true);

  try {

    const perm =
      await Location.requestForegroundPermissionsAsync();

    if (perm.status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Location access is required."
      );
      return;
    }

    const loc =
      await Location.getCurrentPositionAsync({
  accuracy: Location.Accuracy.Highest,
});

    const lat = loc.coords.latitude;
    const lng = loc.coords.longitude;
    console.log("Latitude:", lat);
console.log("Longitude:", lng);

Alert.alert(
  "Debug Location",
  `Lat: ${lat}\nLng: ${lng}`
);

    const googleMapLink =
      `https://maps.google.com/?q=${lat},${lng}`;
      const phone = contacts[0]?.phone;

const message = `
🚨 EMERGENCY ALERT

I need help!

My Live Location:
${googleMapLink}
`;

const whatsappURL =
  `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;

await Linking.openURL(whatsappURL);

    Alert.alert(
      "SOS Activated 🚨",
      `Live Location:\n${googleMapLink}`
    );

    const r = await api(
      "/sos/trigger",
      {
        method: "POST",
        body: {
          latitude: lat,
          longitude: lng,
          message:
            `I need help! My location: ${googleMapLink}`
        },
      }
    );

    await load();

  } catch (e:any) {

    Alert.alert(
      "Error",
      e.message || "Could not get location"
    );

  } finally {

    setBusy(false);

  }
};

  const resolve = async () => {
    if (!active) return;
    await api(`/sos/alerts/${active.id}/resolve`, { method: "POST" });
    await load();
  };

  const addContact = async () => {
    if (!newName || !newPhone) return;
    await api("/emergency/contacts", { method: "POST", body: { name: newName, phone: newPhone, relation: newRel } });
    setNewName("");
    setNewPhone("");
    setShowAdd(false);
    await load();
  };

  const removeContact = async (id: string) => {
    await api(`/emergency/contacts/${id}`, { method: "DELETE" });
    await load();
  };

  const fakeCall = () => {
    Alert.alert("📞 Mom calling…", "Ring ring ring… Tap a button to act busy.", [
      { text: "Decline", style: "cancel" },
      { text: "Answer", onPress: () => Alert.alert("Stay safe ❤️", "Walking away while pretending to talk.") },
    ]);
  };

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={{ padding: 20, paddingTop: 14 }}>
          <Text style={[styles.title, { color: colors.text }]}>SOS</Text>
          <Text style={{ color: colors.textMuted, marginTop: 6, fontSize: 16, lineHeight: 22 }}>
            Tap & hold to alert your trusted contacts in seconds.
          </Text>
        </View>

        <View style={styles.sosWrap}>
          <Animated.View style={[styles.pulse, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />
          <Animated.View
            style={[
              styles.pulse,
              { transform: [{ scale: Animated.add(pulseScale, new Animated.Value(0.3)) as any }], opacity: pulseOpacity },
            ]}
          />
          <TouchableOpacity
            onPress={trigger}
            disabled={busy}
            activeOpacity={0.85}
            testID="sos-trigger-button"
          >
            <LinearGradient colors={colors.gradientSos} style={styles.sosBtn}>
              <Feather name="alert-octagon" size={60} color="#fff" />
              <Text style={styles.sosLabel}>{busy ? "SENDING…" : "SOS"}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {active && (
          <View style={[styles.alertCard, { backgroundColor: "#FEF2F2", borderColor: "#FCA5A5" }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Feather name="radio" size={18} color="#DC2626" />
              <Text style={{ fontWeight: "800", color: "#991B1B" }}>ALERT ACTIVE</Text>
            </View>
            <Text style={{ color: "#991B1B", marginTop: 6 }}>
              {active.contacts_notified.length} contact(s) notified · location shared at {new Date(active.created_at).toLocaleTimeString()}
            </Text>
            <TouchableOpacity onPress={resolve} testID="sos-resolve" style={styles.resolveBtn}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>I am safe - resolve alert</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.actionsRow}>
          <ActionBtn icon="phone-call" label="Fake call" onPress={triggerFakeCall} testID="fake-call" colors={colors} />
          <ActionBtn icon="map-pin" label="Share location" onPress={trigger} testID="share-location" colors={colors} />
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <View style={styles.headerRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Emergency contacts</Text>
            <TouchableOpacity onPress={() => setShowAdd(true)} testID="add-contact-btn">
              <Text style={{ color: colors.primary, fontWeight: "700" }}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {contacts.length === 0 ? (
            <Text style={{ color: colors.textMuted, marginTop: 8 }}>
              Add at least one trusted contact. They will receive your live location instantly if you trigger SOS.
            </Text>
          ) : (
            contacts.map((c) => (
              <View key={c.id} style={[styles.contact, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.contactIcon, { backgroundColor: colors.chipBg }]}>
                  <Feather name="user" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "700", color: colors.text }}>{c.name}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 13 }}>{c.relation} · {c.phone}</Text>
                </View>
                <TouchableOpacity onPress={() => removeContact(c.id)} testID={`remove-contact-${c.id}`}>
                  <Feather name="trash-2" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent alerts</Text>
          {alerts.length === 0 ? (
            <Text style={{ color: colors.textMuted, marginTop: 8 }}>No alerts yet. Stay safe out there. 💜</Text>
          ) : (
            alerts.map((a) => (
              <View key={a.id} style={[styles.alertRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Feather name={a.status === "active" ? "radio" : "check-circle"} size={18} color={a.status === "active" ? "#EF4444" : "#10B981"} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: "600" }}>{a.status === "active" ? "Active alert" : "Resolved"}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>{new Date(a.created_at).toLocaleString()}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={showAdd} animationType="slide" transparent onRequestClose={() => setShowAdd(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>Add emergency contact</Text>
            <TextInput
              testID="contact-name"
              placeholder="Name"
              placeholderTextColor={colors.textMuted}
              value={newName}
              onChangeText={setNewName}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />
            <TextInput
              testID="contact-phone"
              placeholder="Phone"
              placeholderTextColor={colors.textMuted}
              value={newPhone}
              onChangeText={setNewPhone}
              keyboardType="phone-pad"
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />
            <View style={{ flexDirection: "row", gap: 8, marginVertical: 8 }}>
              {["Family", "Friend", "Partner", "Other"].map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setNewRel(r)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: newRel === r ? colors.primary : colors.chipBg,
                  }}
                >
                  <Text style={{ color: newRel === r ? "#fff" : colors.text, fontWeight: "600", fontSize: 12 }}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              <TouchableOpacity onPress={() => setShowAdd(false)} style={[styles.modalBtn, { backgroundColor: colors.chipBg }]} testID="cancel-add-contact">
                <Text style={{ color: colors.text, fontWeight: "700" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={addContact} style={[styles.modalBtn, { backgroundColor: colors.primary }]} testID="save-contact">
                <Text style={{ color: "#fff", fontWeight: "700" }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Simulated Fake Incoming Call Modal */}
      <Modal visible={showFakeCall} animationType="fade" transparent={false} onRequestClose={endFakeCall}>
        <LinearGradient colors={["#0F172A", "#1E293B", "#0F172A"]} style={{ flex: 1, padding: 24, justifyContent: "space-between", alignItems: "center" }}>
          {/* Top Info Header */}
          <SafeAreaView style={{ alignItems: "center", paddingTop: 40 }}>
            <Text style={{ color: "#94A3B8", fontSize: 15, fontWeight: "600", letterSpacing: 2, textTransform: "uppercase" }}>
              {fakeCallStatus === "ringing" ? "INCOMING CALL" : "CALL IN PROGRESS"}
            </Text>
            <Text style={{ color: "#FFFFFF", fontSize: 36, fontWeight: "900", marginTop: 12 }}>
              Mom ❤️
            </Text>
            <Text style={{ color: "#CBD5E1", fontSize: 16, marginTop: 4 }}>
              {fakeCallStatus === "ringing" ? "Mobile +1 (555) 019-2834" : formatTimer(callTimer)}
            </Text>
          </SafeAreaView>

          {/* Caller Avatar / Wave visualizer */}
          <View style={{ alignItems: "center", justifyContent: "center" }}>
            <View style={{ width: 140, height: 140, borderRadius: 70, backgroundColor: "#1E293B", borderWidth: 4, borderColor: "#38BDF8", alignItems: "center", justifyContent: "center", shadowColor: "#38BDF8", shadowOpacity: 0.5, shadowRadius: 20 }}>
              <Feather name="user" size={64} color="#38BDF8" />
            </View>

            {fakeCallStatus === "connected" && (
              <View style={{ marginTop: 28, backgroundColor: "rgba(56, 189, 248, 0.15)", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, borderWidth: 1, borderColor: "rgba(56, 189, 248, 0.3)", maxWidth: 300 }}>
                <Text style={{ color: "#38BDF8", fontSize: 14, fontWeight: "700", textAlign: "center" }}>
                  🔊 Simulated Audio Script:
                </Text>
                <Text style={{ color: "#E2E8F0", fontSize: 14, textAlign: "center", marginTop: 4, fontStyle: "italic" }}>
                  "Hey! I'm right around the corner in the blue car. Stay where you are, pulling up in 1 minute!"
                </Text>
              </View>
            )}
          </View>

          {/* Action Control Buttons */}
          <SafeAreaView style={{ width: "100%", paddingBottom: 30 }}>
            {fakeCallStatus === "ringing" ? (
              <View style={{ flexDirection: "row", justifyContent: "space-around", alignItems: "center", width: "100%" }}>
                {/* Decline Button */}
                <TouchableOpacity onPress={endFakeCall} style={{ alignItems: "center" }} testID="fake-call-decline">
                  <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "#EF4444", alignItems: "center", justifyContent: "center", shadowColor: "#EF4444", shadowOpacity: 0.5, shadowRadius: 10 }}>
                    <Feather name="phone-off" size={32} color="#FFFFFF" />
                  </View>
                  <Text style={{ color: "#94A3B8", marginTop: 8, fontWeight: "600", fontSize: 14 }}>Decline</Text>
                </TouchableOpacity>

                {/* Accept Button */}
                <TouchableOpacity onPress={answerFakeCall} style={{ alignItems: "center" }} testID="fake-call-accept">
                  <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "#22C55E", alignItems: "center", justifyContent: "center", shadowColor: "#22C55E", shadowOpacity: 0.5, shadowRadius: 10 }}>
                    <Feather name="phone-call" size={32} color="#FFFFFF" />
                  </View>
                  <Text style={{ color: "#94A3B8", marginTop: 8, fontWeight: "600", fontSize: 14 }}>Answer</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ alignItems: "center", width: "100%" }}>
                {/* End Call Button */}
                <TouchableOpacity onPress={endFakeCall} style={{ alignItems: "center" }} testID="fake-call-end">
                  <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: "#EF4444", alignItems: "center", justifyContent: "center", shadowColor: "#EF4444", shadowOpacity: 0.6, shadowRadius: 12 }}>
                    <Feather name="phone-off" size={36} color="#FFFFFF" />
                  </View>
                  <Text style={{ color: "#94A3B8", marginTop: 10, fontWeight: "700", fontSize: 15 }}>End Call</Text>
                </TouchableOpacity>
              </View>
            )}
          </SafeAreaView>
        </LinearGradient>
      </Modal>
    </SafeAreaView>
  );
}

function ActionBtn({ icon, label, onPress, testID, colors }: any) {
  return (
    <TouchableOpacity onPress={onPress} testID={testID} style={[styles.actBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.actIcon, { backgroundColor: colors.chipBg }]}>
        <Feather name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={{ color: colors.text, fontWeight: "700", marginTop: 6, fontSize: 13 }}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 38, fontWeight: "900" },
  sosWrap: { alignItems: "center", justifyContent: "center", marginVertical: 34, height: 380 },
  pulse: { position: "absolute", width: 230, height: 230, borderRadius: 115, backgroundColor: "rgba(239,68,68,0.26)" },
  sosBtn: { width: 220, height: 220, borderRadius: 110, alignItems: "center", justifyContent: "center", shadowColor: "#EF4444", shadowOpacity: 0.45, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 16 },
  sosLabel: { color: "#fff", fontSize: 32, fontWeight: "900", letterSpacing: 6, marginTop: 12 },
  alertCard: { marginHorizontal: 20, padding: 16, borderRadius: 16, borderWidth: 1 },
  resolveBtn: { marginTop: 12, backgroundColor: "#DC2626", paddingVertical: 12, borderRadius: 999, alignItems: "center" },
  actionsRow: { flexDirection: "row", paddingHorizontal: 20, gap: 12, marginTop: 16 },
  actBtn: { flex: 1, padding: 22, borderRadius: 22, borderWidth: 1, alignItems: "center" },
  actIcon: { width: 50, height: 50, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  sectionTitle: { fontSize: 22, fontWeight: "900" },
  contact: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 18, borderWidth: 1, marginTop: 10 },
  contactIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  alertRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16, borderRadius: 18, borderWidth: 1, marginTop: 10 },
  modalBg: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  modalCard: { padding: 20, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, marginVertical: 6, fontSize: 16 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 999, alignItems: "center" },
});
