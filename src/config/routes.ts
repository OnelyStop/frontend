// Everything not listed here is public and server-rendered for SEO. The proxy
// sends these to /login; robots.txt keeps crawlers off them.
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
