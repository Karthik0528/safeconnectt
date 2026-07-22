// Real Google OAuth 2.0 Integration Helper for saFeConnect

declare global {
  interface Window {
    google?: any;
  }
}

export const HARDCODED_GOOGLE_CLIENT_ID = "974036452041-pvtp9not13i0o9t56t35mh5ohshl6i17.apps.googleusercontent.com";

export function getGoogleClientId(): string {
  if (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_GOOGLE_CLIENT_ID) {
    return process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID.trim();
  }
  if (typeof window !== "undefined" && window.localStorage) {
    const saved = window.localStorage.getItem("safeconnect_google_client_id");
    if (saved) return saved.trim();
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

  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      return reject(new Error("Google Sign-In requires browser environment"));
    }

    const width = 500;
    const height = 620;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(window.location.origin + "/auth/google-callback")}` +
      `&response_type=token%20id_token` +
      `&scope=${encodeURIComponent("openid email profile")}` +
      `&prompt=select_account` +
      `&nonce=${Math.random().toString(36).substring(2)}`;

    const popup = window.open(
      googleAuthUrl,
      "GoogleSignInPopup",
      `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,status=yes`
    );

    if (!popup) {
      return reject(new Error("Popup blocked by browser. Please allow popups for localhost."));
    }

    const interval = setInterval(() => {
      try {
        if (popup.closed) {
          clearInterval(interval);
          reject(new Error("Google Sign-In window closed"));
        }
        if (
          popup.location.href.includes("/auth/google-callback") ||
          popup.location.hash.includes("id_token") ||
          popup.location.hash.includes("access_token")
        ) {
          const hash = popup.location.hash;
          popup.close();
          clearInterval(interval);

          const params = new URLSearchParams(hash.replace("#", "?"));
          const idToken = params.get("id_token");
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
          reject(new Error("Google Authentication completed."));
        }
      } catch (e) {
        // Cross-origin read during Google login redirect is expected
      }
    }, 500);
  });
}
