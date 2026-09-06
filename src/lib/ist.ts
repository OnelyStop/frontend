/** Every cutoff, quota window and edition is IST, and a UTC-derived day is wrong for five and a half hours out of every twenty-four. */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** The IST calendar date of an instant, as `YYYY-MM-DD`. */
export function istDayKey(at: Date): string {
  return new Date(at.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** The first IST calendar date of the month an instant falls in. */
export function istMonthStartKey(at: Date): string {
  return `${istDayKey(at).slice(0, 7)}-01`;
}

/** `n` calendar days before an IST date key — never an elapsed-hours subtraction. */
export function dayBack(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

/** The instant an IST calendar date begins, as a UTC `Date`. */
export const startOfIstDay = (day: string): Date =>
  new Date(`${day}T00:00:00+05:30`);
