import { Suspense } from "react";
import { AuthShellFallback } from "@/components/auth/AuthShellFallback";
import { AuthCallbackPage } from "@/views/AuthCallbackPage";

export default function Page() {
  return (
    <Suspense fallback={<AuthShellFallback title="Confirming your account" />}>
      <AuthCallbackPage />
    </Suspense>
  );
}
