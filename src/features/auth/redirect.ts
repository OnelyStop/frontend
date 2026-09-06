// An absolute, protocol-relative or backslashed `from` would make login an open redirect.
const MAX_LENGTH = 2048;

export function safeInternalPath(candidate: unknown, fallback = "/home") {
  if (typeof candidate !== "string" || candidate.length > MAX_LENGTH)
    return fallback;
  if (!candidate.startsWith("/") || /^\/[/\\]/.test(candidate)) return fallback;
  if (/[\s\p{Cc}]/u.test(candidate)) return fallback;
  return candidate;
}
