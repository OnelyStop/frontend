import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { aiConfig } from "@/config/ai";

import { chat, LlmError } from "./openrouter";

const body = (over: Record<string, unknown> = {}) =>
  JSON.stringify({
    model: "anthropic/claude-sonnet-4.5",
    choices: [{ message: { content: "hello" } }],
    usage: { prompt_tokens: 10, completion_tokens: 4, cost: 0.000123 },
    ...over,
  });

// A fresh Response per call: a body reads once, and sharing one across retries
// fails in a way real fetch never would.
const stub = (make: (call: number) => Response) => {
  let n = 0;
  return vi.fn(async (_u: RequestInfo | URL, _i?: RequestInit) => make(++n));
};

const ok = (over?: Record<string, unknown>) => new Response(body(over), { status: 200 });
const err = (status: number) => new Response("no", { status });

const modelsAsked = (f: ReturnType<typeof stub>) =>
  f.mock.calls.map((c) => JSON.parse(c[1]!.body as string).model);

const send = (f: ReturnType<typeof stub>, args = {}) =>
  chat([{ role: "user", content: "hi" }], { ...args, fetchImpl: f as unknown as typeof fetch });

beforeEach(() => vi.stubEnv("OPENROUTER_API_KEY", "test-key"));
afterEach(() => vi.unstubAllEnvs());

describe("defaults", () => {
  it("uses the configured model when none is given", async () => {
    const f = stub(() => ok());
    await send(f);
    expect(modelsAsked(f)).toEqual([aiConfig.model]);
  });

  it("uses the model it is given instead", async () => {
    const f = stub(() => ok());
    await send(f, { model: "some/other" });
    expect(modelsAsked(f)).toEqual(["some/other"]);
  });

  it("takes one override and fills the rest from config", async () => {
    const f = stub(() => ok());
    await send(f, { temperature: 0 });
    const sent = JSON.parse(f.mock.calls[0][1]!.body as string);
    expect(sent.temperature).toBe(0);
    expect(sent.model).toBe(aiConfig.model);
    expect(sent.max_tokens).toBe(aiConfig.maxTokens);
  });
});

describe("response", () => {
  it("converts the float cost to integer micro-dollars", async () => {
    const r = await send(stub(() => ok()));
    expect(r.costMicros).toBe(123);
    expect(Number.isInteger(r.costMicros)).toBe(true);
  });

  it("records the model that answered, not the one asked for", async () => {
    const r = await send(stub(() => ok({ model: "anthropic/claude-sonnet-4.5-20991231" })));
    expect(r.model).toBe("anthropic/claude-sonnet-4.5-20991231");
  });

  it("keeps the key out of the URL and body", async () => {
    const f = stub(() => ok());
    await send(f);
    const [url, init] = f.mock.calls[0];
    expect(String(url)).not.toContain("test-key");
    expect(init!.body).not.toContain("test-key");
    expect((init!.headers as Record<string, string>).Authorization).toBe("Bearer test-key");
  });

  it("fails rather than returning an empty answer", async () => {
    await expect(send(stub(() => ok({ choices: [] })))).rejects.toMatchObject({ kind: "upstream" });
  });

  it("fails clearly with no key", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
    const f = stub(() => ok());
    await expect(send(f)).rejects.toBeInstanceOf(LlmError);
    expect(f).not.toHaveBeenCalled();
  });
});

describe("failure handling", () => {
  it("does not retry a bad key", async () => {
    const f = stub(() => err(401));
    await expect(send(f, { fallbackModel: "backup/model" }))
      .rejects.toMatchObject({ kind: "unauthorized" });
    expect(modelsAsked(f)).toEqual([aiConfig.model]);
  });

  it("does not retry a malformed request", async () => {
    const f = stub(() => err(400));
    await expect(send(f)).rejects.toMatchObject({ kind: "bad_request" });
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("retries a 429 then succeeds", async () => {
    const f = stub((n) => (n === 1 ? err(429) : ok()));
    await send(f);
    expect(f).toHaveBeenCalledTimes(2);
  });

  // 408 was previously classified as bad_request and failed instantly, despite
  // being listed as retryable.
  it("retries a 408 rather than failing instantly", async () => {
    const f = stub((n) => (n === 1 ? err(408) : ok()));
    const r = await send(f);
    expect(r.text).toBe("hello");
    expect(f).toHaveBeenCalledTimes(2);
  });

  it("reports a timeout as a timeout", async () => {
    const boom = new Error("aborted");
    boom.name = "TimeoutError";
    const f = vi.fn(async (): Promise<Response> => { throw boom; });
    await expect(send(f as unknown as ReturnType<typeof stub>))
      .rejects.toMatchObject({ kind: "timeout" });
  });
});

describe("fallback", () => {
  // AI_MODEL_FALLBACK was previously dead config: nothing read it unless the
  // caller also passed fallbackModel.
  it("uses the configured fallback without being asked", async () => {
    const f = stub((n) => (n <= aiConfig.maxAttempts ? err(503) : ok()));
    await send(f);
    expect(modelsAsked(f).at(-1)).toBe(aiConfig.fallbackModel);
  });

  it("tries the fallback only after the primary is exhausted", async () => {
    const f = stub((n) => (n <= aiConfig.maxAttempts ? err(503) : ok()));
    await send(f, { model: "primary/m", fallbackModel: "backup/m" });
    expect(modelsAsked(f)).toEqual([
      ...Array(aiConfig.maxAttempts).fill("primary/m"),
      "backup/m",
    ]);
  });

  it("does not try the same model twice when it is also the fallback", async () => {
    const f = stub(() => err(503));
    await expect(send(f, { model: "same/m", fallbackModel: "same/m" })).rejects.toBeInstanceOf(LlmError);
    expect(new Set(modelsAsked(f))).toEqual(new Set(["same/m"]));
    expect(f).toHaveBeenCalledTimes(aiConfig.maxAttempts);
  });
});
