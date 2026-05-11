import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../src/theme";
import { api } from "../src/api";
import { GradientButton, VerifiedBadge } from "../src/ui";

const SAMPLE_IMAGES = [
  "https://images.unsplash.com/photo-1476900543704-4312b78632f8?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80",
];

export default function Feed() {
  const { colors } = useTheme();
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [img, setImg] = useState(SAMPLE_IMAGES[0]);
  const [busy, setBusy] = useState(false);
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<any[]>([]);

  const load = useCallback(async () => {
    const p = await api<any[]>("/posts");
    setPosts(p);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onLike = async (id: string) => {
    setPosts((p) =>
      p.map((x) =>
        x.id === id
          ? {
              ...x,
              liked: !x.liked,
              likes_count: x.liked ? x.likes_count - 1 : x.likes_count + 1,
            }
          : x
      )
    );
    try {
      await api(`/posts/${id}/like`, { method: "POST" });
    } catch {}
  };

  const openComments = async (id: string) => {
    setCommentingOn(id);
    const c = await api<any[]>(`/posts/${id}/comments`);
    setComments(c);
  };

  const submitComment = async () => {
    if (!commentingOn || !commentText.trim()) return;
    await api(`/posts/${commentingOn}/comments`, { method: "POST", body: { text: commentText } });
    setCommentText("");
    const c = await api<any[]>(`/posts/${commentingOn}/comments`);
    setComments(c);
    setPosts((p) => p.map((x) => (x.id === commentingOn ? { ...x, comments_count: x.comments_count + 1 } : x)));
  };

  const createPost = async () => {
    if (!caption.trim()) return;
    setBusy(true);
    try {
      await api("/posts", { method: "POST", body: { caption, location, image_url: img } });
      setShowCreate(false);
      setCaption("");
      setLocation("");
      await load();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="feed-back">
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text }}>Community</Text>
        <TouchableOpacity onPress={() => setShowCreate(true)} testID="feed-create">
          <Feather name="plus-circle" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHead}>
              <Image source={{ uri: item.user?.avatar_url }} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ fontWeight: "700", color: colors.text }}>{item.user?.name || "Member"}</Text>
                  {item.user?.verified && <VerifiedBadge size={10} />}
                </View>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>📍 {item.location}</Text>
              </View>
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
            <Image source={{ uri: item.image_url }} style={styles.postImg} />
            <View style={{ padding: 14 }}>
              <View style={{ flexDirection: "row", gap: 16, marginBottom: 8 }}>
                <TouchableOpacity onPress={() => onLike(item.id)} style={styles.iconRow} testID={`like-${item.id}`}>
                  <Feather name="heart" size={20} color={item.liked ? "#EC4899" : colors.text} />
                  <Text style={{ color: colors.text, fontWeight: "600" }}>{item.likes_count}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openComments(item.id)} style={styles.iconRow} testID={`comment-${item.id}`}>
                  <Feather name="message-circle" size={20} color={colors.text} />
                  <Text style={{ color: colors.text, fontWeight: "600" }}>{item.comments_count}</Text>
                </TouchableOpacity>
                <View style={{ flex: 1 }} />
                <Feather name="bookmark" size={20} color={colors.text} />
              </View>
              <Text style={{ color: colors.text }}>
                <Text style={{ fontWeight: "700" }}>{item.user?.name?.split(" ")[0]} </Text>
                {item.caption}
              </Text>
            </View>
          </View>
        )}
      />

      <Modal visible={showCreate} animationType="slide" transparent onRequestClose={() => setShowCreate(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text }}>New post</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
              {SAMPLE_IMAGES.map((u) => (
                <TouchableOpacity
                  key={u}
                  onPress={() => setImg(u)}
                  style={{ marginRight: 10, borderRadius: 14, borderWidth: 2, borderColor: img === u ? colors.primary : "transparent", padding: 2 }}
                  testID={`feed-img-${u.slice(-10)}`}
                >
                  <Image source={{ uri: u }} style={{ width: 90, height: 90, borderRadius: 12 }} />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput
              testID="feed-caption"
              placeholder="Write a caption…"
              placeholderTextColor={colors.textMuted}
              value={caption}
              onChangeText={setCaption}
              style={[styles.input, { color: colors.text, borderColor: colors.border, height: 100, textAlignVertical: "top" }]}
              multiline
            />
            <TextInput
              testID="feed-location"
              placeholder="Location"
              placeholderTextColor={colors.textMuted}
              value={location}
              onChangeText={setLocation}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <TouchableOpacity onPress={() => setShowCreate(false)} style={{ flex: 1, paddingVertical: 14, borderRadius: 999, alignItems: "center", backgroundColor: colors.chipBg }}>
                <Text style={{ color: colors.text, fontWeight: "700" }}>Cancel</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <GradientButton title="Post" onPress={createPost} loading={busy} testID="feed-publish" />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={!!commentingOn} animationType="slide" transparent onRequestClose={() => setCommentingOn(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={[styles.sheet, { backgroundColor: colors.surface, maxHeight: "75%" }]}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text, marginBottom: 12 }}>Comments</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {comments.length === 0 && <Text style={{ color: colors.textMuted }}>Be the first to comment ✨</Text>}
              {comments.map((c) => (
                <View key={c.id} style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
                  <Image source={{ uri: c.user?.avatar_url }} style={{ width: 32, height: 32, borderRadius: 999 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text }}>
                      <Text style={{ fontWeight: "700" }}>{c.user?.name?.split(" ")[0]} </Text>
                      {c.text}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 12, alignItems: "center" }}>
              <TextInput
                testID="comment-input"
                placeholder="Add a comment…"
                placeholderTextColor={colors.textMuted}
                value={commentText}
                onChangeText={setCommentText}
                style={[styles.input, { flex: 1, color: colors.text, borderColor: colors.border, marginTop: 0 }]}
              />
              <TouchableOpacity onPress={submitComment} testID="comment-send" style={{ width: 44, height: 44, borderRadius: 999, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
                <Feather name="send" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setCommentingOn(null)} style={{ alignSelf: "center", padding: 12 }}>
              <Text style={{ color: colors.textMuted }}>Close</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  card: { borderRadius: 20, borderWidth: 1, marginBottom: 14, overflow: "hidden" },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  avatar: { width: 36, height: 36, borderRadius: 999 },
  postImg: { width: "100%", height: 280 },
  iconRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  sheet: { padding: 20, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 8, fontSize: 16 },
});
