import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MODELS } from "./models";
import { AiError, complete } from "./openrouter.server";

const ok = (body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status: 200 });

const reply = (over: Record<string, unknown> = {}) =>
  ok({
    model: "anthropic/claude-sonnet-4.5",
    choices: [{ message: { content: "hello" } }],
    usage: { prompt_tokens: 10, completion_tokens: 4, cost: 0.000123 },
    ...over,
  });

const fail = (status: number) => new Response("upstream said no", { status });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  process.env.OPENROUTER_API_KEY = "test-key";
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.OPENROUTER_API_KEY;
});

const ask = () => complete("tutor", [{ role: "user", content: "hi" }]);

describe("complete", () => {
  it("calls OpenRouter at all", async () => {
    fetchMock.mockImplementation(() => reply());
    await ask();
    // Premise guard: every assertion below is worthless if the stub is unused.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("https://openrouter.ai/api/v1/chat/completions");
  });

  it("converts the float cost to integer micro-dollars", async () => {
    fetchMock.mockImplementation(() => reply());
    const r = await ask();
    // 0.000123 credits -> 123 micro-dollars, as an integer.
    expect(r.costMicros).toBe(123);
    expect(Number.isInteger(r.costMicros)).toBe(true);
  });

  it("records the model that answered, not the one requested", async () => {
    fetchMock.mockImplementation(() => reply({ model: "anthropic/claude-sonnet-4.5-20991231" }));
    const r = await ask();
    expect(r.model).toBe("anthropic/claude-sonnet-4.5-20991231");
  });

  it("sends the profile's temperature and token ceiling", async () => {
    fetchMock.mockImplementation(() => reply());
    await ask();
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.temperature).toBe(MODELS.tutor.temperature);
    expect(body.max_tokens).toBe(MODELS.tutor.maxTokens);
    expect(body.model).toBe(MODELS.tutor.model);
  });

  it("never puts the key anywhere but the Authorization header", async () => {
    fetchMock.mockImplementation(() => reply());
    await ask();
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).not.toContain("test-key");
    expect(init.body).not.toContain("test-key");
    expect(init.headers.Authorization).toBe("Bearer test-key");
  });

  it("retries a 429 and then succeeds", async () => {
    fetchMock.mockImplementationOnce(() => fail(429)).mockImplementationOnce(() => reply());
    const r = await ask();
    expect(r.text).toBe("hello");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry a bad key", async () => {
    fetchMock.mockImplementation(() => fail(401));
    await expect(ask()).rejects.toMatchObject({ kind: "unauthorized" });
    // Retrying or falling back would burn time and money on a request that
    // fails identically on every model.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not retry a malformed request", async () => {
    fetchMock.mockImplementation(() => fail(400));
    await expect(ask()).rejects.toMatchObject({ kind: "bad_request" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to the second model when the first keeps failing", async () => {
    fetchMock
      .mockImplementationOnce(() => fail(503))
      .mockImplementationOnce(() => fail(503))
      .mockImplementationOnce(() => fail(503))
      .mockImplementationOnce(() => reply({ model: MODELS.tutor.fallback }));
    const r = await ask();
    expect(r.model).toBe(MODELS.tutor.fallback);
    const asked = fetchMock.mock.calls.map((c) => JSON.parse(c[1].body).model);
    expect(asked).toEqual([
      MODELS.tutor.model,
      MODELS.tutor.model,
      MODELS.tutor.model,
      MODELS.tutor.fallback,
    ]);
  });

  it("does not invent a fallback for a profile without one", async () => {
    fetchMock.mockImplementation(() => fail(503));
    await expect(
      complete("newsQuestions", [{ role: "user", content: "hi" }]),
    ).rejects.toBeInstanceOf(AiError);
    const asked = new Set(fetchMock.mock.calls.map((c) => JSON.parse(c[1].body).model));
    // Unattended work must not silently escalate to a costlier model.
    expect([...asked]).toEqual([MODELS.newsQuestions.model]);
  });

  it("reports a timeout as a timeout", async () => {
    const timeout = new Error("aborted");
    timeout.name = "TimeoutError";
    fetchMock.mockRejectedValue(timeout);
    await expect(ask()).rejects.toMatchObject({ kind: "timeout" });
  });

  it("fails rather than returning an empty answer", async () => {
    fetchMock.mockImplementation(() => ok({ model: "x", choices: [], usage: {} }));
    await expect(ask()).rejects.toMatchObject({ kind: "upstream" });
  });

  it("fails clearly when the key is missing", async () => {
    delete process.env.OPENROUTER_API_KEY;
    await expect(ask()).rejects.toMatchObject({ kind: "unauthorized" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
