import React, { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";

export default function GoogleCallbackScreen() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      // The parent window interval handles parsing hash and closing this popup window
      console.log("Google Auth Callback reached:", window.location.hash);
    }
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#EA4335" />
      <Text style={styles.text}>Authenticating with Google...</Text>
      <Text style={styles.subtext}>This window will close automatically.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  text: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 18,
    marginTop: 16,
  },
  subtext: {
    color: "#9CA3AF",
    fontSize: 14,
    marginTop: 6,
  },
});
