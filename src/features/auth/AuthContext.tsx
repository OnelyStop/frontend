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
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type AuthResult = { error: string | null; needsConfirmation?: boolean };

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    avatar?: string | null,
    /** Onboarding's answers; the signup trigger validates their shape before writing the profile. */
    prefs?: { examBoard?: string | null; targetYear?: number | null },
  ) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  resendConfirmation: (email: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// Both must be in Supabase's redirect allow-list, or it silently uses Site URL.
const at = (path: string) =>
  typeof window !== "undefined" ? `${window.location.origin}${path}` : "";

const AUTH_CALLBACK_URL = at("/auth/callback");

// Comes back as {{ .RedirectTo }}, so a mail returns to the origin that sent it.
const AUTH_CONFIRM_URL = at("/auth/confirm");

const NOT_CONFIGURED: AuthResult = {
  error: "Signing in is unavailable at the moment. Please try again shortly.",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

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

      signUp: async (email, password, fullName, avatar, prefs) => {
        if (!supabase) return NOT_CONFIGURED;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              ...(avatar ? { avatar } : {}),
              ...(prefs?.examBoard ? { exam_board: prefs.examBoard } : {}),
              ...(prefs?.targetYear ? { target_year: prefs.targetYear } : {}),
            },
            emailRedirectTo: AUTH_CONFIRM_URL,
          },
        });
        if (error) return { error: error.message };
        // Supabase returns a user with no session when email confirmation is on.
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
          redirectTo: AUTH_CONFIRM_URL,
        });
        return { error: error?.message ?? null };
      },

      updatePassword: async (password) => {
        if (!supabase) return NOT_CONFIGURED;
        const { error } = await supabase.auth.updateUser({ password });
        return { error: error?.message ?? null };
      },

      resendConfirmation: async (email) => {
        if (!supabase) return NOT_CONFIGURED;
        const { error } = await supabase.auth.resend({
          type: "signup",
          email,
          options: { emailRedirectTo: AUTH_CONFIRM_URL },
        });
        return { error: error?.message ?? null };
      },

      signOut: async () => {
        await supabase?.auth.signOut();
      },
    }),
    [session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
