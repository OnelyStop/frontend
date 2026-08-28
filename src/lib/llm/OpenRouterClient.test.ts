import { describe, expect, it, vi } from "vitest";

import { OpenRouterClient } from "./OpenRouterClient";
import { LlmError, type ChatOptions } from "./types";

const OPTIONS: ChatOptions = {
  model: "anthropic/claude-sonnet-4.5",
  temperature: 0.5,
  maxTokens: 100,
  timeoutMs: 5_000,
};

const ok = (over: Record<string, unknown> = {}) =>
  new Response(
    JSON.stringify({
      model: "anthropic/claude-sonnet-4.5",
      choices: [{ message: { content: "hello" } }],
      usage: { prompt_tokens: 10, completion_tokens: 4, cost: 0.000123 },
      ...over,
    }),
    { status: 200 },
  );

// A fresh Response per call: a body can only be read once, and sharing one
// across retries fails in a way real fetch never would.
const stub = (make: () => Response) =>
  vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => make());

const client = (fetchImpl: typeof fetch) =>
  new OpenRouterClient({ apiKey: "test-key", fetchImpl });

describe("OpenRouterClient", () => {
  it("posts to the configured base URL", async () => {
    const f = stub(ok);
    await client(f as unknown as typeof fetch).chat([{ role: "user", content: "hi" }], OPTIONS);
    expect(f).toHaveBeenCalledTimes(1);
    expect(f.mock.calls[0][0]).toBe("https://openrouter.ai/api/v1/chat/completions");
  });

  it("honours an injected base URL", async () => {
    const f = stub(ok);
    const c = new OpenRouterClient({
      apiKey: "k",
      baseUrl: "https://proxy.internal/v1",
      fetchImpl: f as unknown as typeof fetch,
    });
    await c.chat([{ role: "user", content: "hi" }], OPTIONS);
    expect(f.mock.calls[0][0]).toBe("https://proxy.internal/v1/chat/completions");
  });

  it("converts the float cost to integer micro-dollars", async () => {
    const r = await client(stub(ok) as unknown as typeof fetch)
      .chat([{ role: "user", content: "hi" }], OPTIONS);
    expect(r.costMicros).toBe(123);
    expect(Number.isInteger(r.costMicros)).toBe(true);
  });

  it("records the model that answered, not the one requested", async () => {
    const f = stub(() => ok({ model: "anthropic/claude-sonnet-4.5-20991231" }));
    const r = await client(f as unknown as typeof fetch)
      .chat([{ role: "user", content: "hi" }], OPTIONS);
    expect(r.model).toBe("anthropic/claude-sonnet-4.5-20991231");
  });

  it("sends the options it was given", async () => {
    const f = stub(ok);
    await client(f as unknown as typeof fetch).chat([{ role: "user", content: "hi" }], OPTIONS);
    const body = JSON.parse(f.mock.calls[0][1]!.body as string);
    expect(body).toMatchObject({
      model: OPTIONS.model,
      temperature: OPTIONS.temperature,
      max_tokens: OPTIONS.maxTokens,
    });
  });

  it("keeps the key out of the URL and the body", async () => {
    const f = stub(ok);
    await client(f as unknown as typeof fetch).chat([{ role: "user", content: "hi" }], OPTIONS);
    const [url, init] = f.mock.calls[0];
    expect(String(url)).not.toContain("test-key");
    expect(init!.body).not.toContain("test-key");
    expect((init!.headers as Record<string, string>).Authorization).toBe("Bearer test-key");
  });

  it("classifies failures rather than leaking status codes upward", async () => {
    const cases: Array<[number, string]> = [
      [401, "unauthorized"],
      [429, "rate_limited"],
      [400, "bad_request"],
      [503, "upstream"],
    ];
    for (const [status, kind] of cases) {
      const f = stub(() => new Response("nope", { status }));
      await expect(
        client(f as unknown as typeof fetch).chat([{ role: "user", content: "hi" }], OPTIONS),
      ).rejects.toMatchObject({ kind });
    }
  });

  it("reports a timeout as a timeout", async () => {
    const timeout = new Error("aborted");
    timeout.name = "TimeoutError";
    const f = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit): Promise<Response> => {
      throw timeout;
    });
    await expect(
      client(f as unknown as typeof fetch).chat([{ role: "user", content: "hi" }], OPTIONS),
    ).rejects.toMatchObject({ kind: "timeout" });
  });

  it("fails rather than returning an empty answer", async () => {
    const f = stub(() => ok({ choices: [] }));
    await expect(
      client(f as unknown as typeof fetch).chat([{ role: "user", content: "hi" }], OPTIONS),
    ).rejects.toMatchObject({ kind: "upstream" });
  });

  it("fails clearly when no key is configured", async () => {
    const f = stub(ok);
    const c = new OpenRouterClient({ apiKey: "", fetchImpl: f as unknown as typeof fetch });
    await expect(
      c.chat([{ role: "user", content: "hi" }], OPTIONS),
    ).rejects.toBeInstanceOf(LlmError);
    expect(f).not.toHaveBeenCalled();
  });
});
