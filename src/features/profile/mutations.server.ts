import "server-only";
import { eq } from "drizzle-orm";
import { pgSchema, uuid } from "drizzle-orm/pg-core";
import { db, type Db } from "@/db";
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

// A handle on the Supabase-managed table, kept out of src/db/schema so
// drizzle-kit never tries to own it.
const authUsers = pgSchema("auth").table("users", {
  id: uuid("id").primaryKey(),
});

// SQL rather than the Supabase admin API: every user table cascades from
// auth.users in the migrations, and this needs no service-role secret.
export async function deleteAccount(
  db: Db,
  userId: string,
): Promise<{ deleted: boolean }> {
  const gone = await db
    .delete(authUsers)
    .where(eq(authUsers.id, userId))
    .returning({ id: authUsers.id });
  return { deleted: gone.length > 0 };
}
