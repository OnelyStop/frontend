import { z } from "zod";
import type { Currency } from "./money";

// Client-safe: the pricing grid and checkout import these.

export type BillingInterval = "monthly" | "yearly";
export type PlanKey = "pro" | "school";

export type PlanPrice = {
  plan: PlanKey;
  interval: BillingInterval;
  currency: Currency;
  amountMinor: number;
};

export type Entitlement = {
  plan: "free" | "pro";
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
  interval: z.enum(["monthly", "yearly"]),
});

// What Checkout hands back on success. Verified server-side before anything
// is read from it.
export const checkoutCallback = z.object({
  razorpay_payment_id: z.string().min(1),
  razorpay_subscription_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});
