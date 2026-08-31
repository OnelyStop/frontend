import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// Same-origin proxy to the Gazette Engine backend. Keeps GAZETTE_API_URL (and
// the fact that there's a separate service at all) out of the browser bundle,
// and sidesteps CORS. Server env var — never NEXT_PUBLIC_.
export const dynamic = "force-dynamic";

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

// Local-only escape hatch for testing without an account.
// Refuses to engage in a production build, so it cannot be turned on by a stray
// env var on a deployed instance. Server-side only — never NEXT_PUBLIC_.
const AUTH_DISABLED =
  process.env.AUTH_DISABLED === "true" && process.env.NODE_ENV !== "production";

export async function GET(request: Request) {
  // The proxy only guards page routes, so the API authenticates itself.
  if (!AUTH_DISABLED) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const base = process.env.GAZETTE_API_URL;
  if (!base) {
    return NextResponse.json(
      { error: "GAZETTE_API_URL is not configured" },
      { status: 503 },
    );
  }

  const incoming = new URL(request.url);
  const day = incoming.searchParams.get("extracted_day");
  const limit = incoming.searchParams.get("limit");

  const target = new URL("/v1/questions/daily", base);
  if (day && DAY_RE.test(day)) target.searchParams.set("extracted_day", day);
  
  // Clamp limit to a reasonable range to prevent unbounded requests
  const parsedLimit = Number(limit) || DEFAULT_LIMIT;
  const clampedLimit = Math.min(Math.max(parsedLimit, 1), MAX_LIMIT);
  target.searchParams.set("limit", String(clampedLimit));

  try {
    const res = await fetch(target, {
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    return new NextResponse(await res.text(), {
      status: res.status,
      headers: { "content-type": "application/json" },
    });
  } catch {
    return NextResponse.json(
      { error: "Gazette Engine is unreachable" },
      { status: 502 },
    );
  }
}
