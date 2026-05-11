import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Animated,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const slides = [
  {
    title: "Travel solo,\nnever alone.",
    sub: "Connect with verified women travellers heading to your next destination.",
    icon: "users" as const,
    bg: ["#FCE7F3", "#EDE9FE"] as [string, string],
    accent: "#8B5CF6",
  },
  {
    title: "AI safety,\nbuilt-in.",
    sub: "Real-time risk maps, AI travel tips, and a one-tap SOS that actually works.",
    icon: "shield" as const,
    bg: ["#EDE9FE", "#DBEAFE"] as [string, string],
    accent: "#EC4899",
  },
  {
    title: "Verified guides,\nverified women.",
    sub: "Every traveller and local guide is ID-verified before they appear.",
    icon: "check-circle" as const,
    bg: ["#FAE8FF", "#F5D0FE"] as [string, string],
    accent: "#A855F7",
  },
];

export default function Onboarding() {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const listRef = useRef<FlatList>(null);

  const next = () => {
    if (idx < slides.length - 1) {
      listRef.current?.scrollToIndex({ index: idx + 1 });
      setIdx(idx + 1);
    } else {
      router.replace("/auth/login");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} testID="onboarding-screen">
      <View style={styles.topBar}>
        <Text style={styles.brand}>sa<Text style={{ color: "#EC4899" }}>Fe</Text>Connect</Text>
        <TouchableOpacity onPress={() => router.replace("/auth/login")} testID="onboarding-skip">
          <Text style={styles.skip}>Skip</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={{ width, paddingHorizontal: 24 }}>
            <LinearGradient colors={item.bg} style={styles.hero}>
              <View style={[styles.heroIcon, { backgroundColor: item.accent }]}>
                <Feather name={item.icon} size={56} color="#fff" />
              </View>
              <View style={styles.bubble1} />
              <View style={styles.bubble2} />
            </LinearGradient>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.sub}>{item.sub}</Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { width: idx === i ? 24 : 8, backgroundColor: idx === i ? "#8B5CF6" : "#E5E7EB" },
            ]}
          />
        ))}
      </View>

      <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
        <TouchableOpacity onPress={next} activeOpacity={0.85} testID="onboarding-next">
          <LinearGradient
            colors={["#8B5CF6", "#EC4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cta}
          >
            <Text style={styles.ctaText}>{idx === slides.length - 1 ? "Get Started" : "Next"}</Text>
            <Feather name="arrow-right" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 24 },
  brand: { fontSize: 18, fontWeight: "800", color: "#1F1A24", letterSpacing: -0.3 },
  skip: { color: "#8B5CF6", fontWeight: "600" },
  hero: {
    height: 360,
    borderRadius: 32,
    marginBottom: 32,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  heroIcon: {
    width: 120,
    height: 120,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  bubble1: { position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(255,255,255,0.4)" },
  bubble2: { position: "absolute", bottom: -40, left: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.3)" },
  title: { fontSize: 34, fontWeight: "800", color: "#1F1A24", letterSpacing: -1, lineHeight: 40 },
  sub: { fontSize: 16, color: "#6B7280", marginTop: 12, lineHeight: 24 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginVertical: 24 },
  dot: { height: 8, borderRadius: 4, marginHorizontal: 3 },
  cta: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 18, borderRadius: 999 },
  ctaText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
