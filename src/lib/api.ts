import "server-only";
import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth.server";

// Every write path resolves the user here; no route reads a user id from the body.

export async function requireUser(): Promise<
  { userId: string } | { response: NextResponse }
> {
  const userId = await currentUserId();
  if (!userId)
    return {
      response: NextResponse.json({ error: "unauthorized" }, { status: 401 }),
    };
  return { userId };
}

export const jsonError = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

// A plain Response, not NextResponse: the cron routes need no-store on every
// reply and nothing else Next adds.
export const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
