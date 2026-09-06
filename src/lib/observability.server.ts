import "server-only";
import * as Sentry from "@sentry/nextjs";
import { log } from "./log";

type Context = Record<string, string | number | boolean | null | undefined>;

// onRequestError only sees what escapes a request, so anything caught reports itself.
export function captureError(err: unknown, context: Context = {}): void {
  const error = err instanceof Error ? err : new Error(String(err));
  log.error(error.message, {
    ...context,
    error: error.name,
    stack: error.stack,
  });
  Sentry.captureException(error, { extra: context });
}
