/* A best-effort in-memory sliding-window limiter.
 *
 * It is per-process, so on a serverless platform each instance keeps its own
 * count and the real ceiling is (limit x instances). That is acceptable for
 * what it guards here — tutor calls and note writes — where the goal is to blunt
 * a runaway client, not to meter exactly. A durable limit would be a Postgres
 * or Redis counter; noted as a known gap.
 */

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
