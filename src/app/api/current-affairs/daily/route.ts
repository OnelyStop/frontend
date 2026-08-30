// Same-origin proxy to the Gazette Engine backend. Keeps GAZETTE_API_URL (and
// the fact that there's a separate service at all) out of the browser bundle,
// and sidesteps CORS. Server env var — never NEXT_PUBLIC_.
export const dynamic = "force-dynamic";

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  const base = process.env.GAZETTE_API_URL;
  if (!base) {
    return Response.json(
      { error: "GAZETTE_API_URL is not configured" },
      { status: 503 },
    );
  }

  const incoming = new URL(request.url);
  const day = incoming.searchParams.get("extracted_day");
  const limit = incoming.searchParams.get("limit");

  const target = new URL("/v1/questions/daily", base);
  if (day && DAY_RE.test(day)) target.searchParams.set("extracted_day", day);
  if (limit) target.searchParams.set("limit", limit);

  try {
    const res = await fetch(target, {
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    return new Response(await res.text(), {
      status: res.status,
      headers: { "content-type": "application/json" },
    });
  } catch {
    return Response.json(
      { error: "Gazette Engine is unreachable" },
      { status: 502 },
    );
  }
}
