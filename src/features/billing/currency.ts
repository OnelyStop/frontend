import { headers } from "next/headers";
import type { Currency } from "./money";

export const DEFAULT_CURRENCY: Currency = "INR";

// An allowlist rather than a suffix test: `Host` arrives from the request, so a
// caller naming any host could otherwise pick the cheaper of the two prices.
const HOSTS: Record<string, Currency> = {
  "onelystop.in": "INR",
  "www.onelystop.in": "INR",
  "onelystop.com": "USD",
  "www.onelystop.com": "USD",
};

export function currencyForHost(host: string | null | undefined): Currency {
  if (!host) return DEFAULT_CURRENCY;
  const name = host.split(":")[0].trim().toLowerCase();
  return HOSTS[name] ?? DEFAULT_CURRENCY;
}

// SITE_CURRENCY must never become NEXT_PUBLIC_: a currency the client can read
// is a currency someone will try to send back.
export async function requestCurrency(): Promise<Currency> {
  const pinned = process.env.SITE_CURRENCY;
  if (pinned === "INR" || pinned === "USD") return pinned;

  const h = await headers();
  return currencyForHost(h.get("x-forwarded-host") ?? h.get("host"));
}
