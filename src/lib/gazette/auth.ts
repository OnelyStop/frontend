import { timingSafeEqual } from "node:crypto";

/**
 * The `/internal/*` routes accept `Authorization: Bearer <CRON_SECRET>`.
 * Vercel Cron sends this automatically once CRON_SECRET is set in project env;
 * the same header lets an operator curl a manual re-run.
 *
 * Reads `process.env` directly rather than the validated `env` object: the auth
 * gate must not depend on DB / LLM keys being present. No secret configured →
 * nothing is authorized.
 */
export function isAuthorizedCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET ?? "";
  if (secret.length < 16) {
    console.error("[auth] CRON_SECRET is missing or too short");
    return false;
  }
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}
