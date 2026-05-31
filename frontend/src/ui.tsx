import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import { useTheme, radii, spacing } from "./theme";

export function GradientButton({
  title,
  onPress,
  icon,
  loading,
  testID,
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Feather.glyphMap;
  loading?: boolean;
  testID?: string;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[{ borderRadius: radii.full, overflow: "hidden", opacity: disabled ? 0.5 : 1 }, style]}
    >
      <LinearGradient
        colors={colors.gradientPrimary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingVertical: 17,
          paddingHorizontal: 24,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            {icon && <Feather name={icon} size={18} color="#fff" />}
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>
              {title}
            </Text>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

export function GhostButton({
  title,
  onPress,
  icon,
  testID,
  style,
}: {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Feather.glyphMap;
  testID?: string;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        {
          paddingVertical: 14,
          paddingHorizontal: 20,
          borderRadius: radii.full,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        },
        style,
      ]}
    >
      {icon && <Feather name={icon} size={18} color={colors.text} />}
      <Text style={{ color: colors.text, fontWeight: "600", fontSize: 15 }}>{title}</Text>
    </TouchableOpacity>
  );
}

export function GlassCard({
  children,
  style,
  testID,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}) {
  const { colors, isDark } = useTheme();
  return (
    <BlurView
      testID={testID}
      intensity={isDark ? 30 : 60}
      tint={isDark ? "dark" : "light"}
      style={[
        {
          borderRadius: radii.lg,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: colors.glassBorder,
          backgroundColor: colors.glassBg,
          padding: spacing.lg,
        },
        style,
      ]}
    >
      {children}
    </BlurView>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, letterSpacing: -0.3 }}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={onAction} testID={`section-action-${title.toLowerCase().replace(/\s+/g, "-")}`}>
          <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 13 }}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function Chip({ label, active, onPress, testID }: { label: string; active?: boolean; onPress?: () => void; testID?: string }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: radii.full,
        backgroundColor: active ? colors.primary : colors.chipBg,
        marginRight: 8,
      }}
    >
      <Text style={{ color: active ? "#fff" : colors.text, fontWeight: "800", fontSize: 14 }}>{label}</Text>
    </TouchableOpacity>
  );
}

export function VerifiedBadge({ size = 14 }: { size?: number }) {
  return (
    <View
      style={{
        width: size + 4,
        height: size + 4,
        borderRadius: 999,
        backgroundColor: "#8B5CF6",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Feather name="check" size={size - 2} color="#fff" />
    </View>
  );
}

export function Avatar({ uri, size = 48, testID }: { uri?: string | null; size?: number; testID?: string }) {
  const { colors } = useTheme();
  const fallback = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80";
  return (
    <View
      testID={testID}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: "hidden",
        backgroundColor: colors.chipBg,
      }}
    >
      {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
      <Img uri={uri || fallback} size={size} />
    </View>
  );
}

function Img({ uri, size }: { uri: string; size: number }) {
  const { Image } = require("react-native");
  return <Image source={{ uri }} style={{ width: size, height: size }} />;
}

export const styles = StyleSheet.create({
  inputWrap: {
    backgroundColor: "transparent",
  },
});
