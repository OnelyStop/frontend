import { NextResponse } from "next/server";
import { closeAccount } from "@/features/profile/account.server";
import { getMyProfile } from "@/features/profile/queries.server";
import { updateMyProfile } from "@/features/profile/mutations.server";
import { accountClose, profileUpdate } from "@/features/profile/types";
import { jsonError, readJson } from "@/lib/api";
import { currentUser } from "@/lib/auth.server";
import { rateLimit } from "@/lib/rate-limit";

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

// On 200 the session cookie names a user that no longer exists; the client
// signs out rather than this handler, so the browser client's own state goes
// with it.
export async function DELETE(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();

  const parsed = accountClose.safeParse(await readJson(request));
  if (!parsed.success) return jsonError("invalid_body", 400);
  if (parsed.data.confirmEmail.toLowerCase() !== user.email?.toLowerCase())
    return jsonError("email_mismatch", 400);

  if (!rateLimit(`account-delete:${user.id}`, 3, 60 * 60 * 1000).ok)
    return jsonError("rate_limited", 429);

  const outcome = await closeAccount(user.id);
  if (!outcome.ok) return jsonError(outcome.reason, 502);
  return NextResponse.json({ ok: true });
}
