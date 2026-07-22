import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme, radii, spacing } from "../../src/theme";
import { useAuth } from "../../src/auth";
import { api } from "../../src/api";
import { GradientButton, VerifiedBadge, GlassCard } from "../../src/ui";

const EMOJI_OPTIONS = [
  { label: "😡 Very Bad", value: "😡 Very Bad", rating: 1 },
  { label: "🙁 Bad", value: "🙁 Bad", rating: 2 },
  { label: "😐 Normal", value: "😐 Normal", rating: 3 },
  { label: "🙂 Good", value: "🙂 Good", rating: 4 },
  { label: "😁 Very Good", value: "😁 Very Good", rating: 5 },
];

const REPORT_REASONS = [
  "🚨 Harassment / Misbehavior",
  "⚠️ Safety Threat / Unsafe Location",
  "💰 Overcharging / Extortion",
  "⏰ Late / Unprofessional",
  "❗ Other Safety Violation",
];

export default function GuideDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [guide, setGuide] = useState<any | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);

  // Booking Modal
  const [showBook, setShowBook] = useState(false);
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [bookBusy, setBookBusy] = useState(false);

  // Review Modal
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [selectedEmoji, setSelectedEmoji] = useState("😁 Very Good");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);

  // Report Modal (Traveller Only)
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportDetails, setReportDetails] = useState("");
  const [reportBusy, setReportBusy] = useState(false);

  const fetchGuideAndReviews = useCallback(async () => {
    try {
      const [g, revs] = await Promise.all([
        api<any>(`/guides/${id}`),
        api<any[]>(`/guides/${id}/reviews`).catch(() => []),
      ]);
      setGuide(g);
      setReviews(revs);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  }, [id]);

  useEffect(() => {
    fetchGuideAndReviews();
  }, [fetchGuideAndReviews]);

  const handleBook = async () => {
    if (!date) {
      Alert.alert("Pick a date", "Add a date to confirm your booking.");
      return;
    }
    setBookBusy(true);
    try {
      await api(`/guides/${id}/book`, { method: "POST", body: { date, notes } });
      setShowBook(false);
      Alert.alert("Booked! 🎉", `${guide.name} will see your booking and contact you soon.`);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setBookBusy(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!reviewComment.trim()) {
      Alert.alert("Feedback Required", "Please write a brief review feedback comment.");
      return;
    }
    setReviewBusy(true);
    try {
      await api(`/guides/${id}/reviews`, {
        method: "POST",
        body: {
          rating,
          emoji: selectedEmoji,
          comment: reviewComment,
        },
      });
      setShowReview(false);
      setReviewComment("");
      Alert.alert("Thank you! ⭐", "Your feedback & sentiment review has been added.");
      await fetchGuideAndReviews();
    } catch (e: any) {
      Alert.alert("Review Error", e.message);
    } finally {
      setReviewBusy(false);
    }
  };

  const handleReportSubmit = async () => {
    if (!reportReason) {
      Alert.alert("Reason Required", "Please select a reason for reporting this guide.");
      return;
    }
    setReportBusy(true);
    try {
      const res = await api<any>(`/guides/${id}/report`, {
        method: "POST",
        body: {
          reason: reportReason,
          details: reportDetails,
        },
      });
      setShowReport(false);
      setReportDetails("");

      if (res.banned) {
        Alert.alert(
          "Report Actioned 🚨",
          "Thank you for reporting this incident. Platform Governance has suspended this guide account immediately for community safety.",
          [{ text: "OK", onPress: () => router.back() }]
        );
      } else {
        Alert.alert(
          "Report Submitted",
          "Your incident report has been submitted to Platform Safety Governance. The guide's safety score has been reduced."
        );
        await fetchGuideAndReviews();
      }
    } catch (e: any) {
      Alert.alert("Report Error", e.message || "Failed to submit report.");
    } finally {
      setReportBusy(false);
    }
  };

  if (!guide) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} />;

  const isGuideUser = user?.role === "guide" || user?.is_guide;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header Hero */}
        <LinearGradient colors={colors.gradientPrimary} style={styles.hero}>
          <View style={styles.heroTopRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.back} testID="guide-back">
              <Feather name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>

            {/* In-Trip Emergency Report Button - TRAVELLERS ONLY */}
            {!isGuideUser ? (
              <TouchableOpacity
                onPress={() => setShowReport(true)}
                style={styles.reportHeaderBtn}
                testID="guide-report-btn"
              >
                <Feather name="alert-triangle" size={16} color="#FF6B6B" />
                <Text style={{ color: "#FF6B6B", fontWeight: "800", fontSize: 12 }}>Report Guide</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={{ alignItems: "center", paddingTop: 8 }}>
            <Image source={{ uri: guide.avatar_url }} style={styles.avatar} />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 }}>
              <Text style={styles.name}>{guide.name}</Text>
              <VerifiedBadge />
            </View>
            <Text style={{ color: "rgba(255,255,255,0.85)", marginTop: 2 }}>
              {guide.city}, {guide.country}
            </Text>

            {/* Sentiment & Safety Badges */}
            <View style={styles.badgeRow}>
              <View style={styles.safetyPill}>
                <Feather name="shield" size={13} color="#34D399" />
                <Text style={{ color: "#34D399", fontWeight: "800", fontSize: 12 }}>
                  {guide.safety_score ?? 100}/100 Safety Score
                </Text>
              </View>
              {guide.positive_percent ? (
                <View style={styles.sentimentPill}>
                  <Feather name="thumbs-up" size={13} color="#FBBF24" />
                  <Text style={{ color: "#FBBF24", fontWeight: "800", fontSize: 12 }}>
                    {guide.positive_percent}% +ve Sentiment
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={{ flexDirection: "row", marginTop: 16, gap: 22 }}>
              <Stat n={guide.experience_years + "y"} l="Experience" />
              <Stat n={`⭐ ${guide.rating || 5.0}`} l={`${guide.reviews_count || 0} reviews`} />
              <Stat n={`₹${guide.price_per_day}`} l="Per day" />
            </View>
          </View>
        </LinearGradient>

        <View style={{ padding: 20 }}>
          {/* About Section */}
          <Text style={[styles.h, { color: colors.text }]}>About Guide</Text>
          <Text style={{ color: colors.textMuted, lineHeight: 22, marginTop: 6 }}>{guide.bio}</Text>

          {/* Languages */}
          <Text style={[styles.h, { color: colors.text, marginTop: 18 }]}>Languages Known</Text>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
            {guide.languages?.map((l: string) => (
              <View key={l} style={[styles.tag, { backgroundColor: colors.chipBg }]}>
                <Feather name="message-square" size={12} color={colors.primary} />
                <Text style={{ color: colors.text, fontWeight: "600", fontSize: 13 }}>{l}</Text>
              </View>
            ))}
          </View>

          {/* Certifications & Licenses */}
          <Text style={[styles.h, { color: colors.text, marginTop: 18 }]}>Credentials & License</Text>
          <View style={{ marginTop: 6, gap: 6 }}>
            {guide.guide_id_num ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Feather name="award" size={16} color={colors.secondary} />
                <Text style={{ color: colors.text }}>Govt Guide ID: <Text style={{ fontWeight: "700" }}>{guide.guide_id_num}</Text></Text>
              </View>
            ) : null}
            {guide.tourism_id ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Feather name="file-text" size={16} color={colors.secondary} />
                <Text style={{ color: colors.text }}>Tourism License: <Text style={{ fontWeight: "700" }}>{guide.tourism_id}</Text></Text>
              </View>
            ) : null}
          </View>

          {/* Reviews & Feedback Section */}
          <View style={styles.reviewsHeaderRow}>
            <Text style={[styles.h, { color: colors.text }]}>Traveller Reviews & Feedback</Text>
            <TouchableOpacity
              style={[styles.writeRevBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowReview(true)}
              testID="write-review-btn"
            >
              <Feather name="edit-3" size={14} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>Write Review</Text>
            </TouchableOpacity>
          </View>

          {reviews.length === 0 ? (
            <Text style={{ color: colors.textMuted, fontStyle: "italic", marginTop: 8 }}>
              No reviews yet. Be the first traveller to review {guide.name}!
            </Text>
          ) : (
            <View style={{ marginTop: 10, gap: 12 }}>
              {reviews.map((rev) => (
                <GlassCard key={rev.id} style={{ padding: 14 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={{ fontSize: 18 }}>{rev.emoji || "🙂"}</Text>
                      <View>
                        <Text style={{ color: colors.text, fontWeight: "800", fontSize: 14 }}>{rev.user_name}</Text>
                        <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                          {"⭐".repeat(rev.rating)} ({rev.rating}/5)
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.sentimentScoreBadge, { backgroundColor: rev.sentiment_score >= 0 ? "rgba(52,211,153,0.15)" : "rgba(239,83,90,0.15)" }]}>
                      <Text style={{ color: rev.sentiment_score >= 0 ? "#34D399" : "#EF535A", fontWeight: "800", fontSize: 11 }}>
                        {rev.sentiment_score >= 0 ? "+Positive" : "-Negative"}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ color: colors.text, marginTop: 8, lineHeight: 20 }}>{rev.comment}</Text>
                </GlassCard>
              ))}
            </View>
          )}

          {/* In-Trip Safety Notice for Travellers */}
          {!isGuideUser ? (
            <TouchableOpacity
              style={[styles.reportCardBtn, { borderColor: "rgba(239, 83, 90, 0.4)", backgroundColor: "rgba(239, 83, 90, 0.08)" }]}
              onPress={() => setShowReport(true)}
            >
              <Feather name="shield-off" size={20} color={colors.error} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.error, fontWeight: "800", fontSize: 14 }}>
                  Report Misbehavior or In-Trip Danger
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                  Is this guide misbehaving or putting you in danger? Tap here to report immediately.
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.error} />
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>

      {/* Book Bar */}
      <View style={[styles.bookBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textMuted, fontSize: 11, textTransform: "uppercase", fontWeight: "700" }}>Price</Text>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800" }}>₹{guide.price_per_day}/day</Text>
        </View>
        <View style={{ minWidth: 160 }}>
          <GradientButton title="Book guide" icon="calendar" onPress={() => setShowBook(true)} testID="guide-book-btn" />
        </View>
      </View>

      {/* Book Modal */}
      <Modal visible={showBook} transparent animationType="slide" onRequestClose={() => setShowBook(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text, marginBottom: 4 }}>Book {guide.name}</Text>
            <Text style={{ color: colors.textMuted, marginBottom: 12 }}>Pick a date and add trip details.</Text>
            <TextInput
              testID="book-date"
              placeholder="Date (YYYY-MM-DD)"
              placeholderTextColor={colors.textMuted}
              value={date}
              onChangeText={setDate}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />
            <TextInput
              testID="book-notes"
              placeholder="Anything your guide should know"
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              style={[styles.input, { height: 90, textAlignVertical: "top", color: colors.text, borderColor: colors.border }]}
            />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              <TouchableOpacity
                onPress={() => setShowBook(false)}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 999, alignItems: "center", backgroundColor: colors.chipBg }}
              >
                <Text style={{ color: colors.text, fontWeight: "700" }}>Cancel</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <GradientButton title="Confirm" icon="check" onPress={handleBook} loading={bookBusy} testID="book-confirm" />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Write Review & Feedback Modal */}
      <Modal visible={showReview} transparent animationType="slide" onRequestClose={() => setShowReview(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: "900", color: colors.text }}>Review {guide.name}</Text>
              <TouchableOpacity onPress={() => setShowReview(false)}>
                <Feather name="x" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 8 }}>Rate your experience (1 to 5):</Text>

            {/* Emoji Rating Options */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              {EMOJI_OPTIONS.map((item) => {
                const isSelected = selectedEmoji === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    onPress={() => {
                      setSelectedEmoji(item.value);
                      setRating(item.rating);
                    }}
                    style={[
                      styles.emojiChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.chipBg,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={{ color: isSelected ? "#fff" : colors.text, fontWeight: "700", fontSize: 13 }}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 4 }}>Detailed Written Feedback Review:</Text>
            <TextInput
              placeholder="Write your detailed review about guide behavior, safety, knowledge, etc..."
              placeholderTextColor={colors.textMuted}
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
              style={[styles.input, { height: 100, textAlignVertical: "top", color: colors.text, borderColor: colors.border }]}
            />

            <View style={{ marginTop: 16 }}>
              <GradientButton title="Submit Feedback Review" icon="send" onPress={handleReviewSubmit} loading={reviewBusy} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Report Guide Modal (TRAVELLER ONLY) */}
      <Modal visible={showReport} transparent animationType="slide" onRequestClose={() => setShowReport(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Feather name="alert-circle" size={20} color={colors.error} />
                <Text style={{ fontSize: 18, fontWeight: "900", color: colors.error }}>Report Guide</Text>
              </View>
              <TouchableOpacity onPress={() => setShowReport(false)}>
                <Feather name="x" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 10 }}>
              Select the primary reason for reporting {guide.name}:
            </Text>

            {/* Mandatory Reason Selection */}
            <View style={{ gap: 8, marginBottom: 14 }}>
              {REPORT_REASONS.map((r) => {
                const isSel = reportReason === r;
                return (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setReportReason(r)}
                    style={[
                      styles.reasonOption,
                      {
                        backgroundColor: isSel ? "rgba(239, 83, 90, 0.15)" : colors.chipBg,
                        borderColor: isSel ? colors.error : colors.border,
                      },
                    ]}
                  >
                    <Feather name={isSel ? "disc" : "circle"} size={16} color={isSel ? colors.error : colors.textMuted} />
                    <Text style={{ color: isSel ? colors.error : colors.text, fontWeight: "700", fontSize: 13 }}>{r}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 4 }}>Incident Details / Explanation:</Text>
            <TextInput
              placeholder="Describe what happened during your trip..."
              placeholderTextColor={colors.textMuted}
              value={reportDetails}
              onChangeText={setReportDetails}
              multiline
              style={[styles.input, { height: 90, textAlignVertical: "top", color: colors.text, borderColor: colors.border }]}
            />

            <TouchableOpacity
              style={[styles.submitReportBtn, { backgroundColor: colors.error }]}
              onPress={handleReportSubmit}
              disabled={reportBusy}
            >
              {reportBusy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "900", fontSize: 15 }}>Submit Incident Report</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>{n}</Text>
      <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>{l}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  heroTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  back: { width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  reportHeaderBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.9)" },
  avatar: { width: 100, height: 100, borderRadius: 999, borderWidth: 3, borderColor: "#fff" },
  name: { color: "#fff", fontSize: 24, fontWeight: "800" },
  badgeRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  safetyPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.3)" },
  sentimentPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.3)" },
  h: { fontSize: 18, fontWeight: "700" },
  tag: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  reviewsHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 22 },
  writeRevBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  sentimentScoreBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  reportCardBtn: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, marginTop: 24 },
  bookBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", gap: 12, padding: 16, paddingBottom: 24, borderTopWidth: 1 },
  modalBg: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  modalCard: { padding: 20, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  emojiChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1 },
  reasonOption: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 4, fontSize: 14 },
  submitReportBtn: { paddingVertical: 14, borderRadius: 16, alignItems: "center", marginTop: 16 },
});
