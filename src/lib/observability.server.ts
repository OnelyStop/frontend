import "server-only";
import * as Sentry from "@sentry/nextjs";
import { log } from "./log";

type Context = Record<string, string | number | boolean | null | undefined>;

// Next's onRequestError hook only sees what escapes a request, so anything
// caught — a cron run, a provider call — has to report itself. The log line is
// written either way: with no DSN configured Sentry is a no-op, and this is
// then the only record that the failure happened.
export function captureError(err: unknown, context: Context = {}): void {
  const error = err instanceof Error ? err : new Error(String(err));
  log.error(error.message, {
    ...context,
    error: error.name,
    stack: error.stack,
  });
  Sentry.captureException(error, { extra: context });
}
