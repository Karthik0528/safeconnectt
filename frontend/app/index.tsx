import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../src/auth";

const { width } = Dimensions.get("window");

export default function Splash() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.loop(
        Animated.timing(ring, { toValue: 1, duration: 2400, useNativeDriver: true })
      ),
    ]).start();
  }, [scale, opacity, ring]);

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      if (user) router.replace("/(tabs)/home");
      else router.replace("/onboarding");
    }, 1300);
    return () => clearTimeout(t);
  }, [loading, user, router]);

  const ringScale = ring.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] });
  const ringOpacity = ring.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });

  return (
    <LinearGradient colors={["#1A0B2E", "#3B0764", "#6B21A8"]} style={styles.container}>
      <View style={styles.center}>
        <Animated.View
          style={[
            styles.ring,
            { transform: [{ scale: ringScale }], opacity: ringOpacity, position: "absolute" },
          ]}
        />
        <Animated.View
          style={[
            styles.logoWrap,
            { transform: [{ scale }], opacity },
          ]}
        >
          <LinearGradient colors={["#EC4899", "#8B5CF6"]} style={styles.logo}>
            <Feather name="shield" size={56} color="#fff" />
          </LinearGradient>
        </Animated.View>
        <Animated.Text style={[styles.title, { opacity }]} testID="splash-title">
          SafeConnect
        </Animated.Text>
        <Animated.Text style={[styles.sub, { opacity }]}>For women, by women — travel safer.</Animated.Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  logoWrap: { marginBottom: 24, shadowColor: "#EC4899", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 12 },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "rgba(236, 72, 153, 0.6)",
  },
  title: { color: "#fff", fontSize: 42, fontWeight: "800", letterSpacing: -1 },
  sub: { color: "rgba(255,255,255,0.75)", fontSize: 15, marginTop: 8, textAlign: "center" },
});
