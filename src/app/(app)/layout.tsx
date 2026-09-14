import type { Metadata } from "next";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppProviders } from "@/components/layout/AppProviders";
import { unreadCount } from "@/features/notifications/queries.server";
import { currentUserId } from "@/lib/auth.server";
import { getRole } from "@/features/auth/roles";
import { db } from "@/db";
import { getEntitlement } from "@/features/billing/entitlements.server";

// Signed-in pages are private by default; the public /study subtree opts back in.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

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
    <AppProviders>
      <AppLayout
        unread={unread}
        isAdmin={role === "admin"}
        onTopPlan={entitlement?.plan === "pro_plus"}
      >
        {children}
      </AppLayout>
    </AppProviders>
  );
}
