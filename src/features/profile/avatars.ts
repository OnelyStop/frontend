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

type Look = { label: string; ink: string; wash: string; brow: number };

export const AVATARS: Record<AvatarKey, Look> = {
  indigo: { label: "Indigo", ink: "#4f46e5", wash: "#eeecff", brow: 0 },
  violet: { label: "Violet", ink: "#9333ea", wash: "#f4ebff", brow: -2 },
  cyan: { label: "Cyan", ink: "#0891b2", wash: "#e3f6fa", brow: 2 },
  amber: { label: "Amber", ink: "#ea7317", wash: "#fdf0e3", brow: -1 },
  rose: { label: "Rose", ink: "#db2777", wash: "#fdeaf3", brow: 1 },
  moss: { label: "Moss", ink: "#0f9d70", wash: "#e7f7f1", brow: 0 },
};
