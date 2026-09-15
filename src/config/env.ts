/** A boot-time read of the environment, so a missing production variable surfaces in the deploy log instead of at a learner's checkout. */

type Requirement = { name: string; breaks: string };

const FATAL: Requirement[] = [
  { name: "DATABASE_URL", breaks: "every data page and API route" },
  {
    name: "NEXT_PUBLIC_SUPABASE_URL",
    breaks: "sign-in — every protected route bounces to /login",
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    breaks: "sign-in — every protected route bounces to /login",
  },
];

const BILLING: Requirement[] = [
  { name: "RAZORPAY_KEY_ID", breaks: "checkout" },
  { name: "RAZORPAY_KEY_SECRET", breaks: "checkout" },
  {
    name: "RAZORPAY_WEBHOOK_SECRET",
    breaks: "webhook verification, so a paid plan is never granted",
  },
];

const RECOMMENDED: Requirement[] = [
  {
    name: "SITE_URL",
    breaks: "canonicals, the sitemap and share cards use the hard-coded domain",
  },
  {
    name: "CRON_SECRET",
    breaks: "the three cron routes answer 401, so ingest never runs",
  },
  { name: "OPENROUTER_API_KEY", breaks: "Ask Onely and descriptive marking" },
  {
    name: "NEXT_PUBLIC_SENTRY_DSN",
    breaks: "nothing visible, but a 3am failure goes unreported",
  },
  {
    name: "NEXT_PUBLIC_GA_MEASUREMENT_ID",
    breaks: "nothing visible, but Google Analytics counts no page views",
  },
  {
    name: "NEXT_PUBLIC_POSTHOG_KEY",
    breaks: "nothing visible, but no product event or session is recorded",
  },
  {
    name: "SENTRY_ORG",
    breaks: "source map upload, so every production stack trace is minified",
  },
  {
    name: "SENTRY_PROJECT",
    breaks: "source map upload, so every production stack trace is minified",
  },
];

export type EnvReport = {
  fatal: Requirement[];
  warn: Requirement[];
  billingOn: boolean;
};

// Not NodeJS.ProcessEnv: that type demands NODE_ENV, so every caller would have to fake one.
type Env = Record<string, string | undefined>;

export function checkEnv(env: Env = process.env): EnvReport {
  const unset = (req: Requirement) => !env[req.name]?.trim();
  const billingOn = env.BILLING_ENABLED === "true";
  return {
    billingOn,
    fatal: [...FATAL, ...(billingOn ? BILLING : [])].filter(unset),
    warn: RECOMMENDED.filter(unset),
  };
}

/** Next calls register() during `next build` too, and CI builds with no database URL by design. */
export const isBuildPhase = (env: Env = process.env) =>
  env.NEXT_PHASE === "phase-production-build";
