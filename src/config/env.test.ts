import { describe, expect, it } from "vitest";
import { checkEnv, isBuildPhase } from "./env";

const FULL = {
  DATABASE_URL: "postgresql://x",
  NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_x",
  SITE_URL: "https://www.onelystop.in",
  CRON_SECRET: "0123456789abcdef",
  OPENROUTER_API_KEY: "sk-x",
  NEXT_PUBLIC_SENTRY_DSN: "https://x@sentry.io/1",
  NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-ABCDE12345",
};

describe("checkEnv", () => {
  it("reports nothing when every variable is set and billing is off", () => {
    const report = checkEnv(FULL);
    expect(report.fatal).toEqual([]);
    expect(report.warn).toEqual([]);
    expect(report.billingOn).toBe(false);
  });

  it("names the database URL as fatal when it is absent", () => {
    const { fatal } = checkEnv({ ...FULL, DATABASE_URL: undefined });
    expect(fatal.map((r) => r.name)).toEqual(["DATABASE_URL"]);
  });

  it("treats whitespace as unset, which is what a pasted blank value leaves", () => {
    const { fatal } = checkEnv({ ...FULL, DATABASE_URL: "   " });
    expect(fatal.map((r) => r.name)).toEqual(["DATABASE_URL"]);
  });

  it("demands the Razorpay keys only once billing is enabled", () => {
    const off = checkEnv(FULL);
    expect(off.fatal).toEqual([]);

    const on = checkEnv({ ...FULL, BILLING_ENABLED: "true" });
    expect(on.fatal.map((r) => r.name)).toEqual([
      "RAZORPAY_KEY_ID",
      "RAZORPAY_KEY_SECRET",
      "RAZORPAY_WEBHOOK_SECRET",
    ]);
  });

  it("keeps a missing Sentry DSN a warning, not a fatal", () => {
    const { fatal, warn } = checkEnv({
      ...FULL,
      NEXT_PUBLIC_SENTRY_DSN: undefined,
    });
    expect(fatal).toEqual([]);
    expect(warn.map((r) => r.name)).toEqual(["NEXT_PUBLIC_SENTRY_DSN"]);
  });

  it("explains what breaks, so the deploy log is actionable", () => {
    const { fatal } = checkEnv({ ...FULL, DATABASE_URL: undefined });
    expect(fatal[0].breaks).toMatch(/data page/);
  });
});

describe("isBuildPhase", () => {
  // CI builds with no DATABASE_URL, so a build-time report would cry wolf on every PR.
  it("is true only during a production build", () => {
    expect(isBuildPhase({ NEXT_PHASE: "phase-production-build" })).toBe(true);
    expect(isBuildPhase({})).toBe(false);
  });
});
