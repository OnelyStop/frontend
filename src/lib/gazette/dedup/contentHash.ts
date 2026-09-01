import { createHash } from "node:crypto";
import { normalizeText } from "./normalize";

/**
 * sha256 of the normalized `title + summary`. An exact match means the same
 * wire copy was re-fetched — the cheapest dedup gate, checked first.
 */
export function contentHash(title: string, summary: string): string {
  const normalized = normalizeText(`${title} ${summary}`);
  return createHash("sha256").update(normalized).digest("hex");
}
