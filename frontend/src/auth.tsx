import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, getToken, setToken, clearToken } from "./api";
import { realtimeSync } from "./realtime";

export type EmergencyContact = {
  name: string;
  phone: string;
  relation: string;
};

export type User = {
  id: string;
  name: string;
  nickname?: string;
  email: string;

  role: "user" | "guide" | "admin";
  gender: string;
  dob: string;
  age: number;
  phone: string;
  state: string;
  district: string;
  city: string;
  emergency_contact: EmergencyContact;
  avatar_url?: string;
  government_id?: string;
  selfie?: string;
  verified: boolean;
  verification_status: "pending" | "approved" | "rejected";
  status: "active" | "suspended";
  bio: string;
  interests: string[];
  languages: string[];
  safety_score: number;
  countries_visited: number;
  trips_count: number;
  rating: number;
  is_guide?: boolean;
  guide_id?: string | null;
  guide_id_num?: string;
  tourism_id?: string;
  guide_govt_id?: string;
  address_proof?: string;
  experience_years?: number;
  certifications?: string[];
  services?: string[];
  availability?: string;
  price_per_day?: number;
  created_at: string;
};

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  userSignup: (payload: any) => Promise<void>;
  guideSignup: (payload: any) => Promise<void>;
  googleAuth: (payload: { email: string; name: string; avatar_url?: string; role?: string }) => Promise<{ onboarding_required?: boolean }>;
  completeGoogleOnboarding: (payload: any) => Promise<void>;
  sendOtp: (email: string) => Promise<string>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateProfile: (patch: Partial<User>) => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const t = await getToken();
    if (!t) {
      setUser(null);
      return;
    }
    try {
      const u = await api<User>("/auth/me");
      setUser(u);
    } catch {
      await clearToken();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  // Real-time synchronization for verification badge and profile updates
  useEffect(() => {
    const unsubscribe = realtimeSync.subscribe((event, data) => {
      if (
        event === "account_verified" ||
        event === "account_rejected" ||
        event === "badge_toggled" ||
        event === "account_suspended" ||
        event === "account_restored" ||
        event === "profile_updated"
      ) {
        if (!user || user.id === data.user_id) {
          refresh();
        }
      }
    });
    return () => unsubscribe();
  }, [user, refresh]);

  const login = async (email: string, password: string) => {
    const r = await api<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    await setToken(r.token);
    setUser(r.user);
  };

  const adminLogin = async (email: string, password: string) => {
    const r = await api<{ token: string; user: User }>("/admin/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    await setToken(r.token);
    setUser(r.user);
  };

  const userSignup = async (payload: any) => {
    const r = await api<{ token: string; user: User }>("/auth/signup", {
      method: "POST",
      body: payload,
      auth: false,
    });
    await setToken(r.token);
    setUser(r.user);
  };

  const guideSignup = async (payload: any) => {
    const r = await api<{ token: string; user: User }>("/auth/guide-signup", {
      method: "POST",
      body: payload,
      auth: false,
    });
    await setToken(r.token);
    setUser(r.user);
  };

  const googleAuth = async (payload: { email: string; name: string; avatar_url?: string; role?: string }) => {
    const r = await api<{ token?: string; user?: User; onboarding_required?: boolean }>("/auth/google", {
      method: "POST",
      body: payload,
      auth: false,
    });
    if (r.onboarding_required) {
      return { onboarding_required: true };
    }
    if (r.token && r.user) {
      await setToken(r.token);
      setUser(r.user);
    }
    return { onboarding_required: false };
  };

  const completeGoogleOnboarding = async (payload: any) => {
    const r = await api<{ token: string; user: User }>("/auth/complete-google-onboarding", {
      method: "POST",
      body: payload,
      auth: false,
    });
    await setToken(r.token);
    setUser(r.user);
  };

  const sendOtp = async (email: string) => {
    const r = await api<{ ok: boolean; message: string; otp?: string }>("/auth/send-otp", {
      method: "POST",
      body: { email },
      auth: false,
    });
    return r.otp || "";
  };

  const verifyOtp = async (email: string, otp: string) => {
    await api<{ ok: boolean; message: string }>("/auth/verify-otp", {
      method: "POST",
      body: { email, otp },
      auth: false,
    });
  };

  const logout = async () => {
    await clearToken();
    setUser(null);
  };

  const updateProfile = async (patch: Partial<User>) => {
    const u = await api<User>("/auth/me", { method: "PATCH", body: patch });
    setUser(u);
  };

  return (
    <Ctx.Provider
      value={{
        user,
        loading,
        login,
        adminLogin,
        userSignup,
        guideSignup,
        googleAuth,
        completeGoogleOnboarding,
        sendOtp,
        verifyOtp,
        logout,
        refresh,
        updateProfile,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
