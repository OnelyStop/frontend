/**
 * Create the Razorpay plan objects and record them in `payment_plans`.
 *
 *     bun run scripts/seed-billing-plans.ts          # what it would do
 *     bun run scripts/seed-billing-plans.ts --apply  # actually create them
 *
 * Razorpay fixes the currency on the plan itself, so one product sold in two
 * currencies is two plan objects. Four rows here: pro × {monthly, yearly} ×
 * {INR, USD}.
 *
 * Run once per environment. Razorpay plans cannot be edited — changing a price
 * means a new plan, and existing subscribers stay on the old one, which is the
 * behaviour you want and the reason the id is stored rather than the price
 * alone.
 */
import { config } from "dotenv";
import { sql } from "drizzle-orm";

config({ path: ".env.local" });

import { db } from "../src/db";
import { paymentPlans } from "../src/db/schema";
import { createPlan } from "../src/features/billing/razorpay.server";

// Amounts are MINOR units: paise for INR, cents for USD.
//
// The INR figures are placeholders and must be set deliberately before this is
// run against a live account. One hard constraint: RBI requires the customer to
// authenticate every auto-debit over ₹15,000, so a yearly INR plan priced above
// 1_500_000 paise stops renewing silently and starts interrupting the customer
// once a year.
const PLANS = [
  {
    plan: "pro",
    interval: "monthly",
    currency: "INR",
    period: "monthly",
    amountMinor: 49_900,
  },
  {
    plan: "pro",
    interval: "yearly",
    currency: "INR",
    period: "yearly",
    amountMinor: 499_900,
  },
  // USD mirrors the current pricing page: $7.99/mo, $59/yr.
  {
    plan: "pro",
    interval: "monthly",
    currency: "USD",
    period: "monthly",
    amountMinor: 799,
  },
  {
    plan: "pro",
    interval: "yearly",
    currency: "USD",
    period: "yearly",
    amountMinor: 5_900,
  },
] as const;

const INR_AFA_LIMIT_MINOR = 1_500_000; // ₹15,000 in paise

async function main() {
  const apply = process.argv.includes("--apply");

  for (const p of PLANS) {
    if (p.currency === "INR" && p.amountMinor > INR_AFA_LIMIT_MINOR) {
      throw new Error(
        `${p.plan}/${p.interval}/INR is ${p.amountMinor} paise, over the ₹15,000 ` +
          `auto-debit limit — every renewal would need the customer to authenticate`,
      );
    }

    const name = `OnelyStop ${p.plan} (${p.interval}, ${p.currency})`;
    if (!apply) {
      console.log(
        `  would create  ${name}  amount=${p.amountMinor} ${p.currency}`,
      );
      continue;
    }

    const created = await createPlan({
      period: p.period,
      interval: 1,
      name,
      amountMinor: p.amountMinor,
      currency: p.currency,
    });

    await db
      .insert(paymentPlans)
      .values({
        plan: p.plan,
        interval: p.interval,
        currency: p.currency,
        razorpayPlanId: created.id,
        amountMinor: p.amountMinor,
      })
      // Re-running must not create a second live plan for the same slot. The
      // index is partial, so Postgres needs the predicate too -- without it
      // Postgres cannot infer which index this conflicts on and the insert
      // fails outright instead of being skipped.
      .onConflictDoNothing({
        target: [
          paymentPlans.plan,
          paymentPlans.interval,
          paymentPlans.currency,
        ],
        where: sql`${paymentPlans.active}`,
      });

    console.log(`  created  ${name}  ${created.id}`);
  }

  if (!apply)
    console.log("\n  dry run — pass --apply to create these for real");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
