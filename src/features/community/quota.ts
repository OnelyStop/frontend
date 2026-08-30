export type PlanTier = "free" | "pro";

// Monthly post allowances per plan. Displayed client-side; the real check must
// happen server-side when posting is wired to the database — a client-side
// count is display only, never enforcement.
export const POST_QUOTA: Record<PlanTier, number> = {
  free: 5,
  pro: 15,
};
