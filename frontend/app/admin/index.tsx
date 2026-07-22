import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth, User } from "../../src/auth";
import { api } from "../../src/api";
import { useTheme, radii, spacing } from "../../src/theme";
import { GlassCard, VerifiedBadge } from "../../src/ui";
import { Feather } from "@expo/vector-icons";

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const { colors } = useTheme();

  const [activeTab, setActiveTab] = useState<
    "pending_users" | "pending_guides" | "approved_users" | "approved_guides" | "rejected" | "all_users"
  >("pending_users");

  const [accounts, setAccounts] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.replace("/admin/login");
    }
  }, [user, authLoading]);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const query = searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : "";
      const list = await api<User[]>(`/admin/accounts?tab=${activeTab}${query}`);
      setAccounts(list);
    } catch (err: any) {
      console.error("Fetch admin accounts error:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchAccounts();
    }
  }, [user, fetchAccounts]);

  if (authLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textMuted, marginTop: 12 }}>Authenticating Admin session...</Text>
      </View>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Feather name="lock" size={48} color={colors.error} />
        <Text style={[styles.accessDeniedTitle, { color: colors.text }]}>Admin Privileges Required</Text>
        <Text style={{ color: colors.textMuted, textAlign: "center", marginVertical: 12 }}>
          You must be logged in with an Admin account to access this dashboard.
        </Text>
        <TouchableOpacity
          style={[styles.loginBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.replace("/admin/login")}
        >
          <Text style={{ color: "#fff", fontWeight: "800" }}>Go to Admin Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleApprove = async (userId: string) => {
    setActionLoading(userId);
    try {
      await api(`/admin/accounts/${userId}/approve`, { method: "POST" });
      await fetchAccounts();
    } catch (e: any) {
      Alert.alert("Approval Error", e.message || "Failed to approve account");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId: string) => {
    setActionLoading(userId);
    try {
      await api(`/admin/accounts/${userId}/reject`, { method: "POST" });
      await fetchAccounts();
    } catch (e: any) {
      Alert.alert("Rejection Error", e.message || "Failed to reject account");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleBadge = async (userId: string) => {
    setActionLoading(userId);
    try {
      await api(`/admin/accounts/${userId}/toggle-badge`, { method: "POST" });
      await fetchAccounts();
    } catch (e: any) {
      Alert.alert("Badge Error", e.message || "Failed to toggle badge");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (userId: string) => {
    setActionLoading(userId);
    try {
      await api(`/admin/accounts/${userId}/suspend`, { method: "POST" });
      await fetchAccounts();
    } catch (e: any) {
      Alert.alert("Suspend Error", e.message || "Failed to suspend account");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestore = async (userId: string) => {
    setActionLoading(userId);
    try {
      await api(`/admin/accounts/${userId}/restore`, { method: "POST" });
      await fetchAccounts();
    } catch (e: any) {
      Alert.alert("Restore Error", e.message || "Failed to restore account");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    Alert.alert(
      "Confirm Account Deletion",
      `Are you sure you want to permanently delete ${userName}? This will remove all database records, authentication details, and uploaded media.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Permanently",
          style: "destructive",
          onPress: async () => {
            setActionLoading(userId);
            try {
              await api(`/admin/accounts/${userId}`, { method: "DELETE" });
              if (selectedUser?.id === userId) setModalVisible(false);
              await fetchAccounts();
            } catch (e: any) {
              Alert.alert("Deletion Error", e.message || "Failed to delete account");
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const formatGovtIdText = (govId?: string) => {
    if (!govId) return "N/A";
    if (govId.startsWith("data:image") || govId.startsWith("http")) {
      return "📷 Uploaded Photo Identity Document";
    }
    if (govId.length > 35) {
      return govId.substring(0, 32) + "...";
    }
    return govId;
  };

  const TABS = [
    { key: "pending_users", label: "Pending Users", icon: "clock" },
    { key: "pending_guides", label: "Pending Guides", icon: "award" },
    { key: "approved_users", label: "Approved Users", icon: "user-check" },
    { key: "approved_guides", label: "Approved Guides", icon: "shield" },
    { key: "rejected", label: "Rejected", icon: "user-x" },
    { key: "all_users", label: "All Accounts", icon: "users" },
  ] as const;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.headerBar, { borderBottomColor: colors.border }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={styles.adminBadge}>
            <Feather name="shield" size={18} color="#fff" />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Admin Governance Portal</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>saFeConnect Security & Verification</Text>
          </View>
        </View>

        {/* Removed Download Button - Only Logout Button remains */}
        <TouchableOpacity style={styles.iconBtn} onPress={logout} title="Sign Out">
          <Feather name="log-out" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>

      {/* Neat Tabs Bar */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabsContainer}
        >
          {TABS.map((t) => {
            const active = activeTab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => setActiveTab(t.key)}
                style={[
                  styles.tabChip,
                  {
                    backgroundColor: active ? colors.primary : colors.surface,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Feather name={t.icon as any} size={14} color={active ? "#fff" : colors.textMuted} />
                <Text style={[styles.tabLabel, { color: active ? "#fff" : colors.text }]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrap}>
        <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Feather name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by Name, Username, Email, Phone, City, State..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Feather name="x" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Account Cards List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textMuted, marginTop: 10 }}>Loading Admin accounts...</Text>
        </View>
      ) : accounts.length === 0 ? (
        <View style={styles.centered}>
          <Feather name="inbox" size={40} color={colors.textMuted} />
          <Text style={{ color: colors.textMuted, marginTop: 10, fontWeight: "600" }}>
            No accounts found in this view.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {accounts.map((acc) => (
            <GlassCard key={acc.id} style={styles.accountCard}>
              <View style={styles.cardHeader}>
                <Image
                  source={{
                    uri:
                      acc.avatar_url ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
                  }}
                  style={styles.avatar}
                />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={[styles.name, { color: colors.text }]}>{acc.name}</Text>
                    {acc.verified && <VerifiedBadge size={14} showLabel />}
                  </View>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                    @{acc.username || "no_username"} • {acc.email} • {acc.phone}
                  </Text>
                  <Text style={{ color: colors.secondary, fontSize: 12, fontWeight: "700", marginTop: 2 }}>
                    Role: {(acc.role || "user").toUpperCase()} • Location: {acc.city || "City"}, {acc.state || "State"}
                  </Text>
                  {acc.age ? (
                    <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                      Age: {acc.age} • Gender: {acc.gender || "Female"} • DOB: {acc.dob || "N/A"}
                    </Text>
                  ) : null}
                </View>

                {/* Status Pills */}
                <View style={{ alignItems: "flex-end" }}>
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor:
                          acc.verification_status === "approved" || acc.verified
                            ? "rgba(52, 211, 153, 0.2)"
                            : acc.verification_status === "rejected"
                            ? "rgba(239, 83, 90, 0.2)"
                            : "rgba(251, 191, 36, 0.2)",
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "800",
                        color:
                          acc.verification_status === "approved" || acc.verified
                            ? "#34D399"
                            : acc.verification_status === "rejected"
                            ? "#EF535A"
                            : "#FBBF24",
                      }}
                    >
                      {(acc.verification_status || "PENDING").toUpperCase()}
                    </Text>
                  </View>
                  {acc.status === "suspended" && (
                    <Text style={{ color: colors.error, fontSize: 10, fontWeight: "800", marginTop: 4 }}>
                      SUSPENDED
                    </Text>
                  )}
                </View>
              </View>

              {/* ID Proof Details Summary - Clean text formatting */}
              <View style={[styles.docSummary, { backgroundColor: colors.surface }]}>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                  Govt Identity Document: <Text style={{ color: colors.text, fontWeight: "800" }}>{formatGovtIdText(acc.government_id)}</Text>
                </Text>
                {acc.is_guide || acc.role === "guide" ? (
                  <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
                    Guide ID: <Text style={{ color: colors.text, fontWeight: "800" }}>{acc.guide_id_num || "N/A"}</Text> • Fee: ₹{acc.price_per_day || 1500}/day • Exp: {acc.experience_years || 1} yrs
                  </Text>
                ) : null}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                {actionLoading === acc.id ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <>
                    {acc.verification_status !== "approved" && !acc.verified && (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: "#34D399" }]}
                        onPress={() => handleApprove(acc.id)}
                      >
                        <Feather name="check" size={14} color="#fff" />
                        <Text style={styles.actionText}>Approve</Text>
                      </TouchableOpacity>
                    )}

                    {acc.verification_status !== "rejected" && (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: "#EF535A" }]}
                        onPress={() => handleReject(acc.id)}
                      >
                        <Feather name="x" size={14} color="#fff" />
                        <Text style={styles.actionText}>Reject</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                      onPress={() => handleToggleBadge(acc.id)}
                    >
                      <Feather name="award" size={14} color="#fff" />
                      <Text style={styles.actionText}>
                        {acc.verified ? "Remove Badge" : "Grant Badge"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.chipBg }]}
                      onPress={() => {
                        setSelectedUser(acc);
                        setModalVisible(true);
                      }}
                    >
                      <Feather name="eye" size={14} color={colors.primary} />
                      <Text style={[styles.actionText, { color: colors.primary }]}>View Details</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: "rgba(239, 83, 90, 0.15)" }]}
                      onPress={() => handleDelete(acc.id, acc.name)}
                    >
                      <Feather name="trash-2" size={14} color={colors.error} />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </GlassCard>
          ))}
        </ScrollView>
      )}

      {/* View User Details Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalCard}>
            {selectedUser && (
              <ScrollView style={{ maxHeight: 540 }}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Account Details</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Feather name="x" size={22} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <View style={{ alignItems: "center", marginBottom: 16 }}>
                  <Image source={{ uri: selectedUser.avatar_url }} style={styles.modalAvatar} />
                  <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800", marginTop: 8 }}>
                    {selectedUser.name}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 13 }}>@{selectedUser.username || "username"}</Text>
                  <Text style={{ color: colors.primary, fontWeight: "700", marginTop: 2 }}>
                    {selectedUser.role?.toUpperCase()} • {selectedUser.city}, {selectedUser.state}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailVal}>{selectedUser.email}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone:</Text>
                  <Text style={styles.detailVal}>{selectedUser.phone}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Age:</Text>
                  <Text style={styles.detailVal}>{selectedUser.age || 25} Years</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Sex / Gender:</Text>
                  <Text style={styles.detailVal}>{selectedUser.gender || "Female"}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date of Birth:</Text>
                  <Text style={styles.detailVal}>{selectedUser.dob || "N/A"}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Government ID Proof:</Text>
                  <Text style={styles.detailVal}>{formatGovtIdText(selectedUser.government_id)}</Text>
                </View>

                {/* If government_id is an image or URL, display as a photo preview */}
                {selectedUser.government_id && (selectedUser.government_id.startsWith("data:image") || selectedUser.government_id.startsWith("http")) ? (
                  <View style={{ marginTop: 10 }}>
                    <Text style={{ color: colors.text, fontWeight: "800", fontSize: 12, marginBottom: 6 }}>
                      Uploaded Photo Identity Document:
                    </Text>
                    <Image
                      source={{ uri: selectedUser.government_id }}
                      style={{ width: "100%", height: 180, borderRadius: 10, backgroundColor: "#000" }}
                      resizeMode="contain"
                    />
                  </View>
                ) : null}

                <View style={[styles.detailRow, { marginTop: 8 }]}>
                  <Text style={styles.detailLabel}>Verification Status:</Text>
                  <Text style={[styles.detailVal, { color: selectedUser.verified ? "#34D399" : "#FBBF24" }]}>
                    {(selectedUser.verification_status || "PENDING").toUpperCase()}
                  </Text>
                </View>

                {/* Emergency Contact */}
                {selectedUser.emergency_contact && (
                  <View style={{ marginTop: 12, padding: 10, borderRadius: 8, backgroundColor: colors.surface }}>
                    <Text style={{ color: colors.text, fontWeight: "800", fontSize: 12, marginBottom: 4 }}>
                      Emergency SOS Contact:
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                      {selectedUser.emergency_contact.name || "Contact"} ({selectedUser.emergency_contact.relation || "Family"}): {selectedUser.emergency_contact.phone}
                    </Text>
                  </View>
                )}

                {/* Guide Specific Info */}
                {(selectedUser.is_guide || selectedUser.role === "guide") && (
                  <View style={{ marginTop: 12, padding: 10, borderRadius: 8, backgroundColor: "rgba(248, 186, 124, 0.15)" }}>
                    <Text style={{ color: colors.secondary, fontWeight: "800", fontSize: 13, marginBottom: 6 }}>
                      Guide Specific Credentials:
                    </Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Guide ID Num:</Text>
                      <Text style={styles.detailVal}>{selectedUser.guide_id_num || "N/A"}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Tourism License:</Text>
                      <Text style={styles.detailVal}>{selectedUser.tourism_id || "N/A"}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Guiding Experience:</Text>
                      <Text style={styles.detailVal}>{selectedUser.experience_years || 1} Years</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Price Per Day (₹):</Text>
                      <Text style={styles.detailVal}>₹{selectedUser.price_per_day || 1500} INR</Text>
                    </View>
                  </View>
                )}

                {/* Account Status Actions */}
                <View style={{ marginTop: 20, gap: 10 }}>
                  {selectedUser.status === "active" ? (
                    <TouchableOpacity
                      style={[styles.modalActionBtn, { backgroundColor: colors.error }]}
                      onPress={() => {
                        handleSuspend(selectedUser.id);
                        setModalVisible(false);
                      }}
                    >
                      <Text style={styles.modalBtnText}>Suspend Account</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.modalActionBtn, { backgroundColor: colors.success }]}
                      onPress={() => {
                        handleRestore(selectedUser.id);
                        setModalVisible(false);
                      }}
                    >
                      <Text style={styles.modalBtnText}>Restore Account</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.modalActionBtn, { backgroundColor: "rgba(239, 83, 90, 0.2)" }]}
                    onPress={() => handleDelete(selectedUser.id, selectedUser.name)}
                  >
                    <Text style={[styles.modalBtnText, { color: colors.error }]}>Delete Account Permanently</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  adminBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "900" },
  iconBtn: {
    padding: 10,
    borderRadius: radii.md,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  tabsWrapper: {
    height: 52,
    marginVertical: 8,
  },
  tabsScroll: { flex: 1 },
  tabsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: spacing.lg,
    height: 52,
  },
  tabChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    justify: "center",
  },
  tabLabel: {
    fontWeight: "800",
    fontSize: 13,
  },
  searchWrap: { paddingHorizontal: spacing.lg, marginBottom: 12 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 14 },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  accountCard: { marginBottom: 14, padding: spacing.md },
  cardHeader: { flexDirection: "row", gap: 12, alignItems: "center" },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  name: { fontSize: 16, fontWeight: "800" },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radii.sm },
  docSummary: { padding: 10, borderRadius: radii.sm, marginVertical: 10 },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.md,
  },
  actionText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.xl },
  accessDeniedTitle: { fontSize: 22, fontWeight: "900", marginTop: 12 },
  loginBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: radii.full, marginTop: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalCard: { padding: spacing.lg },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "900" },
  modalAvatar: { width: 70, height: 70, borderRadius: 35 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 4 },
  detailLabel: { color: "#C9B4BE", fontSize: 13, fontWeight: "600" },
  detailVal: { color: "#FFF0F4", fontSize: 13, fontWeight: "800", maxWidth: "65%" },
  modalActionBtn: {
    paddingVertical: 12,
    borderRadius: radii.md,
    alignItems: "center",
  },
  modalBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
