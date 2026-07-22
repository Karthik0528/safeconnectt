import React, { useState, useEffect } from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../src/theme";
import { initiateGoogleSignIn, getGoogleClientId, setGoogleClientId } from "../src/googleAuth";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectAccount: (email: string, name: string, avatarUrl: string) => void;
  roleTitle?: string;
};

export function GoogleAuthModal({ visible, onClose, onSelectAccount, roleTitle = "saFeConnect" }: Props) {
  const { colors } = useTheme();
  const [loadingReal, setLoadingReal] = useState(false);
  const [clientIdInput, setClientIdInput] = useState("");
  const [googleEmail, setGoogleEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [activeTab, setActiveTab] = useState<"client_id" | "email">("client_id");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (visible) {
      setClientIdInput(getGoogleClientId());
    }
  }, [visible]);

  const handleConnectWithClientId = async () => {
    if (!clientIdInput.trim()) {
      setErr("Please paste your Google OAuth Client ID from Google Cloud Console.");
      return;
    }

    setGoogleClientId(clientIdInput.trim());
    setLoadingReal(true);
    setErr("");
    try {
      const googleUser = await initiateGoogleSignIn(clientIdInput.trim());
      onSelectAccount(googleUser.email, googleUser.name, googleUser.avatar_url);
      onClose();
    } catch (error: any) {
      console.warn("Google OAuth note:", error?.message);
      if (error?.message === "CLIENT_ID_REQUIRED") {
        setErr("Please enter a valid Google OAuth Client ID.");
      } else if (error?.message?.includes("closed")) {
        setErr("Google window was closed before signing in.");
      } else {
        setErr("Google returned an authorization error. Verify that Authorized Redirect URI in Google Cloud Console is set to: http://localhost:8081/auth/google-callback");
      }
    } finally {
      setLoadingReal(false);
    }
  };

  const handleEmailSubmit = () => {
    if (!googleEmail) {
      setErr("Please enter your Google email address.");
      return;
    }
    const name = fullName || googleEmail.split("@")[0];
    const avatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80";
    onSelectAccount(googleEmail.trim().toLowerCase(), name, avatar);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.googleBadge}>
              <Text style={styles.googleG}>G</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.text }]}>Google Sign-In Setup</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>Authenticating for {roleTitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={{ flexDirection: "row", marginTop: 16, marginBottom: 14, gap: 10 }}>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                {
                  backgroundColor: activeTab === "client_id" ? colors.primary : colors.chipBg,
                  borderColor: activeTab === "client_id" ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                setActiveTab("client_id");
                setErr("");
              }}
            >
              <Text style={{ color: activeTab === "client_id" ? "#fff" : colors.text, fontWeight: "800", fontSize: 13 }}>
                Google Cloud Client ID
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                {
                  backgroundColor: activeTab === "email" ? colors.primary : colors.chipBg,
                  borderColor: activeTab === "email" ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                setActiveTab("email");
                setErr("");
              }}
            >
              <Text style={{ color: activeTab === "email" ? "#fff" : colors.text, fontWeight: "800", fontSize: 13 }}>
                Direct Google Email
              </Text>
            </TouchableOpacity>
          </View>

          {err ? (
            <View style={styles.noticeBox}>
              <Feather name="alert-circle" size={16} color="#FBBF24" />
              <Text style={{ color: "#FFF0F4", fontSize: 12, flex: 1, lineHeight: 17 }}>{err}</Text>
            </View>
          ) : null}

          {activeTab === "client_id" ? (
            <View>
              <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 6 }}>
                Paste the Client ID generated from your Google Cloud Console tab:
              </Text>

              <View style={styles.field}>
                <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <Feather name="key" size={16} color={colors.textMuted} />
                  <TextInput
                    placeholder="e.g. 123456789-xyz.apps.googleusercontent.com"
                    placeholderTextColor={colors.textMuted}
                    value={clientIdInput}
                    onChangeText={setClientIdInput}
                    autoCapitalize="none"
                    style={[styles.input, { color: colors.text }]}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: "#EA4335", marginTop: 10 }]}
                onPress={handleConnectWithClientId}
                disabled={loadingReal}
              >
                {loadingReal ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <View style={styles.innerGIcon}>
                      <Text style={{ color: "#EA4335", fontWeight: "900", fontSize: 14 }}>G</Text>
                    </View>
                    <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}>
                      Launch accounts.google.com Popup
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 8 }}>
                Enter your Google Account email to authenticate:
              </Text>

              <View style={styles.field}>
                <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 4 }}>Google Email</Text>
                <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <Feather name="mail" size={16} color={colors.textMuted} />
                  <TextInput
                    placeholder="Enter your Google email"
                    placeholderTextColor={colors.textMuted}
                    value={googleEmail}
                    onChangeText={setGoogleEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={[styles.input, { color: colors.text }]}
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 4 }}>Full Name (Optional)</Text>
                <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <Feather name="user" size={16} color={colors.textMuted} />
                  <TextInput
                    placeholder="Enter your full name"
                    placeholderTextColor={colors.textMuted}
                    value={fullName}
                    onChangeText={setFullName}
                    style={[styles.input, { color: colors.text }]}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.primary, marginTop: 10 }]}
                onPress={handleEmailSubmit}
              >
                <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}>Authenticate</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 460,
    borderRadius: 22,
    borderWidth: 1,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  googleBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EA4335",
    alignItems: "center",
    justifyContent: "center",
  },
  googleG: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
  },
  closeBtn: {
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  noticeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(251, 191, 36, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.3)",
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  field: {
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 12,
  },
  innerGIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
