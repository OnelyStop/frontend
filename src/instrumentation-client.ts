import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";
import {
  POSTHOG_KEY,
  POSTHOG_RELAY_PATH,
  POSTHOG_UI_HOST,
  scrubUrls,
} from "@/config/posthog";
import {
  SENTRY_DENY_URLS,
  SENTRY_DSN,
  SENTRY_ENVIRONMENT,
  SENTRY_IGNORE_ERRORS,
  SENTRY_RELEASE,
  SENTRY_TRACES_SAMPLE_RATE,
  tagEvent,
} from "@/config/sentry";

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    release: SENTRY_RELEASE,
    environment: SENTRY_ENVIRONMENT,
    tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
    sendDefaultPii: false,
    enableLogs: true,
    ignoreErrors: SENTRY_IGNORE_ERRORS,
    denyUrls: SENTRY_DENY_URLS,
    beforeSend: (event) => {
      tagEvent(event);
      return event;
    },
  });
}

// Guarded because this module also exports Sentry's router hook: a throw here would take error reporting with it.
try {
  if (POSTHOG_KEY)
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_RELAY_PATH,
      ui_host: POSTHOG_UI_HOST,
      defaults: "2026-05-30",
      // Every option click in a drill would be an event, and the free tier is a million a month.
      autocapture: false,
      capture_exceptions: false,
      person_profiles: "identified_only",
      // syncReplay starts it per route, which is what keeps it off the exam surfaces and off /reset-password.
      disable_session_recording: true,
      session_recording: { maskAllInputs: true },
      sanitize_properties: scrubUrls,
    });
} catch (err) {
  Sentry.captureException(err, { tags: { area: "app" } });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
