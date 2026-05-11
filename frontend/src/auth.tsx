import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, getToken, setToken, clearToken } from "./api";

export type User = {
  id: string;
  name: string;
  email: string;
  age: number;
  phone: string;
  bio: string;
  interests: string[];
  languages: string[];
  avatar_url?: string;
  verified: boolean;
  safety_score: number;
  countries_visited: number;
  trips_count: number;
  rating: number;
  is_guide?: boolean;
  guide_id?: string | null;
  created_at: string;
};

type AuthCtx = {
  user: User | null;
  loading: boolean;
  signup: (payload: any) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
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

  const login = async (email: string, password: string) => {
    const r = await api<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    await setToken(r.token);
    setUser(r.user);
  };

  const signup = async (payload: any) => {
    const r = await api<{ token: string; user: User }>("/auth/signup", {
      method: "POST",
      body: payload,
      auth: false,
    });
    await setToken(r.token);
    setUser(r.user);
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
    <Ctx.Provider value={{ user, loading, login, signup, logout, refresh, updateProfile }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
