import { describe, expect, it } from "vitest";
import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_RULES,
  failedPasswordRules,
  passwordMeetsRules,
} from "./password-rules";

const ids = (value: string) => failedPasswordRules(value).map((r) => r.id);

describe("password rules", () => {
  it("names every rule a password misses", () => {
    expect(ids("")).toEqual(PASSWORD_RULES.map((r) => r.id));
    expect(ids("short1!A")).toEqual([]);
  });

  it("checks length at the stated minimum", () => {
    const almost = `Aa1!${"x".repeat(MIN_PASSWORD_LENGTH - 5)}`;
    expect(ids(almost)).toContain("length");
    expect(ids(`${almost}x`)).not.toContain("length");
  });

  it("requires a case of each, a digit and a symbol", () => {
    expect(ids("alllower1!")).toEqual(["upper"]);
    expect(ids("ALLUPPER1!")).toEqual(["lower"]);
    expect(ids("NoDigits!!")).toEqual(["digit"]);
    expect(ids("NoSymbol11")).toEqual(["symbol"]);
  });

  it("counts a non-ASCII mark as a symbol but a letter as a letter", () => {
    expect(passwordMeetsRules("Passwörd1")).toBe(false);
    expect(passwordMeetsRules("Passwörd1—")).toBe(true);
  });

  it("does not accept whitespace as the special character", () => {
    expect(ids("Password 1")).toEqual(["symbol"]);
  });
});
