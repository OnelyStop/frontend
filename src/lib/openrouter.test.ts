import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { aiConfig } from "@/config/ai";

import { ask, AskError } from "./openrouter";

const payload = (over: Record<string, unknown> = {}) =>
  JSON.stringify({
    model: "anthropic/claude-sonnet-4.5",
    choices: [{ message: { content: "hello" } }],
    usage: { prompt_tokens: 10, completion_tokens: 4, cost: 0.000123 },
    ...over,
  });

const ok = (over?: Record<string, unknown>) => new Response(payload(over), { status: 200 });
const bad = (status: number) => new Response("no", { status });

let calls: RequestInit[];

// A fresh Response per call: a body reads once, and sharing one across retries
// fails in a way real fetch never would.
function stubFetch(make: (call: number) => Response) {
  let n = 0;
  const f = vi.fn(async (_u: RequestInfo | URL, init?: RequestInit) => {
    calls.push(init!);
    return make(++n);
  });
  vi.stubGlobal("fetch", f);
  return f;
}

const sent = (i = 0) => JSON.parse(calls[i].body as string);
const modelsAsked = () => calls.map((c) => JSON.parse(c.body as string).model);

beforeEach(() => {
  calls = [];
  vi.stubEnv("OPENROUTER_API_KEY", "test-key");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("shaping the request", () => {
  it("puts the system prompt first, then the question", async () => {
    stubFetch(() => ok());
    await ask({ system: "You are a tutor.", prompt: "What is CRR?" });
    expect(sent().messages).toEqual([
      { role: "system", content: "You are a tutor." },
      { role: "user", content: "What is CRR?" },
    ]);
  });

  it("sends only the question when there is no system prompt", async () => {
    stubFetch(() => ok());
    await ask({ prompt: "What is CRR?" });
    expect(sent().messages).toEqual([{ role: "user", content: "What is CRR?" }]);
  });

  it("uses the configured model when none is given", async () => {
    stubFetch(() => ok());
    await ask({ prompt: "hi" });
    expect(modelsAsked()).toEqual([aiConfig.model]);
  });

  it("uses the model it is given instead", async () => {
    stubFetch(() => ok());
    await ask({ prompt: "hi", model: "some/other" });
    expect(modelsAsked()).toEqual(["some/other"]);
  });

  it("takes one override and fills the rest from config", async () => {
    stubFetch(() => ok());
    await ask({ prompt: "hi", temperature: 0 });
    expect(sent().temperature).toBe(0);
    expect(sent().model).toBe(aiConfig.model);
    expect(sent().max_tokens).toBe(aiConfig.maxTokens);
  });

  it("keeps the key out of the body", async () => {
    const f = stubFetch(() => ok());
    await ask({ prompt: "hi" });
    expect(calls[0].body).not.toContain("test-key");
    expect((calls[0].headers as Record<string, string>).Authorization).toBe("Bearer test-key");
    expect(String(f.mock.calls[0][0])).not.toContain("test-key");
  });
});

describe("the answer", () => {
  it("converts the float cost to integer micro-dollars", async () => {
    stubFetch(() => ok());
    const r = await ask({ prompt: "hi" });
    expect(r.costMicros).toBe(123);
    expect(Number.isInteger(r.costMicros)).toBe(true);
  });

  it("records the model that answered, not the one asked for", async () => {
    stubFetch(() => ok({ model: "anthropic/claude-sonnet-4.5-20991231" }));
    const r = await ask({ prompt: "hi" });
    expect(r.model).toBe("anthropic/claude-sonnet-4.5-20991231");
  });

  it("fails rather than returning an empty answer", async () => {
    stubFetch(() => ok({ choices: [] }));
    await expect(ask({ prompt: "hi" })).rejects.toMatchObject({ kind: "upstream" });
  });

  it("fails clearly with no key", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
    const f = stubFetch(() => ok());
    await expect(ask({ prompt: "hi" })).rejects.toBeInstanceOf(AskError);
    expect(f).not.toHaveBeenCalled();
  });
});

describe("failure handling", () => {
  it("does not retry a bad key", async () => {
    stubFetch(() => bad(401));
    await expect(ask({ prompt: "hi", fallbackModel: "backup/m" }))
      .rejects.toMatchObject({ kind: "unauthorized" });
    expect(modelsAsked()).toEqual([aiConfig.model]);
  });

  it("does not retry a malformed request", async () => {
    const f = stubFetch(() => bad(400));
    await expect(ask({ prompt: "hi" })).rejects.toMatchObject({ kind: "bad_request" });
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("retries a 429 then succeeds", async () => {
    const f = stubFetch((n) => (n === 1 ? bad(429) : ok()));
    await ask({ prompt: "hi" });
    expect(f).toHaveBeenCalledTimes(2);
  });

  // 408 was classified as bad_request and failed instantly, despite being
  // listed as retryable.
  it("retries a 408 rather than failing instantly", async () => {
    const f = stubFetch((n) => (n === 1 ? bad(408) : ok()));
    const r = await ask({ prompt: "hi" });
    expect(r.text).toBe("hello");
    expect(f).toHaveBeenCalledTimes(2);
  });

  it("reports a timeout as a timeout", async () => {
    const boom = new Error("aborted");
    boom.name = "TimeoutError";
    vi.stubGlobal("fetch", vi.fn(async () => { throw boom; }));
    await expect(ask({ prompt: "hi" })).rejects.toMatchObject({ kind: "timeout" });
  });
});

describe("fallback", () => {
  // AI_MODEL_FALLBACK was dead config: nothing read it unless the caller also
  // passed fallbackModel.
  it("uses the configured fallback without being asked", async () => {
    stubFetch((n) => (n <= aiConfig.maxAttempts ? bad(503) : ok()));
    await ask({ prompt: "hi" });
    expect(modelsAsked().at(-1)).toBe(aiConfig.fallbackModel);
  });

  it("tries the fallback only after the primary is exhausted", async () => {
    stubFetch((n) => (n <= aiConfig.maxAttempts ? bad(503) : ok()));
    await ask({ prompt: "hi", model: "primary/m", fallbackModel: "backup/m" });
    expect(modelsAsked()).toEqual([
      ...Array(aiConfig.maxAttempts).fill("primary/m"),
      "backup/m",
    ]);
  });

  it("does not try the same model twice when it is also the fallback", async () => {
    const f = stubFetch(() => bad(503));
    await expect(ask({ prompt: "hi", model: "same/m", fallbackModel: "same/m" }))
      .rejects.toBeInstanceOf(AskError);
    expect(new Set(modelsAsked())).toEqual(new Set(["same/m"]));
    expect(f).toHaveBeenCalledTimes(aiConfig.maxAttempts);
  });
});
