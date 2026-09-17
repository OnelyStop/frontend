import { z } from "zod";

export const feedbackInput = z.object({
  subject: z.string().trim().min(3).max(140),
  message: z.string().trim().min(10).max(5000),
  // Only a same-site path is kept: it says where the user was, and a full URL there would be a stored link someone might click.
  pagePath: z
    .string()
    .trim()
    .max(300)
    .regex(/^\/(?!\/)[^\s]*$/)
    .optional(),
});

export type FeedbackInput = z.infer<typeof feedbackInput>;

export type SubmitOutcome =
  { ok: true; id: string } | { ok: false; reason: "daily_limit" };
