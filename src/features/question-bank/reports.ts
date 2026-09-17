import { z } from "zod";

// Client-safe: the modal and the API route share this list.

export const REPORT_REASONS = [
  { value: "answer_wrong", label: "The answer is wrong" },
  { value: "wrong_section", label: "It is in the wrong section" },
  { value: "text_broken", label: "The question text is broken" },
  { value: "options_wrong", label: "The options are wrong or missing" },
  { value: "other", label: "Something else" },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["value"];

export const REASON_LABEL = Object.fromEntries(
  REPORT_REASONS.map((r) => [r.value, r.label]),
) as Record<ReportReason, string>;

const NOTE_MAX = 300;

export const reportCreate = z.object({
  reason: z.enum(
    REPORT_REASONS.map((r) => r.value) as [ReportReason, ...ReportReason[]],
  ),
  note: z.string().trim().max(NOTE_MAX).optional(),
});
