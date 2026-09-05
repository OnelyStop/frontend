import { createHash } from "node:crypto";
import { normalizeText } from "./normalize";

// The cheapest dedup gate, checked first: an exact match is a re-fetched wire copy.
export function contentHash(title: string, summary: string): string {
  const normalized = normalizeText(`${title} ${summary}`);
  return createHash("sha256").update(normalized).digest("hex");
}
