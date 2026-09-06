// A DSN authorises only event submission, so it ships in the bundle; the token never does.
export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN ?? "";

// Errors, not spans: tracing is what burns the free-tier quota, so it is off.
const rate = Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE);

export const SENTRY_TRACES_SAMPLE_RATE =
  Number.isFinite(rate) && rate >= 0 && rate <= 1 ? rate : 0;
