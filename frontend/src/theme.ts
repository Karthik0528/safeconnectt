import { useColorScheme } from "react-native";

export const palette = {
  light: {
    background: "#FAFAFA",
    surface: "#FFFFFF",
    primary: "#8B5CF6",
    secondary: "#EC4899",
    text: "#1F1A24",
    textMuted: "#6B7280",
    border: "rgba(0, 0, 0, 0.06)",
    glassBg: "rgba(255, 255, 255, 0.75)",
    glassBorder: "rgba(255, 255, 255, 0.55)",
    success: "#10B981",
    error: "#EF4444",
    gradientPrimary: ["#8B5CF6", "#D946EF"] as [string, string],
    gradientSos: ["#EF4444", "#F43F5E"] as [string, string],
    gradientSoft: ["#FCE7F3", "#EDE9FE"] as [string, string],
    chipBg: "#F3F0FF",
  },
  dark: {
    background: "#0F0B15",
    surface: "#1A1523",
    primary: "#C084FC",
    secondary: "#F472B6",
    text: "#F3E8FF",
    textMuted: "#A1A1AA",
    border: "rgba(255, 255, 255, 0.08)",
    glassBg: "rgba(26, 21, 35, 0.6)",
    glassBorder: "rgba(255, 255, 255, 0.1)",
    success: "#34D399",
    error: "#F87171",
    gradientPrimary: ["#9333EA", "#DB2777"] as [string, string],
    gradientSos: ["#DC2626", "#E11D48"] as [string, string],
    gradientSoft: ["#2A1F3D", "#1A1523"] as [string, string],
    chipBg: "#2A1F3D",
  },
};

export type ThemeColors = typeof palette.light;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const radii = { sm: 8, md: 16, lg: 24, xl: 32, full: 9999 };

export function useTheme(): { colors: ThemeColors; isDark: boolean } {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  return { colors: isDark ? palette.dark : palette.light, isDark };
}
