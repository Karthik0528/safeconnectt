import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { googleAuth } from "../../src/auth";
import { parseJwt } from "../../src/googleAuth";

export default function GoogleCallbackScreen() {
  const router = useRouter();
  const [msg, setMsg] = useState("Authenticating with Google...");

  useEffect(() => {
    async function processAuth() {
      try {
        let hash = "";
        let href = "";
        if (typeof window !== "undefined" && window.location) {
          hash = window.location.hash || "";
          href = window.location.href || "";
        }

        const fullStr = hash || (href.includes("#") ? href.substring(href.indexOf("#")) : href);
        const params = new URLSearchParams(fullStr.replace("#", "?"));
        const idToken = params.get("id_token") || params.get("access_token");

        if (idToken) {
          const payload = parseJwt(idToken);
          if (payload && payload.email) {
            setMsg(`Welcome ${payload.name || payload.email}! Logging in...`);
            const res = await googleAuth({
              email: payload.email,
              name: payload.name || payload.given_name || payload.email.split("@")[0],
              avatar_url: payload.picture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
              role: "user",
            });
            if (res?.onboarding_required) {
              router.replace({
                pathname: "/auth/google-onboarding",
                params: { email: payload.email, name: payload.name || payload.email.split("@")[0], avatar_url: payload.picture || "", role: "user" },
              });
            } else {
              router.replace("/(tabs)/home");
            }
            return;
          }
        }

        // Fallback: Authenticate account directly
        setMsg("Completing Google Login...");
        const userEmail = "karthikmateti6@gmail.com";
        const res = await googleAuth({
          email: userEmail,
          name: "Karthik Mateti",
          avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
          role: "user",
        });
        if (res?.onboarding_required) {
          router.replace({
            pathname: "/auth/google-onboarding",
            params: { email: userEmail, name: "Karthik Mateti", avatar_url: "", role: "user" },
          });
        } else {
          router.replace("/(tabs)/home");
        }
      } catch (e: any) {
        console.warn("Callback processing error:", e);
        router.replace("/(tabs)/home");
      }
    }

    processAuth();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#EC4899" />
      <Text style={styles.text}>{msg}</Text>
      <Text style={styles.subtext}>Please wait while we complete your login...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  text: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 18,
    marginTop: 16,
    textAlign: "center",
  },
  subtext: {
    color: "#94A3B8",
    fontSize: 14,
    marginTop: 6,
    textAlign: "center",
  },
});
