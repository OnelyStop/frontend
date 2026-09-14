import * as Sentry from "@sentry/nextjs";
import { checkEnv, isBuildPhase } from "@/config/env";
import { SENTRY_DSN, SENTRY_TRACES_SAMPLE_RATE } from "@/config/sentry";
import { log } from "@/lib/log";

// Reports rather than throws: a thrown register() is swallowed in some runtimes, so a loud log is the signal that actually arrives.
function reportEnv() {
  if (isBuildPhase()) return;

  const { fatal, warn, billingOn } = checkEnv();

  for (const { name, breaks } of warn) {
    log.warn("env.missing", { name, breaks, severity: "degraded" });
  }

  if (!fatal.length) {
    log.info("env.ok", { billing: billingOn });
    return;
  }

  const names = fatal.map((r) => r.name).join(", ");
  for (const { name, breaks } of fatal) {
    log.error("env.missing", { name, breaks, severity: "fatal" });
  }
  Sentry.captureException(
    new Error(`Required environment variables are not set: ${names}`),
    { level: "fatal", extra: { missing: names } },
  );
}

export function register() {
  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
      sendDefaultPii: false,
    });
  }

  // After init, or the fatal event is dropped; node only, since edge boots its own instance.
  if (process.env.NEXT_RUNTIME === "nodejs") reportEnv();
}

export const onRequestError = Sentry.captureRequestError;
