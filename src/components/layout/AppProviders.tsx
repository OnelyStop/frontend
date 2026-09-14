"use client";

import type { ReactNode } from "react";
import { AppProvider, useApp } from "@/context/AppContext";
import { AuthProvider } from "@/features/auth/AuthContext";
import { SmoothScroll } from "./SmoothScroll";

function SettingsSmoothScroll() {
  const { settings } = useApp();
  return <SmoothScroll reduceMotion={settings.reduceMotion} />;
}

// Mounted per route group, not in the root layout: the marketing pages never read auth, and this is what keeps Supabase and Motion out of their bundle.
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AppProvider>
        <SettingsSmoothScroll />
        {children}
      </AppProvider>
    </AuthProvider>
  );
}

export function AuthOnlyProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SmoothScroll />
      {children}
    </AuthProvider>
  );
}
