export type Cursor = { value: string; id: string };

export const encodeCursor = ({ value, id }: Cursor): string =>
  Buffer.from(`${value}|${id}`).toString("base64url");

// Caller-controlled: anything that does not decode to both halves gets page one.
export function decodeCursor(cursor: string): Cursor | null {
  const parts = Buffer.from(cursor, "base64url").toString().split("|");
  if (parts.length !== 2) return null;
  const [value, id] = parts;
  if (!value || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  return { value, id };
}
