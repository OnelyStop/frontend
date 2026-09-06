import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { getEntitlement } from "@/features/billing/entitlements.server";
import { limitsFor } from "@/features/billing/limits";
import { aiCallsThisMonth } from "@/features/billing/usage.server";
import { recentMarkings } from "@/features/descriptive/marking.server";
import { currentUserId } from "@/lib/auth.server";
import { DescriptiveView } from "./descriptive-view";

export const metadata: Metadata = { title: "Descriptive" };

export default async function Page() {
  const userId = await currentUserId();
  if (!userId) redirect("/login?from=/descriptive");

  const { plan } = await getEntitlement(db, userId);
  const [used, history] = await Promise.all([
    aiCallsThisMonth(db, userId, "descriptive_marking"),
    recentMarkings(db, userId),
  ]);

  return (
    <DescriptiveView
      history={history}
      used={used}
      limit={limitsFor(plan).descriptiveMarkingsPerMonth}
    />
  );
}
