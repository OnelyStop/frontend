import "server-only";
import { cache } from "react";
import { AUTH_DISABLED } from "@/config/auth";
import { createClient } from "@/lib/supabase-server";

// The request body never carries an authorising user id — everything resolves
// the caller here. cache() dedupes it: a page and its DAL both ask.

// Matches the row docker/postgres/init.sql seeds, so local dev without a real
// session still satisfies the auth.users foreign key on notes and progress.
const DEV_USER_ID = "00000000-0000-0000-0000-000000000001";

export const currentUserId = cache(async (): Promise<string | null> => {
  if (AUTH_DISABLED) return DEV_USER_ID;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
});
