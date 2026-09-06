import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { requestCurrency } from "@/features/billing/currency";
import { getBillingStatus } from "@/features/billing/entitlements.server";
import { listPlans } from "@/features/billing/plans.server";
import { currentUserId } from "@/lib/auth.server";
import { UpgradeView } from "./upgrade-view";

export const metadata: Metadata = { title: "Upgrade" };

export default async function Page() {
  const userId = await currentUserId();
  if (!userId) redirect("/login");

  const [prices, status] = await Promise.all([
    listPlans(await requestCurrency()),
    getBillingStatus(db, userId),
  ]);

  return (
    <UpgradeView
      prices={prices}
      status={status}
      billingEnabled={process.env.BILLING_ENABLED === "true"}
    />
  );
}
