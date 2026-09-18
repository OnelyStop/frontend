// Everything not listed is public and server-rendered; the proxy sends these to /login.
export const PROTECTED_PREFIXES = [
  "/today",
  "/attempt-map",
  "/mocks",
  "/drills",
  "/descriptive",
  // /study is absent on purpose: public for search, and it gates its own bodies.
  "/progress",
  // Both are per-user reads that answered empty when signed out, so the proxy never sent them to /login.
  "/notifications",
  "/results",
  "/notes",
  "/flashcards",
  // /current-affairs is absent on purpose: a signed-out reader gets the free plan's own delayed window.
  "/community",
  "/upgrade",
  "/profile",
  "/settings",
  "/admin",
  "/design",
] as const;
