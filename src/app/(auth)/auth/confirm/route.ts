import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { safeInternalPath } from "@/features/auth/redirect";
import { createClient } from "@/lib/supabase-server";

// A PKCE code only verifies in the browser that requested it; a token hash
// verifies anywhere, so the email templates link here and /auth/callback
// stays for OAuth.
//
// EmailOtpType is widened with `string & {}`, so the type alone accepts any
// value; the allow-list is what keeps an arbitrary `type` off verifyOtp.
const EMAIL_LINK_TYPES = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
] as const satisfies readonly EmailOtpType[];

type EmailLinkType = (typeof EMAIL_LINK_TYPES)[number];

function isEmailLinkType(value: string | null): value is EmailLinkType {
  return (EMAIL_LINK_TYPES as readonly string[]).includes(value ?? "");
}

// Both landing pages already render this pair as an expired link.
const EXPIRED = "error=access_denied&error_code=otp_expired";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next");

  const redirectTo = (path: string) =>
    NextResponse.redirect(new URL(path, request.url), 303);

  if (!tokenHash || !isEmailLinkType(type)) {
    return redirectTo(`/auth/callback?${EXPIRED}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });

  if (type === "recovery") {
    return redirectTo(error ? `/reset-password?${EXPIRED}` : "/reset-password");
  }
  return redirectTo(
    error ? `/auth/callback?${EXPIRED}` : safeInternalPath(next),
  );
}
