// Computed from the two prices, so a hand-typed "55% off" cannot go stale.
const MIN_SHOWN = 5;

export function discountPercent(
  amountMinor: number,
  listAmountMinor: number | null,
): number | null {
  if (listAmountMinor === null || listAmountMinor <= amountMinor) return null;
  const pct = Math.round((1 - amountMinor / listAmountMinor) * 100);
  return pct >= MIN_SHOWN ? pct : null;
}
