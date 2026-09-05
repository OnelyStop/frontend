export type Cursor = { value: string; id: string };

export const encodeCursor = ({ value, id }: Cursor): string =>
  Buffer.from(`${value}|${id}`).toString("base64url");

// A cursor arrives from the query string, so it is caller-controlled. Anything
// that does not decode to both halves is dropped rather than trusted — the
// caller just gets the first page.
export function decodeCursor(cursor: string): Cursor | null {
  const parts = Buffer.from(cursor, "base64url").toString().split("|");
  if (parts.length !== 2) return null;
  const [value, id] = parts;
  if (!value || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  return { value, id };
}
