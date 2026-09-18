import {
  isAuthApiError,
  isAuthSessionMissingError,
} from "@supabase/supabase-js";

// Deliberately not bad_jwt or invalid_credentials: a forged token and a stuffing run are the two auth events worth waking up for.
const SESSION_IS_OVER = new Set([
  "refresh_token_not_found",
  "refresh_token_already_used",
  "session_not_found",
  "session_expired",
]);

/** `anonymous` is every visitor who never signed in, so it stays silent — one log per request would bury the sessions that really ended. */
export type AuthErrorVerdict = "anonymous" | "session_ended" | "report";

/** An outage answers `user: null` exactly as a spent session does, so only these named codes may be downgraded. */
export function classifyAuthError(error: unknown): AuthErrorVerdict {
  if (isAuthSessionMissingError(error)) return "anonymous";
  if (isAuthApiError(error) && SESSION_IS_OVER.has(error.code ?? ""))
    return "session_ended";
  return "report";
}

export const authErrorCode = (error: unknown): string =>
  isAuthApiError(error) ? (error.code ?? "unknown") : "unknown";
