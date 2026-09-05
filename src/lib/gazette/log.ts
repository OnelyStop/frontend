type Level = "debug" | "info" | "warn" | "error";
type Fields = Record<string, unknown>;

// One JSON line per event. Generate-path logs always carry runId + articleId
// so one article's journey greps end to end.
const SILENT = process.env.NODE_ENV === "test" && !process.env.LOG_IN_TESTS;

export function log(level: Level, msg: string, fields: Fields = {}): void {
  if (SILENT) return;
  const line = JSON.stringify({
    t: new Date().toISOString(),
    level,
    msg,
    ...fields,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else process.stdout.write(`${line}\n`);
}

// Error-tracking seam: a no-op until SENTRY_DSN is set and the SDK is wired.
export function captureError(err: unknown, ctx: Fields = {}): void {
  const e = err as Error;
  log("error", e?.message ?? "unknown error", {
    ...ctx,
    error: e?.name,
    stack: e?.stack,
  });
}
