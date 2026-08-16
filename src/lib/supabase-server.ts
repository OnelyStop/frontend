import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Separate from the browser client so next/headers stays out of that bundle.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server components can't set cookies; proxy.ts refreshes the
            // session instead, so this is safe to swallow
          }
        },
      },
    },
  );
}
