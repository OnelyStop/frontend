import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Snapshot both halves of the URL at module load: createClient's
// detectSessionInUrl consumes them once it runs. Magic-link errors come back
// in the fragment, while OAuth under PKCE returns ?code= / ?error= in the
// query string — so neither location alone is enough.
const initialHash =
  typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
const initialQuery =
  typeof window !== "undefined" ? window.location.search.replace(/^\?/, "") : "";

export type AuthUrlError = { code: string; description: string };

function readError(raw: string): AuthUrlError | null {
  if (!raw) return null;
  const params = new URLSearchParams(raw);
  const error = params.get("error");
  if (!error) return null;
  return {
    code: params.get("error_code") ?? error,
    // URLSearchParams already turns "+" back into spaces
    description:
      params.get("error_description") ?? "The link could not be verified.",
  };
}

export function getAuthErrorFromUrl(): AuthUrlError | null {
  return readError(initialHash) ?? readError(initialQuery);
}

// A PKCE authorization code means a token exchange is in flight, so the
// callback screen should wait on it rather than declaring failure early
export function hasPendingCodeExchange(): boolean {
  return new URLSearchParams(initialQuery).has("code");
}

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
