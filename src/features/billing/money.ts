import type { currencyCode } from "@/db/schema";

export type Currency = (typeof currencyCode.enumValues)[number];

const LOCALE: Record<Currency, string> = { INR: "en-IN", USD: "en-US" };

/** Minor units to something a person reads. Display only — never arithmetic. */
export function formatAmount(amountMinor: number, currency: Currency): string {
  const major = amountMinor / 100;
  return new Intl.NumberFormat(LOCALE[currency], {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(major) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(major);
}
