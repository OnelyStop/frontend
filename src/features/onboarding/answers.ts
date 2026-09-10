import { z } from "zod";
import { EXAMS, type ExamBoard } from "@/data/navigation";
import { AVATAR_KEYS, type AvatarKey } from "@/features/profile/avatars";

export type Answers = {
  examBoard: ExamBoard | null;
  targetYear: number | null;
  name: string;
  avatar: AvatarKey | null;
};

export const EMPTY_ANSWERS: Answers = {
  examBoard: null,
  targetYear: null,
  name: "",
  avatar: null,
};

/** The years offered; "not sure yet" is a real answer, stored as null. */
export function targetYears(now = new Date()): number[] {
  const y = now.getFullYear();
  return [y, y + 1, y + 2];
}

// OAuth leaves the page, so the answers cross the redirect here and are cleared once applied.
const STASH_KEY = "onelystop:onboarding";

const stashed = z.object({
  examBoard: z.enum(EXAMS),
  targetYear: z.number().int().min(2000).max(2100).nullable(),
  name: z.string().max(80),
  avatar: z.enum(AVATAR_KEYS).nullable(),
});

export type StashedAnswers = z.infer<typeof stashed>;

export function stashAnswers(answers: Answers): void {
  if (!answers.examBoard) return;
  try {
    sessionStorage.setItem(
      STASH_KEY,
      JSON.stringify({ ...answers, examBoard: answers.examBoard }),
    );
  } catch {
    // A private window with storage blocked just loses the answers; signup still works.
  }
}

export function takeStashedAnswers(): StashedAnswers | null {
  try {
    const raw = sessionStorage.getItem(STASH_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(STASH_KEY);
    const parsed = stashed.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
