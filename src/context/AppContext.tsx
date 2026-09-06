"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MotionConfig } from "motion/react";
import { useAuth } from "@/features/auth/AuthContext";
import {
  getMarkerLabel,
  type ExamBoard,
  type Subject,
} from "@/data/navigation";
import type { Profile } from "@/features/profile/types";

export type UserProfile = {
  name: string;
  email: string;
  school: string;
  examYear: string;
  bio: string;
};

export type UserSettings = {
  reduceMotion: boolean;
};

type AppContextValue = {
  subject: Subject;
  board: ExamBoard;
  setSubject: (s: Subject) => void;
  setBoard: (b: ExamBoard) => void;
  markerLabel: string;
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  settings: UserSettings;
  setSettings: (s: UserSettings) => void;
  initials: string;
};

const AppContext = createContext<AppContextValue | null>(null);

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "A";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [subject, setSubject] = useState<Subject>("Quantitative Aptitude");
  const [board, setBoard] = useState<ExamBoard>("IBPS PO");
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    email: "",
    school: "",
    examYear: "",
    bio: "",
  });
  const [settings, setSettings] = useState<UserSettings>({
    reduceMotion: false,
  });

  // Display only — nothing is authorised from user_metadata.
  useEffect(() => {
    if (!user) return;
    setProfile((prev) => ({
      ...prev,
      name: user.user_metadata?.full_name || prev.name,
      email: user.email ?? prev.email,
    }));
  }, [user]);

  // The board Settings persists is what every surface reads, so the stored profile — not the "IBPS PO" default — has to win once it arrives.
  useEffect(() => {
    if (!user) return;
    const ac = new AbortController();
    fetch("/api/v1/profile", { signal: ac.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { profile?: Profile } | null) => {
        const stored = body?.profile;
        if (!stored) return;
        setBoard(stored.examBoard);
        setSubject(stored.defaultSection);
        setProfile((prev) => ({
          ...prev,
          name: stored.displayName || prev.name,
          school: stored.school ?? "",
          examYear: stored.targetYear ? String(stored.targetYear) : "",
          bio: stored.bio ?? "",
        }));
      })
      .catch(() => undefined);
    return () => ac.abort();
  }, [user]);

  const value = useMemo(
    () => ({
      subject,
      board,
      setSubject,
      setBoard,
      markerLabel: getMarkerLabel(board),
      profile,
      setProfile,
      settings,
      setSettings,
      initials: getInitials(profile.name),
    }),
    [subject, board, profile, settings],
  );

  // Mirrored onto <html> so the CSS `.press` utility, which cannot read React context, respects it.
  useEffect(() => {
    document.documentElement.toggleAttribute(
      "data-reduce-motion",
      settings.reduceMotion,
    );
  }, [settings.reduceMotion]);

  return (
    <AppContext.Provider value={value}>
      <MotionConfig reducedMotion={settings.reduceMotion ? "always" : "user"}>
        {children}
      </MotionConfig>
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
