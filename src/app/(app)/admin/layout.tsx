import { requireRole } from "@/features/auth/roles";

// Re-checked here even though the proxy already redirected: the proxy can be
// bypassed by anything that doesn't route through it.
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("admin");
  return <>{children}</>;
}
