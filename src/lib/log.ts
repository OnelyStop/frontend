type Fields = Record<string, string | number | boolean | null | undefined>;

type Level = "debug" | "info" | "warn" | "error";

// The pipeline tests emit a line per article; LOG_IN_TESTS turns them back on
// when a failure needs them. Read per call so a test can stub it.
const silent = () =>
  process.env.NODE_ENV === "test" && !process.env.LOG_IN_TESTS;

const CHANNEL = {
  debug: "log",
  info: "log",
  warn: "warn",
  error: "error",
} as const;

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
  // One JSON object per line: greppable in Vercel's log view
  console[CHANNEL[level]](JSON.stringify(line));
};

export const log = {
  debug: (event: string, fields?: Fields) => emit("debug", event, fields),
  info: (event: string, fields?: Fields) => emit("info", event, fields),
  warn: (event: string, fields?: Fields) => emit("warn", event, fields),
  error: (event: string, fields?: Fields) => emit("error", event, fields),
};
