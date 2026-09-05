import { z } from "zod";
import {
  EXAMS,
  SECTIONS,
  type ExamBoard,
  type Subject,
} from "@/data/navigation";

// Client-safe: settings-view imports these, so nothing here may reach for
// drizzle or `server-only`.

export const profileUpdate = z
  .object({
    displayName: z.string().trim().max(80).nullable(),
    bio: z.string().trim().max(500).nullable(),
    school: z.string().trim().max(120).nullable(),
    targetYear: z.number().int().min(2000).max(2100).nullable(),
    examBoard: z.enum(EXAMS),
    defaultSection: z.enum(SECTIONS),
  })
  .partial()
  .strict();

export type ProfileUpdate = z.infer<typeof profileUpdate>;

export type Profile = {
  id: string;
  displayName: string | null;
  bio: string | null;
  country: string;
  school: string | null;
  targetYear: number | null;
  examBoard: ExamBoard;
  defaultSection: Subject;
  updatedAt: Date;
};
