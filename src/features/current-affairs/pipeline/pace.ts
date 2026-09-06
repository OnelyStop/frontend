// Spaces LLM calls so a run never exceeds the key's requests-per-minute.
export type Pacer = {
  next: () => Promise<void>;
  delay: (ms: number) => void;
};

export function createPacer(
  rpm: number,
  deps: { now?: () => number; sleep?: (ms: number) => Promise<void> } = {},
): Pacer {
  const now = deps.now ?? Date.now;
  const sleep =
    deps.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  const interval = Math.ceil(60_000 / rpm);
  let nextStartAt = 0;

  return {
    // The slot is reserved before sleeping, so two callers cannot share a start.
    async next() {
      const start = Math.max(nextStartAt, now());
      nextStartAt = start + interval;
      const wait = start - now();
      if (wait > 0) await sleep(wait);
    },
    delay(ms) {
      nextStartAt = Math.max(nextStartAt, now() + ms);
    },
  };
}

// The shapes a provider's 429 takes; a bare number is milliseconds.
const RETRY_DELAY =
  /retry(?:_?delay|[\s-]?(?:after|in))[^0-9]*([0-9]+(?:\.[0-9]+)?)\s*(m?s)?/i;

export function retryDelayFromMessage(message: string): number | null {
  const m = RETRY_DELAY.exec(message);
  if (!m) return null;
  const n = Number(m[1]);
  return m[2] === "s" ? n * 1000 : n;
}
