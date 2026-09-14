import { createHash } from "node:crypto";
import { normalizeText } from "./normalize";

export function contentHash(title: string, summary: string): string {
  const normalized = normalizeText(`${title} ${summary}`);
  return createHash("sha256").update(normalized).digest("hex");
}
