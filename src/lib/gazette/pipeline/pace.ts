// Spaces LLM call starts so a run never exceeds the key's requests-per-minute.
// Clock and sleep are injectable so the tests need no timers.
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
    // The slot is reserved before sleeping, so two concurrent callers cannot
    // both compute the same start time.
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

// "retryDelay: 30s", "Retry-After: 5000", "Please retry in 12.3s" — the shapes
// a provider's 429 takes. A bare number is milliseconds.
const RETRY_DELAY =
  /retry(?:_?delay|[\s-]?(?:after|in))[^0-9]*([0-9]+(?:\.[0-9]+)?)\s*(m?s)?/i;

export function retryDelayFromMessage(message: string): number | null {
  const m = RETRY_DELAY.exec(message);
  if (!m) return null;
  const n = Number(m[1]);
  return m[2] === "s" ? n * 1000 : n;
}
