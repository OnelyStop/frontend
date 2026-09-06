// Per-process: on serverless the real ceiling is (limit x instances).

const buckets = new Map<string, number[]>();

const MAX_KEYS = 10_000;

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): { ok: boolean; retryAfterMs: number } {
  // A key is only pruned when touched again, so sweep the rest or every user ever seen is retained.
  if (buckets.size > MAX_KEYS) {
    for (const [k, times] of buckets) {
      if (times.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }

  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    return { ok: false, retryAfterMs: windowMs - (now - hits[0]!) };
  }
  hits.push(now);
  buckets.set(key, hits);
  return { ok: true, retryAfterMs: 0 };
}

/** Test seam. */
export function _resetRateLimits() {
  buckets.clear();
}
