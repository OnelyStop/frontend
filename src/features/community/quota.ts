export type PlanTier = "free" | "pro";

// Display values; the quota itself is enforced in mutations.server.ts.
export const POST_QUOTA: Record<PlanTier, number> = {
  free: 5,
  pro: 15,
};
