import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { openrouterConfig as config } from "@/config/openrouter";

import { OpenRouterClient, openrouter } from "./openrouter";
import { AiError } from "./openrouter-types";

const payload = (over: Record<string, unknown> = {}) =>
  JSON.stringify({
    model: "anthropic/claude-sonnet-4.5",
    choices: [{ message: { content: "hello" } }],
    usage: { prompt_tokens: 10, completion_tokens: 4, cost: 0.000123 },
    ...over,
  });

const ok = (over?: Record<string, unknown>) =>
  new Response(payload(over), { status: 200 });
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
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("shaping the request", () => {
  it("puts the system prompt first, then the question", async () => {
    stubFetch(() => ok());
    await openrouter.ask({
      system: "You are a tutor.",
      prompt: "What is CRR?",
    });
    expect(sent().messages).toEqual([
      { role: "system", content: "You are a tutor." },
      { role: "user", content: "What is CRR?" },
    ]);
  });

  it("sends only the question when there is no system prompt", async () => {
    stubFetch(() => ok());
    await openrouter.ask({ prompt: "What is CRR?" });
    expect(sent().messages).toEqual([
      { role: "user", content: "What is CRR?" },
    ]);
  });

  it("puts earlier turns between the system prompt and the new question", async () => {
    stubFetch(() => ok());
    await openrouter.ask({
      system: "You are a tutor.",
      history: [
        { role: "user", content: "What is CRR?" },
        { role: "assistant", content: "Cash Reserve Ratio." },
      ],
      prompt: "And SLR?",
    });
    expect(sent().messages).toEqual([
      { role: "system", content: "You are a tutor." },
      { role: "user", content: "What is CRR?" },
      { role: "assistant", content: "Cash Reserve Ratio." },
      { role: "user", content: "And SLR?" },
    ]);
  });

  it("sends history with no system prompt", async () => {
    stubFetch(() => ok());
    await openrouter.ask({
      history: [{ role: "user", content: "hi" }],
      prompt: "again",
    });
    expect(sent().messages).toEqual([
      { role: "user", content: "hi" },
      { role: "user", content: "again" },
    ]);
  });

  it("uses the configured model when none is given", async () => {
    stubFetch(() => ok());
    await openrouter.ask({ prompt: "hi" });
    expect(modelsAsked()).toEqual([config.model]);
  });

  it("uses the model it is given instead", async () => {
    stubFetch(() => ok());
    await openrouter.ask({ prompt: "hi", model: "some/other" });
    expect(modelsAsked()).toEqual(["some/other"]);
  });

  it("takes one override and fills the rest from config", async () => {
    stubFetch(() => ok());
    await openrouter.ask({ prompt: "hi", temperature: 0 });
    expect(sent().temperature).toBe(0);
    expect(sent().model).toBe(config.model);
    expect(sent().max_tokens).toBe(config.maxTokens);
  });

  it("keeps the key out of the body", async () => {
    const f = stubFetch(() => ok());
    await openrouter.ask({ prompt: "hi" });
    expect(calls[0].body).not.toContain("test-key");
    expect((calls[0].headers as Record<string, string>).Authorization).toBe(
      "Bearer test-key",
    );
    expect(String(f.mock.calls[0][0])).not.toContain("test-key");
  });
});

describe("the answer", () => {
  it("converts the float cost to integer micro-dollars", async () => {
    stubFetch(() => ok());
    const r = await openrouter.ask({ prompt: "hi" });
    expect(r.costMicros).toBe(123);
    expect(Number.isInteger(r.costMicros)).toBe(true);
  });

  it("records the model that answered, not the one asked for", async () => {
    stubFetch(() => ok({ model: "anthropic/claude-sonnet-4.5-20991231" }));
    const r = await openrouter.ask({ prompt: "hi" });
    expect(r.model).toBe("anthropic/claude-sonnet-4.5-20991231");
  });

  it("fails rather than returning an empty answer", async () => {
    stubFetch(() => ok({ choices: [] }));
    await expect(openrouter.ask({ prompt: "hi" })).rejects.toMatchObject({
      kind: "upstream",
    });
  });

  it("fails clearly with no key", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
    const f = stubFetch(() => ok());
    await expect(openrouter.ask({ prompt: "hi" })).rejects.toBeInstanceOf(
      AiError,
    );
    expect(f).not.toHaveBeenCalled();
  });
});

describe("failure handling", () => {
  it("does not retry a bad key", async () => {
    stubFetch(() => bad(401));
    await expect(
      openrouter.ask({ prompt: "hi", fallbackModel: "backup/m" }),
    ).rejects.toMatchObject({ kind: "unauthorized" });
    expect(modelsAsked()).toEqual([config.model]);
  });

  it("does not retry a malformed request", async () => {
    const f = stubFetch(() => bad(400));
    await expect(openrouter.ask({ prompt: "hi" })).rejects.toMatchObject({
      kind: "bad_request",
    });
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("retries a 429 then succeeds", async () => {
    const f = stubFetch((n) => (n === 1 ? bad(429) : ok()));
    await openrouter.ask({ prompt: "hi" });
    expect(f).toHaveBeenCalledTimes(2);
  });

  // 408 was classified as bad_request and failed instantly, despite being
  // listed as retryable.
  it("retries a 408 rather than failing instantly", async () => {
    const f = stubFetch((n) => (n === 1 ? bad(408) : ok()));
    const r = await openrouter.ask({ prompt: "hi" });
    expect(r.text).toBe("hello");
    expect(f).toHaveBeenCalledTimes(2);
  });

  it("reports a timeout as a timeout", async () => {
    const boom = new Error("aborted");
    boom.name = "TimeoutError";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw boom;
      }),
    );
    await expect(openrouter.ask({ prompt: "hi" })).rejects.toMatchObject({
      kind: "timeout",
    });
  });
});

describe("fallback", () => {
  // AI_MODEL_FALLBACK was dead config: nothing read it unless the caller also
  // passed fallbackModel.
  it("uses the configured fallback without being asked", async () => {
    stubFetch((n) => (n <= config.maxAttempts ? bad(503) : ok()));
    await openrouter.ask({ prompt: "hi" });
    expect(modelsAsked().at(-1)).toBe(config.fallbackModel);
  });

  it("tries the fallback only after the primary is exhausted", async () => {
    stubFetch((n) => (n <= config.maxAttempts ? bad(503) : ok()));
    await openrouter.ask({
      prompt: "hi",
      model: "primary/m",
      fallbackModel: "backup/m",
    });
    expect(modelsAsked()).toEqual([
      ...Array(config.maxAttempts).fill("primary/m"),
      "backup/m",
    ]);
  });

  it("does not try the same model twice when it is also the fallback", async () => {
    const f = stubFetch(() => bad(503));
    await expect(
      openrouter.ask({
        prompt: "hi",
        model: "same/m",
        fallbackModel: "same/m",
      }),
    ).rejects.toBeInstanceOf(AiError);
    expect(new Set(modelsAsked())).toEqual(new Set(["same/m"]));
    expect(f).toHaveBeenCalledTimes(config.maxAttempts);
  });
});

describe("logging", () => {
  const lines = () =>
    [
      ...(console.log as unknown as { mock: { calls: unknown[][] } }).mock
        .calls,
      ...(console.warn as unknown as { mock: { calls: unknown[][] } }).mock
        .calls,
      ...(console.error as unknown as { mock: { calls: unknown[][] } }).mock
        .calls,
    ].map(([l]) => JSON.parse(l as string));

  it("records the model, duration and cost of a successful call", async () => {
    stubFetch(() => ok());
    await openrouter.ask({ prompt: "hi" });
    const entry = lines().find((l) => l.event === "openrouter.ok");
    expect(entry).toMatchObject({
      level: "info",
      model: "anthropic/claude-sonnet-4.5",
      costMicros: 123,
      promptTokens: 10,
      fellBack: false,
    });
    expect(typeof entry.ms).toBe("number");
  });

  // An operations log, not a transcript. A student's question and the tutor's
  // reply have no reason to sit in Vercel's log view.
  it("never writes the prompt, the history or the answer", async () => {
    stubFetch(() => ok());
    await openrouter.ask({
      system: "SYSTEM_MARKER",
      history: [{ role: "user", content: "HISTORY_MARKER" }],
      prompt: "PROMPT_MARKER",
    });
    const all = JSON.stringify(lines());
    expect(all).not.toContain("PROMPT_MARKER");
    expect(all).not.toContain("HISTORY_MARKER");
    expect(all).not.toContain("SYSTEM_MARKER");
    expect(all).not.toContain("hello");
  });

  it("records each failed attempt and the final failure", async () => {
    stubFetch(() => bad(503));
    await expect(openrouter.ask({ prompt: "hi" })).rejects.toBeInstanceOf(
      AiError,
    );
    const events = lines().map((l) => l.event);
    expect(events.filter((e) => e === "openrouter.attempt_failed").length).toBe(
      config.maxAttempts * 2,
    );
    expect(events).toContain("openrouter.failed");
  });

  it("says when the answer came from the fallback", async () => {
    stubFetch((n) => (n <= config.maxAttempts ? bad(503) : ok()));
    await openrouter.ask({ prompt: "hi" });
    expect(lines().find((l) => l.event === "openrouter.ok")).toMatchObject({
      fellBack: true,
    });
  });
});

describe("per-feature instances", () => {
  it("uses the instance default when the call does not say", async () => {
    stubFetch(() => ok());
    const marker = new OpenRouterClient({ temperature: 0, maxTokens: 1500 });
    await marker.ask({ prompt: "grade this" });
    expect(sent().temperature).toBe(0);
    expect(sent().max_tokens).toBe(1500);
  });

  it("lets a single call override its instance default", async () => {
    stubFetch(() => ok());
    const marker = new OpenRouterClient({ temperature: 0 });
    await marker.ask({ prompt: "hi", temperature: 0.9 });
    expect(sent().temperature).toBe(0.9);
  });

  it("falls through to config for anything the instance leaves unset", async () => {
    stubFetch(() => ok());
    const tutor = new OpenRouterClient({ temperature: 0.7 });
    await tutor.ask({ prompt: "hi" });
    expect(sent().temperature).toBe(0.7);
    expect(sent().model).toBe(config.model);
    expect(sent().max_tokens).toBe(config.maxTokens);
  });

  // The whole reason this is a class: two features configured differently, at
  // the same time, without either seeing the other's settings.
  it("keeps two features' settings apart", async () => {
    stubFetch(() => ok());
    const tutor = new OpenRouterClient({
      temperature: 0.7,
      model: "tutor/model",
    });
    const news = new OpenRouterClient({
      temperature: 0.3,
      model: "news/model",
    });

    await tutor.ask({ prompt: "hi" });
    await news.ask({ prompt: "hi" });
    await tutor.ask({ prompt: "hi" });

    expect(calls.map((c) => JSON.parse(c.body as string).temperature)).toEqual([
      0.7, 0.3, 0.7,
    ]);
    expect(modelsAsked()).toEqual(["tutor/model", "news/model", "tutor/model"]);
  });

  it("the default instance takes everything from config", async () => {
    stubFetch(() => ok());
    await openrouter.ask({ prompt: "hi" });
    expect(sent().model).toBe(config.model);
    expect(sent().temperature).toBe(config.temperature);
  });
});

const badWith = (status: number, headers: Record<string, string>) =>
  new Response("no", { status, headers });

describe("deadlines and attempt limits", () => {
  // The branch that stands between a user and a multi-minute hang.
  it("stops trying once the total deadline has passed", async () => {
    const f = stubFetch(() => bad(503));
    const slow = new OpenRouterClient({ totalTimeoutMs: 1 });
    await expect(slow.ask({ prompt: "hi" })).rejects.toBeInstanceOf(AiError);
    // One attempt at most: the deadline is blown before a second could start.
    expect(f.mock.calls.length).toBeLessThanOrEqual(2);
  });

  it("honours a per-instance attempt limit", async () => {
    const f = stubFetch(() => bad(503));
    const once = new OpenRouterClient({ maxAttempts: 1 });
    await expect(once.ask({ prompt: "hi" })).rejects.toBeInstanceOf(AiError);
    // One attempt on the primary, one on the fallback.
    expect(f).toHaveBeenCalledTimes(2);
  });

  it("still uses the config limit when the instance sets none", async () => {
    const f = stubFetch(() => bad(503));
    await expect(openrouter.ask({ prompt: "hi" })).rejects.toBeInstanceOf(
      AiError,
    );
    expect(f).toHaveBeenCalledTimes(config.maxAttempts * 2);
  });
});

describe("retry-after", () => {
  it("waits as long as the provider asked, not our guess", async () => {
    stubFetch((n) => (n === 1 ? badWith(429, { "retry-after": "0.4" }) : ok()));
    const client = new OpenRouterClient({ maxAttempts: 2 });
    const started = Date.now();
    await client.ask({ prompt: "hi" });
    // Our own backoff for attempt 1 tops out at 250ms, so this can only pass
    // if the header won.
    expect(Date.now() - started).toBeGreaterThanOrEqual(350);
  });

  it("ignores an absurd Retry-After rather than hanging", async () => {
    const f = stubFetch((n) =>
      n === 1 ? badWith(429, { "retry-after": "9999" }) : ok(),
    );
    const client = new OpenRouterClient({ maxAttempts: 2 });
    const started = Date.now();
    await client.ask({ prompt: "hi" });
    expect(Date.now() - started).toBeLessThan(1000);
    expect(f).toHaveBeenCalledTimes(2);
  });
});

describe("an unexpected throw", () => {
  // A malformed body makes response.json() throw a SyntaxError, which is not an
  // AiError. It must not be retried, and the log must keep its message.
  it("is not retried, and is logged with its detail rather than kind: undefined", async () => {
    const f = stubFetch(() => new Response("not json at all", { status: 200 }));
    await expect(openrouter.ask({ prompt: "hi" })).rejects.toBeInstanceOf(
      Error,
    );
    expect(f).toHaveBeenCalledTimes(1);

    const entry = [
      ...(console.error as unknown as { mock: { calls: unknown[][] } }).mock
        .calls,
    ]
      .map(([l]) => JSON.parse(l as string))
      .find((l) => l.event === "openrouter.failed");
    expect(entry.kind).toBe("unexpected");
    expect(entry.detail).toContain("SyntaxError");
  });
});

const slow = (ms: number, make: () => Response) => {
  let n = 0;
  const f = vi.fn(async (_u: RequestInfo | URL, init?: RequestInit) => {
    calls.push(init!);
    n++;
    await new Promise((r) => setTimeout(r, ms));
    return make();
  });
  vi.stubGlobal("fetch", f);
  return f;
};

const logged = () =>
  [
    ...(console.log as unknown as { mock: { calls: unknown[][] } }).mock.calls,
    ...(console.warn as unknown as { mock: { calls: unknown[][] } }).mock.calls,
    ...(console.error as unknown as { mock: { calls: unknown[][] } }).mock
      .calls,
  ].map(([l]) => JSON.parse(l as string));

describe("the total deadline is a real ceiling", () => {
  // A 60s Retry-After against a 200ms budget previously slept the full 60s:
  // the sleep was never clamped, so the deadline bounded nothing.
  it("does not sleep past the deadline on a large Retry-After", async () => {
    stubFetch((n) => (n === 1 ? badWith(429, { "retry-after": "2" }) : ok()));
    const client = new OpenRouterClient({
      totalTimeoutMs: 200,
      maxAttempts: 2,
    });
    const started = Date.now();
    // Whether the second attempt fits inside the remaining budget is a race, so
    // the outcome is not the assertion -- the elapsed time is.
    await client.ask({ prompt: "hi" }).catch(() => undefined);
    expect(Date.now() - started).toBeLessThan(1_000);
  });

  // Entering the fallback with no time left throws a synthetic "deadline
  // exceeded" that replaced the real reason the primary failed.
  it("keeps the real failure instead of a synthetic timeout", async () => {
    slow(200, () => bad(429));
    const client = new OpenRouterClient({
      totalTimeoutMs: 150,
      maxAttempts: 1,
    });
    await expect(client.ask({ prompt: "hi" })).rejects.toMatchObject({
      kind: "rate_limited",
    });
    expect(logged().find((l) => l.event === "openrouter.failed").kind).toBe(
      "rate_limited",
    );
  });
});

describe("cost reporting", () => {
  // OpenRouter sends cost on every response. An absent one silently reads as a
  // free call, and a spend cap built on it would be counting zeroes.
  it("says so when the provider reports no cost", async () => {
    stubFetch(() => ok({ usage: { prompt_tokens: 10, completion_tokens: 4 } }));
    const answer = await openrouter.ask({ prompt: "hi" });
    expect(answer.costMicros).toBe(0);
    expect(logged().map((l) => l.event)).toContain("openrouter.cost_missing");
  });

  it("stays quiet when cost is reported", async () => {
    stubFetch(() => ok());
    await openrouter.ask({ prompt: "hi" });
    expect(logged().map((l) => l.event)).not.toContain(
      "openrouter.cost_missing",
    );
  });
});
