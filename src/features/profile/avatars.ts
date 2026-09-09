// Preset marks, not uploads: only the key is stored, and an unknown one falls back to initials.

export const AVATAR_KEYS = [
  "indigo",
  "violet",
  "cyan",
  "amber",
  "rose",
  "moss",
] as const;

export type AvatarKey = (typeof AVATAR_KEYS)[number];

export function isAvatarKey(value: unknown): value is AvatarKey {
  return (
    typeof value === "string" &&
    (AVATAR_KEYS as readonly string[]).includes(value)
  );
}

type Look = { label: string; face: string; ink: string; wash: string };

export const AVATARS: Record<AvatarKey, Look> = {
  indigo: { label: "Indigo", face: "🧑🏻", ink: "#4f46e5", wash: "#eeecff" },
  violet: { label: "Violet", face: "👩🏽", ink: "#9333ea", wash: "#f4ebff" },
  cyan: { label: "Cyan", face: "🧑🏾", ink: "#0891b2", wash: "#e3f6fa" },
  amber: { label: "Amber", face: "👨🏼", ink: "#ea7317", wash: "#fdf0e3" },
  rose: { label: "Rose", face: "👩🏻", ink: "#db2777", wash: "#fdeaf3" },
  moss: { label: "Moss", face: "🧑🏽", ink: "#0f9d70", wash: "#e7f7f1" },
};
