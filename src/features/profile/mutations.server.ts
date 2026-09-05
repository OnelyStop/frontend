import "server-only";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { currentUserId } from "@/lib/auth.server";
import type { Profile, ProfileUpdate } from "./types";

// Upsert, not update: an account created before the signup trigger existed has
// no row, and its first save would 404.
export async function updateMyProfile(
  patch: ProfileUpdate,
): Promise<Profile | null> {
  const userId = await currentUserId();
  if (!userId) return null;

  const values = { ...patch, updatedAt: new Date() };
  const [row] = await db
    .insert(profiles)
    .values({ id: userId, ...values })
    .onConflictDoUpdate({ target: profiles.id, set: values })
    .returning();
  return row;
}
