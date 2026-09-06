import "server-only";
import { cache } from "react";
import { AUTH_DISABLED } from "@/config/auth";
import { createClient } from "@/lib/supabase-server";

// No user id from the request body; cache() dedupes the lookup across page and DAL.

// Matches the row init.sql seeds, so local dev satisfies the auth.users FK.
const DEV_USER_ID = "00000000-0000-0000-0000-000000000001";
const DEV_USER = { id: DEV_USER_ID, email: "dev@onelystop.local" };

export type CurrentUser = { id: string; email: string | null };

export const currentUserId = cache(async (): Promise<string | null> => {
  if (AUTH_DISABLED) return DEV_USER_ID;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
});

export const currentUser = cache(async (): Promise<CurrentUser | null> => {
  if (AUTH_DISABLED) return DEV_USER;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { id: user.id, email: user.email ?? null } : null;
});
