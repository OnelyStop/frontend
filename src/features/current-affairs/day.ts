export const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// Everything in the pipeline is keyed to the IST calendar day the news broke.
export function istDayKey(d: Date): string {
  return new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

export function todayIst(): string {
  return istDayKey(new Date());
}
