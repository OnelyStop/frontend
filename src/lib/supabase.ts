import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Auth pages surface a setup notice rather than failing opaquely when the
// project hasn't been provisioned yet
export const isSupabaseConfigured = Boolean(url && anonKey);

// createBrowserClient writes the session to cookies rather than localStorage,
// which is what lets proxy.ts and server components see it
export const supabase = isSupabaseConfigured
  ? createBrowserClient(url!, anonKey!)
  : null;

// Snapshot both halves of the URL on first load: the client consumes them
// once it detects a session. Magic-link errors come back in the fragment,
// while OAuth under PKCE returns ?code= / ?error= in the query string — so
// neither location alone is enough.
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

// The GoTrue settings endpoint reports which providers the project has
// enabled, letting the UI hide OAuth buttons that would just error out
export async function fetchEnabledProviders(): Promise<{ google: boolean }> {
  if (!isSupabaseConfigured) return { google: false };
  try {
    const res = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: anonKey! },
    });
    if (!res.ok) return { google: false };
    const data = await res.json();
    return { google: Boolean(data?.external?.google) };
  } catch {
    return { google: false };
  }
}
