import "server-only";
import * as Sentry from "@sentry/nextjs";
import { SENTRY_DSN } from "@/config/sentry";

/** Every attribute here has a small fixed set of values — a counter keyed by user id is a bill, not a signal. */
type Counters = {
  "attempt.started": { mode: "bank" | "mix" | "paper" };
  "quota.blocked": { limit: string };
  "billing.webhook": { outcome: string };
  "billing.subscription_created": { plan: string; interval: string };
  "ai.call": { model: string; outcome: "ok" | "failed" };
};

export function countEvent<N extends keyof Counters>(
  name: N,
  attributes: Counters[N],
): void {
  if (!SENTRY_DSN) return;
  try {
    Sentry.metrics.count(name, 1, { attributes });
  } catch {
    // A counter must never break the path it is counting.
  }
}
