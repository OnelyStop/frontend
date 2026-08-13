import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Auth pages surface a setup notice rather than failing opaquely when the
// project hasn't been provisioned yet
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// The GoTrue settings endpoint reports which providers the project has
// enabled, letting the UI hide OAuth buttons that would just error out
export async function fetchEnabledProviders(): Promise<{ google: boolean }> {
  if (!isSupabaseConfigured) return { google: false };
  try {
    const res = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: anonKey },
    });
    if (!res.ok) return { google: false };
    const data = await res.json();
    return { google: Boolean(data?.external?.google) };
  } catch {
    return { google: false };
  }
}
