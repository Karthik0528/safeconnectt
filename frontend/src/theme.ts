import { useColorScheme } from "react-native";

export const palette = {
  light: {
    background: "#180B13",
    surface: "#27151F",
    primary: "#F0A1CE",
    secondary: "#F8BA7C",
    accent: "#F6DDE7",
    text: "#FFF0F4",
    textMuted: "#C9B4BE",
    border: "#513044",
    glassBg: "rgba(25, 10, 18, 0.86)",
    glassBorder: "rgba(240, 161, 206, 0.26)",
    success: "#34D399",
    error: "#EF535A",
    gradientPrimary: ["#D42C74", "#B32060"] as [string, string],
    gradientHero: ["#3A1F30", "#2A1521", "#180B13"] as any,
    gradientSos: ["#EE535B", "#E64958"] as [string, string],
    gradientSoft: ["#33202A", "#25141E"] as [string, string],
    chipBg: "#3B1F2E",
  },
  dark: {
    background: "#180B13",
    surface: "#27151F",
    primary: "#F9A8D4",
    secondary: "#FDBA74",
    accent: "#F6DDE7",
    text: "#FFF0F4",
    textMuted: "#C9B4BE",
    border: "#513044",
    glassBg: "rgba(25, 10, 18, 0.86)",
    glassBorder: "rgba(240, 161, 206, 0.26)",
    success: "#34D399",
    error: "#EF535A",
    gradientPrimary: ["#D42C74", "#B32060"] as [string, string],
    gradientHero: ["#3A1F30", "#2A1521", "#180B13"] as any,
    gradientSos: ["#EE535B", "#E64958"] as [string, string],
    gradientSoft: ["#33202A", "#25141E"] as [string, string],
    chipBg: "#3B1F2E",
  },
};

export type ThemeColors = typeof palette.light;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const radii = { sm: 8, md: 16, lg: 24, xl: 32, full: 9999 };

export function useTheme(): { colors: ThemeColors; isDark: boolean } {
  const scheme = useColorScheme();
  const isDark = scheme !== "light";
  return { colors: isDark ? palette.dark : palette.light, isDark };
}

export const APP_NAME = "saFeConnect";
export const APP_TAGLINE = "Female travel connections, safer together.";
