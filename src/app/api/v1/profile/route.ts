import { NextResponse } from "next/server";
import { getMyProfile } from "@/features/profile/queries.server";
import { updateMyProfile } from "@/features/profile/mutations.server";
import { profileUpdate } from "@/features/profile/types";

const unauthorized = () =>
  NextResponse.json({ error: "unauthorized" }, { status: 401 });

export async function GET() {
  const profile = await getMyProfile();
  if (!profile) return unauthorized();
  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = profileUpdate.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.issues },
      { status: 400 },
    );
  if (Object.keys(parsed.data).length === 0)
    return NextResponse.json({ error: "nothing_to_update" }, { status: 400 });

  const profile = await updateMyProfile(parsed.data);
  if (!profile) return unauthorized();
  return NextResponse.json({ profile });
}
