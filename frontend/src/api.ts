import AsyncStorage from "@react-native-async-storage/async-storage";

const getBaseUrl = () => {
  if (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location?.hostname) {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host.startsWith("192.168.") || host.startsWith("10.") || host.startsWith("172.")) {
      return `http://${host}:8000`;
    }
  }
  return "http://localhost:8000";
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
  opts: { method?: string; body?: any; auth?: boolean } = {}
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.auth !== false) {
    const t = await getToken();
    if (t) headers["Authorization"] = `Bearer ${t}`;
  }
  
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: opts.method || "GET",
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
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
    // If connection to current API_BASE failed and it was localhost, attempt fallback to 127.0.0.1:8000
    if (error.message && (error.message.includes("Failed to fetch") || error.message.includes("Network request failed"))) {
      if (!API_BASE.includes("127.0.0.1")) {
        const fallbackUrl = `http://127.0.0.1:8000/api${path}`;
        try {
          const res = await fetch(fallbackUrl, {
            method: opts.method || "GET",
            headers,
            body: opts.body ? JSON.stringify(opts.body) : undefined,
          });
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
    }
    throw error;
  }
}
