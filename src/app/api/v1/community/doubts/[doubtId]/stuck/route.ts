import { NextResponse } from "next/server";
import { requireUser, jsonError } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { setStuck } from "@/features/community/mutations.server";

const UUID = /^[0-9a-f-]{36}$/i;

type Params = { params: Promise<{ doubtId: string }> };

async function toggle({ params }: Params, stuck: boolean) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const limit = rateLimit(`stuck:${auth.userId}`, 60, 60_000);
  if (!limit.ok) return jsonError("rate_limited", 429);

  const { doubtId } = await params;
  if (!UUID.test(doubtId)) return jsonError("not_found", 404);

  const result = await setStuck(auth.userId, doubtId, stuck);
  if (!result) return jsonError("not_found", 404);

  return NextResponse.json(result);
}

export const PUT = (_request: Request, ctx: Params) => toggle(ctx, true);

export const DELETE = (_request: Request, ctx: Params) => toggle(ctx, false);
