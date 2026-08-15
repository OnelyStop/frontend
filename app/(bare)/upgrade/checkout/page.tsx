import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutPage } from "@/views/CheckoutPage";

export const metadata: Metadata = { title: "Checkout" };

export default function Page() {
  // CheckoutPage reads ?billing= via useSearchParams
  return (
    <Suspense>
      <CheckoutPage />
    </Suspense>
  );
}
