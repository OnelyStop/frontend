import * as Sentry from "@sentry/nextjs";
import { SENTRY_DSN, SENTRY_TRACES_SAMPLE_RATE } from "@/config/sentry";

export function register() {
  if (!SENTRY_DSN) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
    // Headers, cookies and request bodies carry answers and email addresses.
    // A user id reaches Sentry only where we attach one deliberately.
    sendDefaultPii: false,
  });
}

// Without a DSN the SDK is uninitialised and this does nothing.
export const onRequestError = Sentry.captureRequestError;
