import React from "react";
import { Tabs } from "expo-router";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../src/theme";
import { useAuth } from "../../src/auth";
import { useRouter } from "expo-router";
import { useEffect } from "react";

const ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  home: "home",
  discover: "compass",
  sos: "alert-octagon",
  chat: "message-circle",
  profile: "user",
};

function FloatingTabBar({ state, descriptors, navigation }: any) {
  const { colors, isDark } = useTheme();
  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <BlurView
        intensity={isDark ? 40 : 70}
        tint={isDark ? "dark" : "light"}
        style={[
          styles.bar,
          { borderColor: colors.glassBorder, backgroundColor: colors.glassBg },
        ]}
      >
        {state.routes.map((route: any, idx: number) => {
          const focused = state.index === idx;
          const onPress = () => {
            const event = navigation.emit({ type: "tabPress", target: route.key });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          if (route.name === "sos") {
            return (
              <TouchableOpacity
                key={route.key}
                testID="tab-sos"
                onPress={onPress}
                activeOpacity={0.85}
                style={styles.sosWrap}
              >
                <LinearGradient
                  colors={["#EF4444", "#F43F5E"]}
                  style={styles.sosBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Feather name="alert-octagon" size={26} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              testID={`tab-${route.name}`}
              style={styles.item}
              activeOpacity={0.7}
            >
              <Feather
                name={ICONS[route.name] || "circle"}
                size={22}
                color={focused ? colors.primary : colors.textMuted}
              />
              <Text
                style={{
                  fontSize: 10,
                  marginTop: 4,
                  color: focused ? colors.primary : colors.textMuted,
                  fontWeight: focused ? "700" : "500",
                }}
              >
                {route.name === "home"
                  ? "Home"
                  : route.name === "discover"
                  ? "Discover"
                  : route.name === "chat"
                  ? "Chat"
                  : "Profile"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
}

export default function TabsLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [user, loading, router]);

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="discover" />
      <Tabs.Screen name="sos" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: Platform.OS === "ios" ? 28 : 16,
    alignItems: "center",
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    width: "100%",
    overflow: "hidden",
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  item: { alignItems: "center", justifyContent: "center", flex: 1, paddingVertical: 6 },
  sosWrap: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: -28 },
  sosBtn: {
    width: 60,
    height: 60,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#fff",
    shadowColor: "#EF4444",
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
});
