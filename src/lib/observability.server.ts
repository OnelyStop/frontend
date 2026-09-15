import "server-only";
import * as Sentry from "@sentry/nextjs";
import { after } from "next/server";
import type { SentryArea } from "@/config/sentry";
import { SENTRY_DSN } from "@/config/sentry";
import { log } from "./log";

type Context = Record<string, string | number | boolean | null | undefined> & {
  /** Sent as a tag, not as extra: an alert rule can filter tags and cannot filter extra. */
  area?: SentryArea;
};

const FLUSH_TIMEOUT_MS = 2_000;

// onRequestError only sees what escapes a request, so anything caught reports itself.
export function captureError(err: unknown, context: Context = {}): void {
  const error = err instanceof Error ? err : new Error(String(err));
  log.error(error.message, {
    ...context,
    error: error.name,
    stack: error.stack,
  });
  const { area, ...extra } = context;
  Sentry.captureException(error, {
    extra,
    ...(area ? { tags: { area } } : {}),
  });
}

/** Logs and metrics are buffered on a timer, and a function is frozen the moment it responds — so the send is registered as after-work rather than awaited. */
export function flushTelemetry(): void {
  if (!SENTRY_DSN) return;
  try {
    after(async () => {
      try {
        await Sentry.flush(FLUSH_TIMEOUT_MS);
      } catch {
        // A failed flush must not turn a 200 into a 500.
      }
    });
  } catch {
    // after() throws outside a request; nothing to flush there either.
  }
}
