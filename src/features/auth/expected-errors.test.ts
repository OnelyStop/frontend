import { describe, expect, it } from "vitest";
import {
  AuthApiError,
  AuthRetryableFetchError,
  AuthSessionMissingError,
} from "@supabase/supabase-js";
import { authErrorCode, classifyAuthError } from "./expected-errors";

const api = (code: string, status = 400) =>
  new AuthApiError(`something about ${code}`, status, code);

describe("classifyAuthError", () => {
  // getUser() answers this for every request without a cookie, so a log here would be one line per anonymous page view.
  it("keeps a visitor who never signed in silent", () => {
    expect(classifyAuthError(new AuthSessionMissingError())).toBe("anonymous");
  });

  it("counts a session that existed and ended", () => {
    for (const code of [
      "refresh_token_not_found",
      "refresh_token_already_used",
      "session_not_found",
      "session_expired",
    ]) {
      expect(classifyAuthError(api(code))).toBe("session_ended");
    }
  });

  it("still reports tampering, stuffing and an outage", () => {
    expect(classifyAuthError(api("bad_jwt", 401))).toBe("report");
    expect(classifyAuthError(api("invalid_credentials", 400))).toBe("report");
    expect(
      classifyAuthError(new AuthRetryableFetchError("fetch failed", 0)),
    ).toBe("report");
  });

  it("reports an auth error carrying no code at all", () => {
    expect(classifyAuthError(api("", 500))).toBe("report");
    expect(classifyAuthError(new Error("database is on fire"))).toBe("report");
    expect(classifyAuthError(null)).toBe("report");
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
