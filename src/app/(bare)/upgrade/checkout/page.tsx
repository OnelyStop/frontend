import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { requestCurrency } from "@/features/billing/currency";
import { getEntitlement } from "@/features/billing/entitlements.server";
import { listPlans } from "@/features/billing/plans.server";
import { currentUserId } from "@/lib/auth.server";
import { CheckoutView } from "./checkout-view";

export const metadata: Metadata = { title: "Checkout" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ interval?: string }>;
}) {
  const userId = await currentUserId();
  if (!userId) redirect("/login?from=/upgrade/checkout");

  const { interval } = await searchParams;
  const [prices, entitlement] = await Promise.all([
    listPlans(await requestCurrency()),
    getEntitlement(db, userId),
  ]);

  return (
    <CheckoutView
      interval={interval === "monthly" ? "monthly" : "yearly"}
      prices={prices}
      entitled={entitlement.active}
      billingEnabled={process.env.BILLING_ENABLED === "true"}
    />
  );
}
