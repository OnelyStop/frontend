import type { Metadata } from "next";
import { listNotifications } from "@/features/notifications/queries.server";
import { markAllRead } from "@/features/notifications/mutations.server";
import { currentUserId } from "@/lib/auth.server";
import { NotificationsView } from "./notifications-view";

export const metadata: Metadata = { title: "Notifications" };

// Opening the page is the read receipt, so it can never be cached.
export const dynamic = "force-dynamic";

export default async function Page() {
  const userId = await currentUserId();
  if (!userId) return <NotificationsView items={[]} />;

  const items = await listNotifications(userId);
  // Read after listing, so this render still shows which ones were new.
  await markAllRead(userId);
  return <NotificationsView items={items} />;
}
