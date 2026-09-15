import { dayBack, istDayKey } from "@/lib/ist";

export const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export { dayBack, istDayKey };

export function todayIst(): string {
  return istDayKey(new Date());
}

/** The window ends `delay` days back, not today: paid buys freshness, and free reads the same days late. */
export function allowedDays(
  today: string,
  days: number,
  delay = 0,
): { newest: string; oldest: string } {
  const newest = dayBack(today, delay);
  return { newest, oldest: dayBack(newest, days - 1) };
}
