// Everything not listed is public and server-rendered; the proxy sends these to /login.
export const PROTECTED_PREFIXES = [
  "/home",
  "/attempt-map",
  "/mocks",
  "/drills",
  "/descriptive",
  "/study",
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
