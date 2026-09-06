import { z } from "zod";
import type { PlanTier } from "./limits";
import type { Currency } from "./money";

// Client-safe: the pricing grid and checkout import these.

export type BillingInterval = "monthly" | "yearly";
export type PlanKey = "pro" | "pro_plus" | "school";

/** The tiers you can actually check out; Institute is arranged by contact. */
export type PaidPlan = Extract<PlanKey, "pro" | "pro_plus">;

export type PlanPrice = {
  plan: PlanKey;
  interval: BillingInterval;
  currency: Currency;
  amountMinor: number;
  /** What the price is struck through against, when the plan is on offer. */
  listAmountMinor: number | null;
};

export type Entitlement = {
  plan: PlanTier;
  active: boolean;
  accessUntil: string | null;
};

export type BillingStatus = Entitlement & {
  subscription: {
    id: string;
    status: string;
    currentPeriodEnd: string | null;
    cancelledAt: string | null;
  } | null;
};

export const subscriptionCreate = z.object({
  plan: z.enum(["pro", "pro_plus"]),
  interval: z.enum(["monthly", "yearly"]),
});

// What Checkout hands back; verified server-side before anything reads it.
export const checkoutCallback = z.object({
  razorpay_payment_id: z.string().min(1),
  razorpay_subscription_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});
