// The fill is the same signal the exam switcher dot already carries.
export const SECTION_TINT = [
  "bg-quant-soft",
  "bg-reasoning-soft",
  "bg-english-soft",
  "bg-ga-soft",
  "bg-computer-soft",
  "bg-info-soft",
] as const;

/** Stable per key, so a subject keeps its colour between renders and sessions. */
export function tintFor(key: string): string {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return SECTION_TINT[Math.abs(h) % SECTION_TINT.length];
}
