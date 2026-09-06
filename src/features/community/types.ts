import { z } from "zod";
import { SECTIONS, type Subject } from "@/data/navigation";

export const SORTS = ["stuck", "new"] as const;
export type Sort = (typeof SORTS)[number];

export const PAGE_SIZE = 20;

export const doubtQuery = z.object({
  section: z.enum(SECTIONS).optional(),
  sort: z.enum(SORTS).default("stuck"),
  cursor: z.string().optional(),
});

export const doubtCreate = z.object({
  section: z.enum(SECTIONS),
  topic: z.string().trim().min(2).max(80),
  title: z.string().trim().min(10).max(160),
  body: z.string().trim().min(20).max(4000),
});

export type DoubtQuery = z.infer<typeof doubtQuery>;
export type DoubtCreate = z.infer<typeof doubtCreate>;

export type Doubt = {
  id: string;
  section: Subject;
  topic: string;
  title: string;
  body: string;
  author: string;
  createdAt: string;
  stuckCount: number;
  stuckByMe: boolean;
};

export type DoubtPage = {
  doubts: Doubt[];
  nextCursor: string | null;
};
