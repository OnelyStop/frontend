import { requireRole } from "@/features/auth/roles";
import { QueryProvider } from "@/context/QueryProvider";

// Re-checked despite the proxy: anything not routed through it bypasses that.
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("admin");
  return <QueryProvider>{children}</QueryProvider>;
}
