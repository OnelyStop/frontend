import { dayBack, istDayKey } from "@/lib/ist";

export const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export { dayBack, istDayKey };

export function todayIst(): string {
  return istDayKey(new Date());
}

// The oldest day a plan may open, inclusive. `days` of 7 means today plus six.
export const oldestDayAllowed = (today: string, days: number): string =>
  dayBack(today, days - 1);
