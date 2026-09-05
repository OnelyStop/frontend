import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { currentUserId } from "@/lib/auth.server";
import type { Profile } from "./types";

// Resolves the caller itself so no call site can pass someone else's id.
export async function getMyProfile(): Promise<Profile | null> {
  const userId = await currentUserId();
  if (!userId) return null;

  const [row] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  return row ?? null;
}
