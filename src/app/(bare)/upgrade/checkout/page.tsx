import type { Metadata } from "next";
import { CheckoutView } from "./checkout-view";

export const metadata: Metadata = { title: "Checkout" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>;
}) {
  const { billing } = await searchParams;
  return <CheckoutView billing={billing === "monthly" ? "monthly" : "annual"} />;
}
