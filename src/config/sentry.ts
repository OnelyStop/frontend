// A DSN authorises only event submission, so it ships in the bundle; the token never does.
export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN ?? "";

// Errors, not spans: tracing is what burns the free-tier quota, so it is off.
const rate = Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE);

export const SENTRY_TRACES_SAMPLE_RATE =
  Number.isFinite(rate) && rate >= 0 && rate <= 1 ? rate : 0;

// Vercel exposes the SHA to the bundle only under its own NEXT_PUBLIC_ name.
export const SENTRY_RELEASE =
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ??
  process.env.VERCEL_GIT_COMMIT_SHA ??
  undefined;

// Every preview build is NODE_ENV=production too, so without this a preview crash files the same GitHub issue a real one would.
export const SENTRY_ENVIRONMENT =
  process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.VERCEL_ENV ?? "development";

// Blockers drop ingest.sentry.io by hostname, and Sentry's own default of /monitoring is on the same lists.
export const SENTRY_RELAY_PATH = "/invigilator";

// A dropped connection is the visitor's network, not a defect — and when it is ours, the server reports the cause itself rather than this symptom.
export const SENTRY_IGNORE_ERRORS = [
  "ResizeObserver loop limit exceeded",
  "ResizeObserver loop completed with undelivered notifications",
  /^ChunkLoadError/,
  /Loading chunk [\w-]+ failed/,
  "Failed to fetch dynamically imported module",
  "Importing a module script failed",
  /^AbortError/,
  "Failed to fetch",
  "NetworkError when attempting to fetch resource",
  "The network connection was lost",
  "Load failed",
  "The operation was aborted",
  "Non-Error promise rejection captured",
];

export const SENTRY_DENY_URLS = [
  /^chrome-extension:\/\//,
  /^moz-extension:\/\//,
  /^safari-web-extension:\/\//,
];

/** What an alert rule filters on: `severity` decides whether a GitHub issue is filed, `area` decides who reads it. */
export const SENTRY_AREAS = [
  "billing",
  "auth",
  "attempts",
  "study",
  "community",
  "admin",
  "app",
] as const;

export type SentryArea = (typeof SENTRY_AREAS)[number];

const CRITICAL_AREAS: readonly SentryArea[] = ["billing", "auth"];

const AREA_BY_PREFIX: readonly (readonly [string, SentryArea])[] = [
  ["/api/v1/billing", "billing"],
  ["/upgrade", "billing"],
  ["/login", "auth"],
  ["/signup", "auth"],
  ["/auth", "auth"],
  ["/forgot-password", "auth"],
  ["/reset-password", "auth"],
  ["/settings", "auth"],
  ["/profile", "auth"],
  ["/api/v1/profile", "auth"],
  ["/drills", "attempts"],
  ["/mocks", "attempts"],
  ["/results", "attempts"],
  ["/descriptive", "attempts"],
  ["/attempt-map", "attempts"],
  ["/progress", "attempts"],
  ["/api/v1/descriptive", "attempts"],
  ["/study", "study"],
  ["/notes", "study"],
  ["/flashcards", "study"],
  ["/current-affairs", "study"],
  ["/api/v1/study", "study"],
  ["/api/v1/companion", "study"],
  ["/community", "community"],
  ["/api/v1/community", "community"],
  ["/admin", "admin"],
  ["/api/v1/admin", "admin"],
  ["/api/v1/internal", "admin"],
];

// Longest first, so /api/v1/descriptive cannot be answered by a shorter prefix that also matches.
const PREFIXES = [...AREA_BY_PREFIX].sort((a, b) => b[0].length - a[0].length);

const isArea = (value: unknown): value is SentryArea =>
  typeof value === "string" &&
  (SENTRY_AREAS as readonly string[]).includes(value);

export function pathOf(url: string): string {
  const rooted = url.startsWith("/")
    ? url
    : url.replace(/^[a-z]+:\/\/[^/]+/i, "");
  const cut = rooted.search(/[?#]/);
  return cut === -1 ? rooted : rooted.slice(0, cut);
}

export function areaForPath(path: string): SentryArea {
  const match = PREFIXES.find(
    ([prefix]) => path === prefix || path.startsWith(`${prefix}/`),
  );
  return match?.[1] ?? "app";
}

export type TaggableEvent = {
  level?: string;
  tags?: { [key: string]: unknown };
  transaction?: string;
  request?: { url?: string };
  fingerprint?: string[];
  exception?: { values?: { value?: string }[] };
};

// Drizzle puts the whole statement and its parameters in the message, so default grouping opens one issue per parameter set.
const SPLITS_PER_CALL = /^Failed query:/;

export function tagEvent(event: TaggableEvent): void {
  const declared = event.tags?.area;
  const area = isArea(declared)
    ? declared
    : areaForPath(pathOf(event.request?.url ?? event.transaction ?? ""));
  const critical = event.level === "fatal" || CRITICAL_AREAS.includes(area);
  event.tags = {
    ...event.tags,
    area,
    severity: critical ? "critical" : "normal",
  };
  // Everything else keeps Sentry's stack-trace grouping, which separates two real bugs better than any key written here.
  const message = event.exception?.values?.[0]?.value ?? "";
  if (!event.fingerprint && SPLITS_PER_CALL.test(message))
    event.fingerprint = ["failed-query", area];
}
