// The badge is computed from the two prices, never written as a string beside
// them: "55% off" typed by hand next to a price that later changes is a claim
// the product cannot honour.
const MIN_SHOWN = 5;

export function discountPercent(
  amountMinor: number,
  listAmountMinor: number | null,
): number | null {
  if (listAmountMinor === null || listAmountMinor <= amountMinor) return null;
  const pct = Math.round((1 - amountMinor / listAmountMinor) * 100);
  return pct >= MIN_SHOWN ? pct : null;
}
