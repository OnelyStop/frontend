import { NextResponse } from "next/server";
import { requireUser, jsonError, readJson } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { db } from "@/db";
import { getEntitlement } from "@/features/billing/entitlements.server";
import { listDoubts } from "@/features/community/queries.server";
import { postDoubt } from "@/features/community/mutations.server";
import { doubtCreate, doubtQuery } from "@/features/community/types";

export async function GET(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const params = new URL(request.url).searchParams;
  const parsed = doubtQuery.safeParse({
    section: params.get("section") ?? undefined,
    sort: params.get("sort") ?? undefined,
    cursor: params.get("cursor") ?? undefined,
  });
  if (!parsed.success) return jsonError("invalid_query", 400);

  return NextResponse.json(await listDoubts(parsed.data));
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const limit = rateLimit(`doubt-post:${auth.userId}`, 5, 60_000);
  if (!limit.ok) return jsonError("rate_limited", 429);

  const parsed = doubtCreate.safeParse(await readJson(request));
  if (!parsed.success) return jsonError("invalid_body", 400);

  const { plan } = await getEntitlement(db, auth.userId);
  const outcome = await postDoubt(auth.userId, plan, parsed.data);
  if (!outcome.ok)
    return NextResponse.json(
      { error: outcome.reason, used: outcome.used, limit: outcome.limit },
      { status: 403 },
    );

  return NextResponse.json({ doubtId: outcome.doubtId }, { status: 201 });
}
