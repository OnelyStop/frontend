// A `from` query value only ever names a page on this site. An absolute URL,
// a protocol-relative `//host`, or a backslash the browser reads as a slash
// would make the login page an open redirect, so those fall back.
const MAX_LENGTH = 2048;

export function safeInternalPath(candidate: unknown, fallback = "/home") {
  if (typeof candidate !== "string" || candidate.length > MAX_LENGTH)
    return fallback;
  if (!candidate.startsWith("/") || /^\/[/\\]/.test(candidate)) return fallback;
  if (/[\s\p{Cc}]/u.test(candidate)) return fallback;
  return candidate;
}
