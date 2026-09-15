/** Run once per environment: Razorpay plans cannot be edited, so a price change means a new plan id and existing subscribers stay on the old one. */
import { config } from "dotenv";
import { and, eq, sql } from "drizzle-orm";

config({ path: ".env.local" });

import { db } from "../src/db";
import { paymentPlans } from "../src/db/schema";
import { createPlan, keyMode } from "../src/features/billing/razorpay.server";

// Paise/cents, and yearly is twelve months less 10% — the toggle quotes that from these.
const PLANS = [
  {
    plan: "pro",
    interval: "monthly",
    currency: "INR",
    period: "monthly",
    amountMinor: 25_000,
    listAmountMinor: 55_000,
  },
  {
    plan: "pro",
    interval: "yearly",
    currency: "INR",
    period: "yearly",
    amountMinor: 270_000,
    listAmountMinor: 660_000,
  },
  {
    plan: "pro_plus",
    interval: "monthly",
    currency: "INR",
    period: "monthly",
    amountMinor: 40_000,
    listAmountMinor: 100_000,
  },
  {
    plan: "pro_plus",
    interval: "yearly",
    currency: "INR",
    period: "yearly",
    amountMinor: 432_000,
    listAmountMinor: 1_200_000,
  },
  // USD holds the same ratios, for onelystop.com.
  {
    plan: "pro",
    interval: "monthly",
    currency: "USD",
    period: "monthly",
    amountMinor: 500,
    listAmountMinor: 1_100,
  },
  {
    plan: "pro",
    interval: "yearly",
    currency: "USD",
    period: "yearly",
    amountMinor: 5_400,
    listAmountMinor: 13_200,
  },
  {
    plan: "pro_plus",
    interval: "monthly",
    currency: "USD",
    period: "monthly",
    amountMinor: 800,
    listAmountMinor: 2_000,
  },
  {
    plan: "pro_plus",
    interval: "yearly",
    currency: "USD",
    period: "yearly",
    amountMinor: 8_640,
    listAmountMinor: 24_000,
  },
] as const;

const INR_AFA_LIMIT_MINOR = 1_500_000; // ₹15,000 in paise

// Renders the price before Razorpay exists; mode is in the string because razorpay_plan_id is unique across both.
const pendingId = (p: (typeof PLANS)[number], mode: string) =>
  `pending_${mode}_${p.plan}_${p.interval}_${p.currency}`.toLowerCase();

async function main() {
  const apply = process.argv.includes("--apply");
  const pricesOnly = process.argv.includes("--prices-only");

  if (apply && pricesOnly) {
    throw new Error("--apply and --prices-only do opposite things; pick one");
  }

  const mode = keyMode();
  console.log(`  ${mode} mode\n`);

  for (const p of PLANS) {
    if (p.currency === "INR" && p.amountMinor > INR_AFA_LIMIT_MINOR) {
      throw new Error(
        `${p.plan}/${p.interval}/INR is ${p.amountMinor} paise, over the ₹15,000 ` +
          `auto-debit limit — every renewal would need the customer to authenticate`,
      );
    }

    const name = `OnelyStop ${p.plan} (${p.interval}, ${p.currency})`;

    if (pricesOnly) {
      await db
        .insert(paymentPlans)
        .values({
          plan: p.plan,
          interval: p.interval,
          currency: p.currency,
          razorpayPlanId: pendingId(p, mode),
          razorpayMode: mode,
          amountMinor: p.amountMinor,
          listAmountMinor: p.listAmountMinor,
        })
        .onConflictDoNothing({
          target: [
            paymentPlans.plan,
            paymentPlans.interval,
            paymentPlans.currency,
            paymentPlans.razorpayMode,
          ],
          where: sql`${paymentPlans.active}`,
        });
      console.log(`  priced   ${name}  ${p.amountMinor} ${p.currency}`);
      continue;
    }

    if (!apply) {
      console.log(
        `  would create  ${name}  amount=${p.amountMinor} ${p.currency}`,
      );
      continue;
    }

    // Checked before creating: a Razorpay plan cannot be deleted, so an upsert that declines to write strands one.
    const [held] = await db
      .select({ razorpayPlanId: paymentPlans.razorpayPlanId })
      .from(paymentPlans)
      .where(
        and(
          eq(paymentPlans.plan, p.plan),
          eq(paymentPlans.interval, p.interval),
          eq(paymentPlans.currency, p.currency),
          eq(paymentPlans.razorpayMode, mode),
          eq(paymentPlans.active, true),
        ),
      )
      .limit(1);

    if (held && !held.razorpayPlanId.startsWith("pending_")) {
      console.log(`  kept     ${name}  ${held.razorpayPlanId}`);
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
        razorpayMode: mode,
        amountMinor: p.amountMinor,
        listAmountMinor: p.listAmountMinor,
      })
      // targetWhere, not where: the deprecated `where` becomes the DO UPDATE condition, and Postgres cannot infer a partial index without the predicate on the target.
      .onConflictDoUpdate({
        target: [
          paymentPlans.plan,
          paymentPlans.interval,
          paymentPlans.currency,
          paymentPlans.razorpayMode,
        ],
        targetWhere: sql`${paymentPlans.active}`,
        set: { razorpayPlanId: created.id },
      });

    console.log(`  created  ${name}  ${created.id}`);
  }

  if (pricesOnly)
    console.log(
      "\n  prices only — checkout stays broken until --apply gives these real Razorpay ids",
    );
  else if (!apply)
    console.log(
      "\n  dry run — --apply creates them for real, --prices-only writes amounts without Razorpay",
    );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
