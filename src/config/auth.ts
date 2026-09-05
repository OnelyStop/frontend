// Local-only escape hatch. Refuses to engage in a production build, so a stray
// env var on a deployed instance cannot turn it on. Never NEXT_PUBLIC_.
export const AUTH_DISABLED =
  process.env.AUTH_DISABLED === "true" && process.env.NODE_ENV !== "production";
