import { AppLayout } from "@/components/layout/AppLayout";
import { getRole } from "@/features/auth/roles";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read on the server and pass down — the dock is a client component and
  // must never decide this for itself.
  const role = await getRole();
  return <AppLayout isAdmin={role === "admin"}>{children}</AppLayout>;
}
