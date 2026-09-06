// A DSN names a project and authorises nothing but event submission, so it is
// public by design and ships in the browser bundle. The auth token that
// uploads source maps is build-time only and never NEXT_PUBLIC_.
export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN ?? "";

// Errors, not spans: tracing is what burns a free-tier quota, so it is off
// unless someone deliberately turns it up.
const rate = Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE);

export const SENTRY_TRACES_SAMPLE_RATE =
  Number.isFinite(rate) && rate >= 0 && rate <= 1 ? rate : 0;
