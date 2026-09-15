import * as Sentry from "@sentry/nextjs";
import { SENTRY_DSN } from "@/config/sentry";

type Fields = Record<string, string | number | boolean | null | undefined>;

type Level = "debug" | "info" | "warn" | "error";

const silent = () =>
  process.env.NODE_ENV === "test" && !process.env.LOG_IN_TESTS;

const CHANNEL = {
  debug: "log",
  info: "log",
  warn: "warn",
  error: "error",
} as const;

// Both destinations, not either: Vercel keeps an hour on Hobby and a day on Pro, Sentry keeps thirty days and sits next to the error.
function ship(level: Level, event: string, fields: Fields): void {
  if (!SENTRY_DSN) return;
  const attributes: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) attributes[key] = value;
  }
  try {
    Sentry.logger[level](event, attributes);
  } catch {
    // A logger that throws must never take down the code it was reporting on.
  }
}

const emit = (level: Level, event: string, fields: Fields = {}) => {
  if (silent()) return;
  const line: Record<string, unknown> = {
    level,
    event,
    at: new Date().toISOString(),
  };
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) line[key] = value;
  }
  console[CHANNEL[level]](JSON.stringify(line));
  ship(level, event, fields);
};

export const log = {
  debug: (event: string, fields?: Fields) => emit("debug", event, fields),
  info: (event: string, fields?: Fields) => emit("info", event, fields),
  warn: (event: string, fields?: Fields) => emit("warn", event, fields),
  error: (event: string, fields?: Fields) => emit("error", event, fields),
};
