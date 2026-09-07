import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

/* SetupNotice reads NODE_ENV at render, so each case needs a fresh module. */
async function render(nodeEnv: string) {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", nodeEnv);
  const { SetupNotice } = await import("./components/AuthBits");
  return renderToStaticMarkup(createElement(SetupNotice));
}

afterEach(() => vi.unstubAllEnvs());

describe("SetupNotice", () => {
  it("never shows a visitor an environment variable", async () => {
    const html = await render("production");
    expect(html).not.toContain("NEXT_PUBLIC_");
    expect(html).not.toContain(".env.local");
    expect(html.toLowerCase()).not.toContain("supabase");
  });

  it("apologises and gives the visitor a way to reach us", async () => {
    const html = await render("production");
    expect(html).toContain("unavailable");
    expect(html).toContain("mailto:");
  });

  it("still tells a developer exactly which keys are missing", async () => {
    const html = await render("development");
    expect(html).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(html).toContain("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    expect(html).toContain(".env.local");
  });
});
