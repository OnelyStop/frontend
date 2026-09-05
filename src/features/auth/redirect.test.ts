import { describe, expect, it } from "vitest";
import { safeInternalPath } from "./redirect";

describe("safeInternalPath", () => {
  it("keeps a path on this site, with its query and fragment", () => {
    expect(safeInternalPath("/study/quant?tab=notes#p2")).toBe(
      "/study/quant?tab=notes#p2",
    );
  });

  it.each([
    "https://evil.example/",
    "//evil.example/home",
    "/\\evil.example",
    "/\\/evil.example",
    "javascript:alert(1)",
    "home",
    "",
    "/home\nSet-Cookie: x",
    "/home with space",
    "/" + "a".repeat(3000),
  ])("falls back for %j", (bad) => {
    expect(safeInternalPath(bad)).toBe("/home");
  });

  it("falls back for anything that is not a string", () => {
    expect(safeInternalPath(undefined)).toBe("/home");
    expect(safeInternalPath(["/x"])).toBe("/home");
  });

  it("uses the caller's fallback", () => {
    expect(safeInternalPath("//evil.example", "/")).toBe("/");
  });
});
