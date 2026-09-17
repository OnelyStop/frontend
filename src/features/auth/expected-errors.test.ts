import { describe, expect, it } from "vitest";
import {
  AuthApiError,
  AuthRetryableFetchError,
  AuthSessionMissingError,
} from "@supabase/supabase-js";
import { authErrorCode, isExpectedAuthError } from "./expected-errors";

const api = (code: string, status = 400) =>
  new AuthApiError(`something about ${code}`, status, code);

describe("isExpectedAuthError", () => {
  it("treats a spent or rotated session as the end of a visit", () => {
    for (const code of [
      "refresh_token_not_found",
      "refresh_token_already_used",
      "session_not_found",
      "session_expired",
    ]) {
      expect(isExpectedAuthError(api(code))).toBe(true);
    }
  });

  it("treats a missing session as expected, as the old guard did", () => {
    expect(isExpectedAuthError(new AuthSessionMissingError())).toBe(true);
  });

  it("still reports tampering, stuffing and an outage", () => {
    expect(isExpectedAuthError(api("bad_jwt", 401))).toBe(false);
    expect(isExpectedAuthError(api("invalid_credentials", 400))).toBe(false);
    expect(
      isExpectedAuthError(new AuthRetryableFetchError("fetch failed", 0)),
    ).toBe(false);
  });

  it("reports an auth error carrying no code at all", () => {
    expect(isExpectedAuthError(api("", 500))).toBe(false);
    expect(isExpectedAuthError(new Error("database is on fire"))).toBe(false);
    expect(isExpectedAuthError(null)).toBe(false);
  });
});

describe("authErrorCode", () => {
  it("names the code so a spike is countable without an issue", () => {
    expect(authErrorCode(api("session_expired"))).toBe("session_expired");
  });

  it("answers unknown rather than throwing on anything else", () => {
    expect(authErrorCode(new Error("nope"))).toBe("unknown");
    expect(authErrorCode(undefined)).toBe("unknown");
  });
});
