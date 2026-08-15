import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShellFallback } from "@/components/auth/AuthShellFallback";
import { SignupPage } from "@/views/SignupPage";

export const metadata: Metadata = { title: "Create account" };

export default function Page() {
  // useSearchParams bails out of static rendering without a boundary
  return (
    <Suspense fallback={<AuthShellFallback title="Start revising free" />}>
      <SignupPage />
    </Suspense>
  );
}
