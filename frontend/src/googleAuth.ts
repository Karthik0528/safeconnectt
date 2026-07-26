import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { BASE } from "./api";

declare global {
  interface Window {
    google?: any;
  }
}

export const HARDCODED_GOOGLE_CLIENT_ID = "974036452041-unhq8pg51d94th544hgcmeghkjpr43tt.apps.googleusercontent.com";

export function getGoogleCallbackUrl(): string {
  if (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_GOOGLE_REDIRECT_URI) {
    return process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI.trim();
  }
  if (Platform.OS !== "web") {
    // For native mobile apps (Android APK / iOS), construct callback with active BASE URL or custom scheme
    if (BASE && !BASE.includes("localhost") && !BASE.includes("127.0.0.1")) {
      return `${BASE}/auth/google-callback`;
    }
    return `${BASE}/auth/google-callback`;
  }
  return `${BASE}/auth/google-callback`;
}

export const CLOUDFLARE_CALLBACK_URL = getGoogleCallbackUrl();

export function getGoogleClientId(): string {
  if (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_GOOGLE_CLIENT_ID) {
    const envVal = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID.trim();
    if (envVal && !envVal.includes("pvtp9not13i0o9t56t35mh5ohshl6i17")) {
      return envVal;
    }
  }
  if (typeof window !== "undefined" && window.localStorage) {
    const saved = window.localStorage.getItem("safeconnect_google_client_id");
    if (saved && !saved.includes("pvtp9not13i0o9t56t35mh5ohshl6i17") && saved.includes("unhq8pg51d94th544hgcmeghkjpr43tt")) {
      return saved.trim();
    }
    // Purge old or stale client ID from localStorage
    window.localStorage.removeItem("safeconnect_google_client_id");
  }
  return HARDCODED_GOOGLE_CLIENT_ID;
}

export function setGoogleClientId(clientId: string) {
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem("safeconnect_google_client_id", clientId.trim());
  }
}

export function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export async function initiateGoogleSignIn(customClientId?: string): Promise<{ email: string; name: string; avatar_url: string }> {
  const clientId = customClientId || getGoogleClientId();
  const redirectUri = getGoogleCallbackUrl();

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=token%20id_token` +
    `&scope=${encodeURIComponent("openid email profile")}` +
    `&prompt=select_account` +
    `&nonce=${Math.random().toString(36).substring(2)}`;

  // Native Android / iOS mobile platform OAuth via WebBrowser.openAuthSessionAsync
  if (Platform.OS !== "web") {
    try {
      const result = await WebBrowser.openAuthSessionAsync(googleAuthUrl, redirectUri);
      if (result.type === "success" && result.url) {
        let idToken: string | null = null;
        const hashIdx = result.url.indexOf("#");
        const queryIdx = result.url.indexOf("?");

        if (hashIdx !== -1) {
          const hash = result.url.substring(hashIdx);
          const params = new URLSearchParams(hash.replace("#", "?"));
          idToken = params.get("id_token") || params.get("access_token");
        } else if (queryIdx !== -1) {
          const query = result.url.substring(queryIdx);
          const params = new URLSearchParams(query);
          idToken = params.get("id_token") || params.get("access_token");
        }

        if (idToken) {
          const payload = parseJwt(idToken);
          if (payload && payload.email) {
            return {
              email: payload.email,
              name: payload.name || payload.given_name || payload.email.split("@")[0],
              avatar_url: payload.picture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
            };
          }
        }
      }
      if (result.type === "cancel" || result.type === "dismiss") {
        throw new Error("Google Sign-In popup closed by user.");
      }
    } catch (err: any) {
      if (err?.message?.includes("closed") || err?.message?.includes("cancel")) {
        throw err;
      }
      console.warn("WebBrowser OAuth Note:", err?.message);
    }
  }

  // Web Environment (PC Browser window.open with postMessage listener)
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      return reject(new Error("Google Sign-In requires browser environment"));
    }

    const width = 500;
    const height = 620;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      googleAuthUrl,
      "GoogleSignInPopup",
      `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,status=yes`
    );

    if (!popup) {
      return reject(new Error("Popup blocked by browser. Please allow popups."));
    }

    // PostMessage Handler from backend HTML redirect page
    const messageHandler = (event: MessageEvent) => {
      try {
        if (event.data && event.data.type === "GOOGLE_AUTH_CALLBACK") {
          const hash = event.data.hash || "";
          window.removeEventListener("message", messageHandler);
          if (popup && !popup.closed) popup.close();

          const params = new URLSearchParams(hash.replace("#", "?"));
          const idToken = params.get("id_token") || params.get("access_token");
          if (idToken) {
            const payload = parseJwt(idToken);
            if (payload && payload.email) {
              resolve({
                email: payload.email,
                name: payload.name || payload.given_name || payload.email.split("@")[0],
                avatar_url: payload.picture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
              });
              return;
            }
          }
        }
      } catch (e) {
        // Ignore event listener error
      }
    };

    window.addEventListener("message", messageHandler);

    // Backup polling loop
    const interval = setInterval(() => {
      try {
        if (!popup || popup.closed) {
          clearInterval(interval);
          window.removeEventListener("message", messageHandler);
          reject(new Error("Google Sign-In window closed"));
          return;
        }

        let href = "";
        let hash = "";
        try {
          href = popup.location.href;
          hash = popup.location.hash || "";
        } catch (e) {
          // Safe catch for cross-origin DOM restriction while user is on accounts.google.com
        }

        if (href.includes("/auth/google-callback") || hash.includes("id_token") || hash.includes("access_token")) {
          popup.close();
          clearInterval(interval);
          window.removeEventListener("message", messageHandler);

          const fullStr = hash || (href.includes("#") ? href.substring(href.indexOf("#")) : "");
          const params = new URLSearchParams(fullStr.replace("#", "?"));
          const idToken = params.get("id_token") || params.get("access_token");
          if (idToken) {
            const payload = parseJwt(idToken);
            if (payload && payload.email) {
              resolve({
                email: payload.email,
                name: payload.name || payload.given_name || payload.email.split("@")[0],
                avatar_url: payload.picture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
              });
              return;
            }
          }
        }
      } catch (e) {
        // Safe catch
      }
    }, 500);
  });
}
