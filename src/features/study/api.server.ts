import "server-only";
import { NextResponse } from "next/server";
import { currentUserId } from "./auth.server";

/* Shared shapes for the /api/study route handlers. Every write path resolves
   the user here and scopes on the returned id; no route reads a user id from
   the request body (spec §11). */

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

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
