// No `server-only` guard here, deliberately: the plan seeding script imports
// this, and that guard rejects any importer outside a Server Component. The
// `node:crypto` import already makes this unbundleable for the browser, and the
// secrets it reads are non-NEXT_PUBLIC, so a client import fails twice over.
import { createHmac, timingSafeEqual } from "node:crypto";

const API = "https://api.razorpay.com/v1";

/**
 * Razorpay credentials, read at call time rather than module load.
 *
 * Reading them at import would crash any route that merely shares a bundle with
 * this file when the vars are absent — the same failure that once took the
 * whole site down over a missing Supabase key.
 */
function credentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set");
  }
  return { keyId, keySecret };
}

async function call<T>(
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<T> {
  const { keyId, keySecret } = credentials();
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const res = await fetch(`${API}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    // Never cached: these are money operations, and a cached "create" is a
    // charge that silently did not happen.
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) {
    // Razorpay puts the useful part in error.description; the raw body is kept
    // for the cases where it does not.
    let detail = text;
    try {
      detail = JSON.parse(text)?.error?.description ?? text;
    } catch {
      /* keep the raw body */
    }
    throw new Error(
      `Razorpay ${init?.method ?? "GET"} ${path} ${res.status}: ${detail}`,
    );
  }
  return JSON.parse(text) as T;
}

export type RazorpayPlan = {
  id: string;
  period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  interval: number;
  item: { name: string; amount: number; currency: string };
};

export type RazorpaySubscription = {
  id: string;
  plan_id: string;
  status: string;
  current_start: number | null;
  current_end: number | null;
  charge_at: number | null;
  notes?: Record<string, string>;
};

export function createPlan(input: {
  period: RazorpayPlan["period"];
  interval: number;
  name: string;
  amountMinor: number;
  currency: string;
  description?: string;
}): Promise<RazorpayPlan> {
  return call<RazorpayPlan>("/plans", {
    method: "POST",
    body: {
      period: input.period,
      interval: input.interval,
      item: {
        name: input.name,
        // Razorpay takes minor units, same as we store. No conversion here on
        // purpose: a multiply is where a rounding bug would enter.
        amount: input.amountMinor,
        currency: input.currency,
        description: input.description,
      },
    },
  });
}

export function createSubscription(input: {
  planId: string;
  totalCount: number;
  notes?: Record<string, string>;
}): Promise<RazorpaySubscription> {
  return call<RazorpaySubscription>("/subscriptions", {
    method: "POST",
    body: {
      plan_id: input.planId,
      total_count: input.totalCount,
      // Razorpay emails the customer about mandates and upcoming debits. The
      // pre-debit notice is required in India, so leaving this to them is one
      // less compliance surface we own.
      customer_notify: 1,
      notes: input.notes,
    },
  });
}

export function fetchSubscription(id: string): Promise<RazorpaySubscription> {
  return call<RazorpaySubscription>(`/subscriptions/${id}`);
}

function matches(expected: string, actual: string): boolean {
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(actual, "utf8");
  // timingSafeEqual throws on a length mismatch, which would itself leak length
  // through an exception, so the lengths are compared first and in constant
  // time terms that difference does not matter — a wrong length is wrong.
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Verify the signature Checkout hands back after a subscription authorisation.
 *
 * The order of the two ids is NOT the same as for one-off orders:
 *
 *     orders:        hmac(order_id + "|" + payment_id)
 *     subscriptions: hmac(payment_id + "|" + subscription_id)
 *
 * Reversed, this fails as "invalid signature" and reads like a key problem.
 */
export function verifySubscriptionSignature(input: {
  paymentId: string;
  subscriptionId: string;
  signature: string;
}): boolean {
  const { keySecret } = credentials();
  const expected = createHmac("sha256", keySecret)
    .update(`${input.paymentId}|${input.subscriptionId}`)
    .digest("hex");
  return matches(expected, input.signature);
}

/**
 * Verify a webhook against the RAW request body.
 *
 * It must be the bytes as received. Parsing to JSON and re-stringifying changes
 * key order and whitespace, and the hash then never matches — which looks
 * exactly like an attack in the logs.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new Error("RAZORPAY_WEBHOOK_SECRET is not set");

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return matches(expected, signature);
}
