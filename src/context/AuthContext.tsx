"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  fetchEnabledProviders,
  isSupabaseConfigured,
  supabase,
} from "../lib/supabase";

type AuthResult = { error: string | null; needsConfirmation?: boolean };

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  googleEnabled: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  resendConfirmation: (email: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// Every email/OAuth flow returns here; this exact URL must be in the
// Supabase project's redirect allow-list or it falls back to Site URL
export const AUTH_CALLBACK_URL =
  typeof window !== "undefined"
    ? `${window.location.origin}/auth/callback`
    : "";

const NOT_CONFIGURED: AuthResult = {
  error:
    "Authentication isn't configured yet — add your Supabase URL and anon key to .env.local.",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  // Ask the project which providers are on, so the OAuth button appears only
  // once Google is enabled in the dashboard — no redeploy needed
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    fetchEnabledProviders().then((providers) => {
      if (active) setGoogleEnabled(providers.google);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      configured: isSupabaseConfigured,
      googleEnabled,

      signUp: async (email, password, fullName) => {
        if (!supabase) return NOT_CONFIGURED;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: AUTH_CALLBACK_URL,
          },
        });
        if (error) return { error: error.message };
        // Supabase returns a user without a session when email confirmation
        // is on, which is the default for new projects
        return { error: null, needsConfirmation: !data.session };
      },

      signIn: async (email, password) => {
        if (!supabase) return NOT_CONFIGURED;
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        return { error: error?.message ?? null };
      },

      signInWithGoogle: async () => {
        if (!supabase) return NOT_CONFIGURED;
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: AUTH_CALLBACK_URL },
        });
        return { error: error?.message ?? null };
      },

      resetPassword: async (email) => {
        if (!supabase) return NOT_CONFIGURED;
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: AUTH_CALLBACK_URL,
        });
        return { error: error?.message ?? null };
      },

      resendConfirmation: async (email) => {
        if (!supabase) return NOT_CONFIGURED;
        const { error } = await supabase.auth.resend({
          type: "signup",
          email,
          options: { emailRedirectTo: AUTH_CALLBACK_URL },
        });
        return { error: error?.message ?? null };
      },

      signOut: async () => {
        await supabase?.auth.signOut();
      },
    }),
    [session, loading, googleEnabled],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
