import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import type { NotificationKind } from "./types";

/** Never notify someone about their own action — the common case is replying to yourself. */
export async function notify(input: {
  userId: string;
  actorId?: string;
  kind: NotificationKind;
  title: string;
  body?: string | null;
  href?: string | null;
}): Promise<void> {
  if (input.actorId && input.actorId === input.userId) return;

  await db.insert(notifications).values({
    userId: input.userId,
    kind: input.kind,
    title: input.title,
    body: input.body ?? null,
    href: input.href ?? null,
  });
}

export async function markAllRead(userId: string): Promise<void> {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
}
