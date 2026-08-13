import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import {
  FEATURE_MASTERY,
  getMarkerLabel,
  gradeFromMastery,
  railPositionFromMastery,
  type ExamBoard,
  type Grade,
  type Subject,
} from "../data/navigation";

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
  workingGrade: Grade;
  nextGrade: Grade | null;
  railPosition: number;
  examDaysLeft: number;
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
  const [subject, setSubject] = useState<Subject>("Biology");
  const [board, setBoard] = useState<ExamBoard>("OCR");
  const [profile, setProfile] = useState<UserProfile>({
    name: "Alex Morgan",
    email: "alex@onelystopp.app",
    school: "Northbridge Sixth Form",
    examYear: "2027",
    bio: "Aiming for A* in Biology — focusing on genetics and bioenergetics this term.",
  });

  // Seed identity from the signed-in account; the rest of the profile stays
  // local until there's a profiles table to read from
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

  const value = useMemo(() => {
    const masteryValues = Object.values(FEATURE_MASTERY);
    const overallMastery = Math.round(
      masteryValues.reduce((sum, v) => sum + v, 0) / masteryValues.length,
    );
    const { grade, next } = gradeFromMastery(overallMastery);

    // A-level exam season opens mid-May of the student's exam year
    const examDate = new Date(Number(profile.examYear), 4, 11);
    const examDaysLeft = Math.max(
      0,
      Math.ceil((examDate.getTime() - Date.now()) / 86_400_000),
    );

    return {
      subject,
      board,
      setSubject,
      setBoard,
      markerLabel: getMarkerLabel(subject),
      streak: 12,
      points: 1840,
      mastery: FEATURE_MASTERY,
      overallMastery,
      workingGrade: grade,
      nextGrade: next,
      railPosition: railPositionFromMastery(overallMastery),
      examDaysLeft,
      profile,
      setProfile,
      settings,
      setSettings,
      initials: getInitials(profile.name),
    };
  }, [subject, board, profile, settings]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
