import { AppLayout } from "@/components/layout/AppLayout";
import { unreadCount } from "@/features/notifications/queries.server";
import { currentUserId } from "@/lib/auth.server";
import { getRole } from "@/features/auth/roles";
import { db } from "@/db";
import { getEntitlement } from "@/features/billing/entitlements.server";

// The bell reads on every route, which is why the count is a partial-index scan.
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await currentUserId();
  const [unread, role, entitlement] = await Promise.all([
    userId ? unreadCount(userId) : 0,
    getRole(),
    userId ? getEntitlement(db, userId) : null,
  ]);
  return (
    <AppLayout
      unread={unread}
      isAdmin={role === "admin"}
      onTopPlan={entitlement?.plan === "pro_plus"}
    >
      {children}
    </AppLayout>
  );
}
