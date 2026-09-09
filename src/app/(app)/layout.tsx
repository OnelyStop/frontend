import { AppLayout } from "@/components/layout/AppLayout";
import { unreadCount } from "@/features/notifications/queries.server";
import { currentUserId } from "@/lib/auth.server";

// The bell reads on every route, which is why the count is a partial-index scan.
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await currentUserId();
  const unread = userId ? await unreadCount(userId) : 0;
  return <AppLayout unread={unread}>{children}</AppLayout>;
}
