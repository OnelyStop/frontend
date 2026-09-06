// Local-only escape hatch, dead in a production build. Never NEXT_PUBLIC_.
export const AUTH_DISABLED =
  process.env.AUTH_DISABLED === "true" && process.env.NODE_ENV !== "production";
