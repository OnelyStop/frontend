import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { getEntitlement } from "@/features/billing/entitlements.server";
import { limitsFor } from "@/features/billing/limits";
import { currentUserId } from "@/lib/auth.server";
import { AttemptMapView } from "./attempt-map-view";

export const metadata: Metadata = { title: "Attempt map" };

export default async function Page() {
  const userId = await currentUserId();
  if (!userId) redirect("/login?from=/attempt-map");

  const { plan } = await getEntitlement(db, userId);
  if (!limitsFor(plan).attemptMap) redirect("/upgrade?from=attempt-map");

  return <AttemptMapView />;
}
