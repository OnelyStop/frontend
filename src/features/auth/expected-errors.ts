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

/** An outage answers `user: null` exactly as a spent session does, so only these named codes may be filtered. */
export function isExpectedAuthError(error: unknown): boolean {
  if (isAuthSessionMissingError(error)) return true;
  return isAuthApiError(error) && SESSION_IS_OVER.has(error.code ?? "");
}

export const authErrorCode = (error: unknown): string =>
  isAuthApiError(error) ? (error.code ?? "unknown") : "unknown";
