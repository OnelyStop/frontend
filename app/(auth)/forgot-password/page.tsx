import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShellFallback } from "@/components/auth/AuthShellFallback";
import { ForgotPasswordPage } from "@/views/ForgotPasswordPage";

export const metadata: Metadata = { title: "Reset password" };

export default function Page() {
  // useSearchParams bails out of static rendering without a boundary
  return (
    <Suspense fallback={<AuthShellFallback title="Reset your password" />}>
      <ForgotPasswordPage />
    </Suspense>
  );
}
