import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getMarkerLabel,
  type ExamBoard,
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
  const [subject, setSubject] = useState<Subject>("Biology");
  const [board, setBoard] = useState<ExamBoard>("OCR");
  const [profile, setProfile] = useState<UserProfile>({
    name: "Alex Morgan",
    email: "alex@onelystopp.app",
    school: "Northbridge Sixth Form",
    examYear: "2026",
    bio: "Aiming for A* in Biology — focusing on genetics and bioenergetics this term.",
  });
  const [settings, setSettings] = useState<UserSettings>({
    emailDigest: true,
    weeklyReport: true,
    practiceReminders: true,
    soundEffects: false,
    reduceMotion: false,
  });

  const value = useMemo(
    () => ({
      subject,
      board,
      setSubject,
      setBoard,
      markerLabel: getMarkerLabel(subject),
      streak: 12,
      points: 1840,
      profile,
      setProfile,
      settings,
      setSettings,
      initials: getInitials(profile.name),
    }),
    [subject, board, profile, settings],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
