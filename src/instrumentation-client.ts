import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";
import {
  POSTHOG_KEY,
  POSTHOG_RELAY_PATH,
  POSTHOG_UI_HOST,
  scrubUrls,
} from "@/config/posthog";
import {
  SENTRY_DSN,
  SENTRY_RELEASE,
  SENTRY_TRACES_SAMPLE_RATE,
} from "@/config/sentry";

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    release: SENTRY_RELEASE,
    tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
    sendDefaultPii: false,
  });
}

if (POSTHOG_KEY) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_RELAY_PATH,
    ui_host: POSTHOG_UI_HOST,
    defaults: "2026-05-30",
    // Every option click in a drill would be an event, and the free tier is a million a month.
    autocapture: false,
    // Sentry owns errors; running both halves of both products pays twice for one signal.
    capture_exceptions: false,
    person_profiles: "identified_only",
    // syncReplay starts it per route, which is what keeps it off the exam surfaces and off /reset-password.
    disable_session_recording: true,
    session_recording: { maskAllInputs: true },
    sanitize_properties: scrubUrls,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
