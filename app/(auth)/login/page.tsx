import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShellFallback } from "@/components/auth/AuthShellFallback";
import { LoginPage } from "@/views/LoginPage";

export const metadata: Metadata = { title: "Sign in" };

export default function Page() {
  // useSearchParams bails out of static rendering without a boundary
  return (
    <Suspense fallback={<AuthShellFallback title="Welcome back" />}>
      <LoginPage />
    </Suspense>
  );
}
