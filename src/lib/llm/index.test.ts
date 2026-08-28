import { describe, expect, it, vi } from "vitest";

import { chat, getLlmClient } from "./index";
import { LlmError, type ChatOptions, type ChatResponse, type LlmClient } from "./types";

const OPTIONS: ChatOptions = {
  model: "primary/model",
  temperature: 0.5,
  maxTokens: 100,
  timeoutMs: 5_000,
};

const answer = (model: string): ChatResponse => ({
  text: "hello",
  model,
  promptTokens: 1,
  completionTokens: 1,
  costMicros: 1,
});

/** Records which model each attempt asked for, so order can be asserted. */
function fakeClient(behaviour: (model: string, call: number) => ChatResponse) {
  const asked: string[] = [];
  const client: LlmClient = {
    name: "fake",
    async chat(_messages, options) {
      asked.push(options.model);
      return behaviour(options.model, asked.length);
    },
  };
  return { client, asked };
}

const fail = (status: number) => {
  throw new LlmError(status === 401 ? "unauthorized" : status === 400 ? "bad_request" : "upstream", status, "no");
};

const send = (client: LlmClient, over: Partial<typeof OPTIONS> & { fallbackModel?: string } = {}) =>
  chat([{ role: "user", content: "hi" }], { ...OPTIONS, ...over, client, maxAttempts: 3 });

describe("chat", () => {
  it("returns the first success without retrying", async () => {
    const { client, asked } = fakeClient((m) => answer(m));
    const r = await send(client);
    expect(r.text).toBe("hello");
    expect(asked).toEqual(["primary/model"]);
  });

  it("retries a transient failure and then succeeds", async () => {
    const { client, asked } = fakeClient((m, call) => {
      if (call === 1) fail(503);
      return answer(m);
    });
    await send(client);
    expect(asked).toEqual(["primary/model", "primary/model"]);
  });

  it("does not retry a bad key", async () => {
    const { client, asked } = fakeClient(() => fail(401));
    await expect(send(client, { fallbackModel: "backup/model" }))
      .rejects.toMatchObject({ kind: "unauthorized" });
    // Fails identically on every model, so retrying or falling back only costs
    // time and money.
    expect(asked).toEqual(["primary/model"]);
  });

  it("does not retry a malformed request", async () => {
    const { client, asked } = fakeClient(() => fail(400));
    await expect(send(client, { fallbackModel: "backup/model" }))
      .rejects.toMatchObject({ kind: "bad_request" });
    expect(asked).toEqual(["primary/model"]);
  });

  it("falls back only after the primary is exhausted", async () => {
    const { client, asked } = fakeClient((m) => {
      if (m === "primary/model") fail(503);
      return answer(m);
    });
    const r = await send(client, { fallbackModel: "backup/model" });
    expect(r.model).toBe("backup/model");
    expect(asked).toEqual([
      "primary/model",
      "primary/model",
      "primary/model",
      "backup/model",
    ]);
  });

  it("never invents a fallback where none is configured", async () => {
    const { client, asked } = fakeClient(() => fail(503));
    await expect(send(client)).rejects.toBeInstanceOf(LlmError);
    expect(new Set(asked)).toEqual(new Set(["primary/model"]));
  });
});

describe("getLlmClient", () => {
  it("returns the configured provider", () => {
    expect(getLlmClient("openrouter").name).toBe("openrouter");
  });

  // A typo in LLM_PROVIDER must fail loudly at the call, not silently pick a
  // default the operator did not ask for.
  it("rejects an unknown provider by name", () => {
    expect(() => getLlmClient("groc")).toThrow(/groc/);
  });
});
