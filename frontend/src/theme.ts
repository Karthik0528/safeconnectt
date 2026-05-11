import { useColorScheme } from "react-native";

// Lighter, softer feminine palette: blush, peach, rose, cream.
export const palette = {
  light: {
    background: "#FFF8F5",
    surface: "#FFFFFF",
    primary: "#F472B6",       // soft rose pink
    secondary: "#FB923C",     // warm peach
    accent: "#F9A8D4",        // pastel pink
    text: "#3D2A33",          // warm dark, not harsh black
    textMuted: "#8E7B85",
    border: "rgba(244, 114, 182, 0.12)",
    glassBg: "rgba(255, 255, 255, 0.78)",
    glassBorder: "rgba(255, 200, 220, 0.55)",
    success: "#34D399",
    error: "#F87171",
    gradientPrimary: ["#FBCFE8", "#FECDD3"] as [string, string],   // pastel pink → blush
    gradientHero: ["#FFE4E6", "#FCE7F3", "#FFF1F2"] as any,        // cream-blush
    gradientSos: ["#FB7185", "#F472B6"] as [string, string],
    gradientSoft: ["#FFF1F2", "#FDF2F8"] as [string, string],
    chipBg: "#FFF1F5",
  },
  dark: {
    background: "#1F1318",
    surface: "#2A1B22",
    primary: "#F9A8D4",
    secondary: "#FDBA74",
    accent: "#FBCFE8",
    text: "#FFE4E6",
    textMuted: "#C0A6AF",
    border: "rgba(249, 168, 212, 0.18)",
    glassBg: "rgba(42, 27, 34, 0.65)",
    glassBorder: "rgba(249, 168, 212, 0.2)",
    success: "#34D399",
    error: "#F87171",
    gradientPrimary: ["#BE185D", "#9D174D"] as [string, string],
    gradientHero: ["#2A1B22", "#3D2330", "#4A2840"] as any,
    gradientSos: ["#DC2626", "#E11D48"] as [string, string],
    gradientSoft: ["#3D2330", "#2A1B22"] as [string, string],
    chipBg: "#3D2330",
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

/**
 * Branded title fragment splitter for "saFeConnect".
 * Use to render: <Text>sa<Text style={{color: primary}}>Fe</Text>Connect</Text>
 * Where "Fe" = Female travel connections.
 */
export const APP_NAME = "saFeConnect";
export const APP_TAGLINE = "Female travel connections, safer together.";
