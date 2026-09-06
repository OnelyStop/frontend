export type Cursor = { value: string; id: string };

export const encodeCursor = ({ value, id }: Cursor): string =>
  Buffer.from(`${value}|${id}`).toString("base64url");

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;

// Caller-controlled: a value that would not survive the keyset's cast gets page one, not a 500.
export function decodeCursor(cursor: string, sort?: string): Cursor | null {
  const parts = Buffer.from(cursor, "base64url").toString().split("|");
  if (parts.length !== 2) return null;
  const [value, id] = parts;
  if (!value || !id || !UUID.test(id)) return null;

  // Date.parse takes "42" for the year 2042, so match the shape the encoder writes.
  const ok =
    sort === "stuck"
      ? /^-?\d{1,9}$/.test(value)
      : ISO.test(value) && !Number.isNaN(Date.parse(value));
  return ok ? { value, id } : null;
}
