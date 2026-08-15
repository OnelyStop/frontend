import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutPage } from "@/views/CheckoutPage";

export const metadata: Metadata = { title: "Checkout" };

export default function Page() {
  // CheckoutPage reads ?billing= via useSearchParams, which needs a boundary
  // or the route bails out to the client and renders an empty document
  return (
    <Suspense fallback={<div className="checkout-shell" aria-busy="true" />}>
      <CheckoutPage />
    </Suspense>
  );
}
