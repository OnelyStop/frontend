import { z } from "zod";

// Validated lazily on first access, not at import: `next build` loads every
// route module to collect its config, and a build box has no secrets. Fail
// fast, but at request/CLI time — not build time.
const schema = z.object({
  NEWSDATA_API_KEY: z.string().min(1, "NEWSDATA_API_KEY is required"),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  CRON_SECRET: z.string().min(16, "CRON_SECRET must be at least 16 chars"),
  GENERATION_MODEL: z.string().min(1).default("gemini-flash-lite-latest"),
  // Free-tier Gemini keys allow ~15 requests a minute; paid keys thousands.
  GENERATION_RPM: z.coerce.number().int().min(1).max(1000).default(12),
  SENTRY_DSN: z.string().url().optional(),
});

type Env = z.infer<typeof schema>;

let cached: Env | undefined;

function load(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

export const env: Env = new Proxy({} as Env, {
  get: (_target, prop: string) => load()[prop as keyof Env],
});
