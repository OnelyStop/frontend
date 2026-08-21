import { headers } from "next/headers";

import type { currencyCode } from "@/db/schema";

export type Currency = (typeof currencyCode.enumValues)[number];

export const DEFAULT_CURRENCY: Currency = "USD";

// Which domain sells in which currency. An allowlist rather than a suffix test:
// `Host` arrives from the request, and a caller who can name any host could
// otherwise pick whichever of the two price points is cheaper for them.
const HOSTS: Record<string, Currency> = {
  "onelystop.in": "INR",
  "www.onelystop.in": "INR",
  "onelystop.com": "USD",
  "www.onelystop.com": "USD",
};

/**
 * The currency a given host sells in.
 *
 * Unknown hosts — previews, localhost, anything spoofed — fall back to the
 * default rather than being parsed for a country. Guessing from an unrecognised
 * host is how you end up honouring `Host: onelystop.in` on a request that never
 * touched that domain.
 */
export function currencyForHost(host: string | null | undefined): Currency {
  if (!host) return DEFAULT_CURRENCY;
  // Strip the port so localhost:3000 and a proxied :443 look the same.
  const name = host.split(":")[0].trim().toLowerCase();
  return HOSTS[name] ?? DEFAULT_CURRENCY;
}

/**
 * The currency for the request being handled.
 *
 * `SITE_CURRENCY` wins where it is set. A deployment that serves exactly one
 * domain can state its currency in the environment, which no request can
 * influence; host-sniffing is the fallback for a single deployment answering
 * both domains. Server-only on purpose — never a NEXT_PUBLIC_ var, because a
 * currency the client can read is a currency someone will try to send back.
 */
export async function requestCurrency(): Promise<Currency> {
  const pinned = process.env.SITE_CURRENCY;
  if (pinned === "INR" || pinned === "USD") return pinned;

  const h = await headers();
  // x-forwarded-host is what the platform rewrites to the real domain when the
  // request has been through a proxy; host is the direct case.
  return currencyForHost(h.get("x-forwarded-host") ?? h.get("host"));
}

const SYMBOLS: Record<Currency, string> = { INR: "₹", USD: "$" };

/** Minor units to something a person reads. Display only — never arithmetic. */
export function formatAmount(amountMinor: number, currency: Currency): string {
  const major = amountMinor / 100;
  const shown = Number.isInteger(major) ? major.toString() : major.toFixed(2);
  return `${SYMBOLS[currency]}${shown}`;
}
