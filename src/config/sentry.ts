// A DSN authorises only event submission, so it is public by design.
export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN ?? "";

// Off by default: tracing is what burns a free-tier quota.
const rate = Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE);

export const SENTRY_TRACES_SAMPLE_RATE =
  Number.isFinite(rate) && rate >= 0 && rate <= 1 ? rate : 0;
