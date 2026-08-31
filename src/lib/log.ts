type Fields = Record<string, string | number | boolean | null | undefined>;

type Level = "info" | "warn" | "error";

const emit = (level: Level, event: string, fields: Fields = {}) => {
  const line: Record<string, unknown> = {
    level,
    event,
    at: new Date().toISOString(),
  };
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) line[key] = value;
  }
  // One JSON object per line: greppable in Vercel's log view
  console[level === "info" ? "log" : level](JSON.stringify(line));
};

export const log = {
  info: (event: string, fields?: Fields) => emit("info", event, fields),
  warn: (event: string, fields?: Fields) => emit("warn", event, fields),
  error: (event: string, fields?: Fields) => emit("error", event, fields),
};
