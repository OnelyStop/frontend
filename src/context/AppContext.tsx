"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/features/auth/AuthContext";
import {
  FEATURE_MASTERY,
  getMarkerLabel,
  bandFromScore,
  railPositionFromMastery,
  type ExamBoard,
  type Band,
  type Subject,
} from "@/data/navigation";

export type UserProfile = {
  name: string;
  email: string;
  school: string;
  examYear: string;
  bio: string;
};

export type UserSettings = {
  emailDigest: boolean;
  weeklyReport: boolean;
  practiceReminders: boolean;
  soundEffects: boolean;
  reduceMotion: boolean;
};

type AppContextValue = {
  subject: Subject;
  board: ExamBoard;
  setSubject: (s: Subject) => void;
  setBoard: (b: ExamBoard) => void;
  markerLabel: string;
  streak: number;
  points: number;
  mastery: Record<string, number>;
  overallMastery: number;
  workingGrade: Band;
  nextGrade: Band | null;
  railPosition: number;
  examDaysLeft: number | null;
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
    name: "Aarav Mehta",
    email: "alex@onelystop.app",
    school: "Self-study",
    examYear: "2026",
    bio: "Targeting IBPS PO 2026. Weakest on English; strongest on Computer Aptitude.",
  });

  useEffect(() => {
    if (!user) return;
    setProfile((prev) => ({
      ...prev,
      name: user.user_metadata?.full_name || prev.name,
      email: user.email ?? prev.email,
    }));
  }, [user]);
  const [settings, setSettings] = useState<UserSettings>({
    emailDigest: true,
    weeklyReport: true,
    practiceReminders: true,
    soundEffects: false,
    reduceMotion: false,
  });

  // Not computed in render: prerender happens at build time, so a day-boundary
  // drift against the client would be a hydration mismatch.
  const [examDaysLeft, setExamDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    const examDate = new Date(Number(profile.examYear), 4, 11);
    setExamDaysLeft(
      Math.max(0, Math.ceil((examDate.getTime() - Date.now()) / 86_400_000)),
    );
  }, [profile.examYear]);

  const value = useMemo(() => {
    const masteryValues = Object.values(FEATURE_MASTERY);
    const overallMastery = Math.round(
      masteryValues.reduce((sum, v) => sum + v, 0) / masteryValues.length,
    );
    const { band, next } = bandFromScore(overallMastery);

    return {
      subject,
      board,
      setSubject,
      setBoard,
      markerLabel: getMarkerLabel(board),
      streak: 12,
      points: 1840,
      mastery: FEATURE_MASTERY,
      overallMastery,
      workingGrade: band,
      nextGrade: next,
      railPosition: railPositionFromMastery(overallMastery),
      examDaysLeft,
      profile,
      setProfile,
      settings,
      setSettings,
      initials: getInitials(profile.name),
    };
  }, [subject, board, profile, settings, examDaysLeft]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
