// A DSN authorises only event submission, so it ships in the bundle; the token never does.
export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN ?? "";

// Errors, not spans: tracing is what burns the free-tier quota, so it is off.
const rate = Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE);

export const SENTRY_TRACES_SAMPLE_RATE =
  Number.isFinite(rate) && rate >= 0 && rate <= 1 ? rate : 0;

// Names the deploy an error came from; Vercel exposes the SHA to the bundle under its own NEXT_PUBLIC_ name.
export const SENTRY_RELEASE =
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ??
  process.env.VERCEL_GIT_COMMIT_SHA ??
  undefined;

// Blockers drop ingest.sentry.io by hostname, and Sentry's own default of /monitoring is on the same lists.
export const SENTRY_RELAY_PATH = "/invigilator";
