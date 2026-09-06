import { z } from "zod";

// Lazy, not at import: `next build` loads every route module and has no secrets.
const schema = z.object({
  NEWSDATA_API_KEY: z.string().min(1, "NEWSDATA_API_KEY is required"),
  CRON_SECRET: z.string().min(16, "CRON_SECRET must be at least 16 chars"),
  // Dated, never an alias: a daily pipeline must not change model unannounced.
  GENERATION_MODEL: z.string().min(1).default("z-ai/glm-5.3"),
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
