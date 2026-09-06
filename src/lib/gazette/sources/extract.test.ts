import { describe, expect, it } from "vitest";
import {
  extractMainText,
  htmlToText,
  isMostlyEnglish,
  isPublicHttpUrl,
} from "./extract";

describe("htmlToText", () => {
  it("drops chrome and scripts but keeps a <form>-wrapped body", () => {
    const text = htmlToText(
      "<html><head><title>x</title><script>alert(1)</script></head><body><nav>Menu</nav><form><p>Repo rate held at 6.5%.</p></form></body></html>",
    );
    expect(text).toContain("Repo rate held at 6.5%.");
    expect(text).not.toContain("Menu");
    expect(text).not.toContain("alert");
  });
});

describe("extractMainText", () => {
  it("returns nothing for a bot wall served with 200", () => {
    const wall =
      "<html><body><p>Checking your browser before accessing the site. Please enable JavaScript and cookies to continue.</p></body></html>";
    expect(extractMainText(wall)).toBe("");
  });
});

describe("isMostlyEnglish", () => {
  it("rejects Devanagari and accepts English", () => {
    expect(
      isMostlyEnglish("भारतीय रिज़र्व बैंक ने रेपो दर को अपरिवर्तित रखा है।"),
    ).toBe(false);
    expect(isMostlyEnglish("The RBI left the repo rate unchanged.")).toBe(true);
  });

  it("lets the length gate decide for very short text", () => {
    expect(isMostlyEnglish("ok")).toBe(true);
  });
});

describe("isPublicHttpUrl", () => {
  it("accepts ordinary public article URLs", () => {
    expect(isPublicHttpUrl("https://www.rbi.org.in/pressreleases.aspx")).toBe(
      true,
    );
    expect(isPublicHttpUrl("http://8.8.8.8/x")).toBe(true);
    expect(isPublicHttpUrl("http://172.32.0.1/x")).toBe(true);
  });

  it("refuses anything that points inside the network", () => {
    for (const bad of [
      "http://localhost/x",
      "http://api.localhost/x",
      "http://127.0.0.1/",
      "http://10.0.0.5/",
      "http://169.254.169.254/latest/meta-data",
      "http://192.168.1.1/",
      "http://172.16.0.1/",
      "http://0.0.0.0/",
      "http://[::1]/",
      "http://db.internal/",
      "http://printer.local/",
    ]) {
      expect(isPublicHttpUrl(bad), bad).toBe(false);
    }
  });

  it("refuses non-http schemes and garbage", () => {
    expect(isPublicHttpUrl("ftp://example.com/x")).toBe(false);
    expect(isPublicHttpUrl("file:///etc/passwd")).toBe(false);
    expect(isPublicHttpUrl("not a url")).toBe(false);
  });
});
