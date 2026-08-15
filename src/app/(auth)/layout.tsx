import { Suspense } from "react";
import { AuthShellFallback } from "@/components/auth/AuthShellFallback";

// Auth screens read the URL (?from=, ?code=, #error=), and useSearchParams
// bails a statically-rendered route out to the client unless a Suspense
// boundary scopes it. One boundary here covers the whole group, so no auth
// page has to remember it — including ones added later.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AuthShellFallback title="One moment" />}>
      {children}
    </Suspense>
  );
}
