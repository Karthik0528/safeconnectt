import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";

const getBaseUrl = () => {
  // 1. Web browser environment on PC: connect directly to local backend for instant 0ms response
  if (typeof window !== "undefined" && window.location?.hostname) {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://127.0.0.1:8000";
    }
    return `http://${host}:8000`;
  }

  if (Platform.OS === "web") {
    return "http://127.0.0.1:8000";
  }

  // 2. Mobile Native (Android USB ADB Reverse / Local LAN): Connect to PC backend
  if (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_BACKEND_URL) {
    const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL.replace(/\/$/, "");
    if (envUrl) {
      return envUrl;
    }
  }

  return "http://127.0.0.1:8000";
};

export const BASE = getBaseUrl();
console.log("Active API Base URL =", BASE);
export const API_BASE = `${BASE}/api`;

const TOKEN_KEY = "safeconnect_token";

export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}
export async function setToken(t: string) {
  await AsyncStorage.setItem(TOKEN_KEY, t);
}
export async function clearToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function api<T = any>(
  path: string,
  opts: { method?: string; body?: any; auth?: boolean; timeoutMs?: number } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Bypass-Tunnel-Reminder": "true",
    "ngrok-skip-browser-warning": "true",
  };
  if (opts.auth !== false) {
    const t = await getToken();
    if (t) headers["Authorization"] = `Bearer ${t}`;
  }

  const timeoutMs = opts.timeoutMs || 8000;

  const fetchWithTimeout = async (url: string) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: opts.method || "GET",
        headers,
        body: opts.body ? JSON.stringify(opts.body) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timer);
      return res;
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === "AbortError") {
        throw new Error("Connection timed out. Please check server status.");
      }
      throw err;
    }
  };

  try {
    const res = await fetchWithTimeout(`${API_BASE}${path}`);
    const text = await res.text();
    let data: any;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { detail: text };
    }
    if (!res.ok) {
      throw new Error(data?.detail || `Request failed (${res.status})`);
    }
    return data as T;
  } catch (error: any) {
    // Attempt fallback to 127.0.0.1:8000
    if (!API_BASE.includes("127.0.0.1")) {
      const fallbackUrl = `http://127.0.0.1:8000/api${path}`;
      try {
        const res = await fetchWithTimeout(fallbackUrl);
        const text = await res.text();
        let data: any;
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          data = { detail: text };
        }
        if (!res.ok) {
          throw new Error(data?.detail || `Request failed (${res.status})`);
        }
        return data as T;
      } catch {
        // preserve original error
      }
    }
    throw error;
  }
}
