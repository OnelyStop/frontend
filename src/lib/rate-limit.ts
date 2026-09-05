// Per-process: on serverless the real ceiling is (limit x instances). Enough to
// blunt a runaway client, which is all it guards; a durable limit would be a
// Redis or Postgres counter.

const buckets = new Map<string, number[]>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): { ok: boolean; retryAfterMs: number } {
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    return { ok: false, retryAfterMs: windowMs - (now - hits[0]) };
  }
  hits.push(now);
  buckets.set(key, hits);
  return { ok: true, retryAfterMs: 0 };
}

/** Test seam. */
export function _resetRateLimits() {
  buckets.clear();
}
