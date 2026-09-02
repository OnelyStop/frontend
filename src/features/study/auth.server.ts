import "server-only";
import { createClient } from "@/lib/supabase-server";

/* Every study API route resolves the caller here and scopes its query to this
   id. The request body never carries an authorising user id (spec §11). */

const AUTH_DISABLED =
  process.env.AUTH_DISABLED === "true" && process.env.NODE_ENV !== "production";

// Matches the row docker/postgres/init.sql seeds, so local dev without a real
// session still satisfies the auth.users foreign key on notes and progress.
const DEV_USER_ID = "00000000-0000-0000-0000-000000000001";

export async function currentUserId(): Promise<string | null> {
  if (AUTH_DISABLED) return DEV_USER_ID;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}
