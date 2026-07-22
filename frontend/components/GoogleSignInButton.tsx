import React from "react";
import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme, radii } from "../src/theme";

type Props = {
  onPress: () => void;
  title?: string;
  loading?: boolean;
};

export function GoogleSignInButton({ onPress, title = "Sign in with Google", loading }: Props) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={loading}
      style={[
        styles.button,
        {
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.googleBadge}>
          <Text style={styles.googleG}>G</Text>
        </View>
        <Text style={[styles.text, { color: colors.text }]}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: radii.full,
    borderWidth: 1.5,
    marginVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  googleBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#EA4335",
    alignItems: "center",
    justifyContent: "center",
  },
  googleG: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 14,
  },
  text: {
    fontSize: 15,
    fontWeight: "700",
  },
});
