import "server-only";
import * as Sentry from "@sentry/nextjs";
import type { SentryArea } from "@/config/sentry";
import { log } from "./log";

type Context = Record<string, string | number | boolean | null | undefined> & {
  /** Sent as a tag, not as extra: an alert rule can filter tags and cannot filter extra. */
  area?: SentryArea;
};

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
