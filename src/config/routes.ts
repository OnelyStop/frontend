// Everything not listed is public and server-rendered; the proxy sends these to /login.
export const PROTECTED_PREFIXES = [
  "/today",
  "/attempt-map",
  "/mocks",
  "/drills",
  "/descriptive",
  // /study is absent on purpose: public for search, and it gates its own bodies.
  "/progress",
  "/notes",
  "/flashcards",
  "/current-affairs",
  "/community",
  "/upgrade",
  "/profile",
  "/settings",
  "/admin",
  "/design",
] as const;
