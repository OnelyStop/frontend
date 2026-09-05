"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import {
  getAuthErrorFromUrl,
  hasPendingCodeExchange,
  type AuthUrlError,
} from "@/lib/supabase";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { AuthError } from "@/features/auth/components/AuthBits";
import { Button, Field, Input } from "@/design-system";
import Link from "next/link";
import { useRouter } from "next/navigation";

const EXPIRED_CODES = ["otp_expired"];

// A cancelled Google consent arrives as error=access_denied with no
// error_code, whereas an expired link always carries error_code=otp_expired —
// so bare access_denied means the user backed out and there is no link to
// resend.
const DENIED_CODES = ["access_denied", "provider_email_needs_verification"];

export function CallbackView() {
  const { user, loading, resendConfirmation } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [resent, setResent] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [urlError, setUrlError] = useState<AuthUrlError | null>(null);
  const [hadCode, setHadCode] = useState(false);

  // Fragments never reach the server, so reading during render would make SSR
  // and hydration disagree.
  useEffect(() => {
    setUrlError(getAuthErrorFromUrl());
    setHadCode(hasPendingCodeExchange());
  }, []);

  useEffect(() => {
    if (user) router.replace("/home");
  }, [user, router]);

  // `loading` covers the PKCE exchange — getSession waits for it — so once it
  // clears with no user the link really did fail.
  if (!urlError && (loading || user)) {
    return (
      <AuthShell
        title="Confirming your account"
        subtitle="One moment — verifying the link you clicked."
        footer={
          <>
            Taking too long? <Link href="/login">Go to sign in</Link>
          </>
        }
      >
        <div className="mt-6 text-center">
          <Loader2
            size={40}
            strokeWidth={1.5}
            className="text-brand mx-auto animate-spin"
          />
        </div>
      </AuthShell>
    );
  }

  const denied = urlError && DENIED_CODES.includes(urlError.code);
  const expired = urlError && !denied && EXPIRED_CODES.includes(urlError.code);
  const openedElsewhere = !urlError && hadCode;

  // A cancelled OAuth consent has no link to resend — send them back to sign in
  if (denied) {
    return (
      <AuthShell
        title="Sign-in was cancelled"
        subtitle="You didn't finish signing in with your provider. Nothing was changed on your account."
        footer={
          <>
            Prefer a password? <Link href="/signup">Create an account</Link>
          </>
        }
      >
        <div className="mt-6">
          <Button size="lg" block onClick={() => router.push("/login")}>
            Back to sign in
          </Button>
        </div>
      </AuthShell>
    );
  }

  const handleResend = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setResendError(null);
    const { error } = await resendConfirmation(email);
    setBusy(false);
    if (error) {
      setResendError(error);
      return;
    }
    setResent(true);
  };

  if (resent) {
    return (
      <AuthShell
        title="Check your email"
        subtitle={`If ${email} still needs confirming, a fresh link is on its way.`}
        footer={
          <>
            Already confirmed? <Link href="/login">Sign in</Link>
          </>
        }
      >
        <div className="mt-6 text-center">
          <MailCheck
            size={48}
            strokeWidth={1.5}
            className="text-brand mx-auto mb-3.5"
          />
          <p className="text-ink-2 text-[14px]">
            Open it promptly — confirmation links are single-use and expire.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={expired ? "That link has expired" : "We couldn't verify that link"}
      subtitle={
        expired
          ? "Confirmation links are single-use and time-limited. Enter your email and we'll send a fresh one."
          : openedElsewhere
            ? "This link only works in the browser the account was created from. Open it there, or enter your email below and we'll send a new one."
            : "Something went wrong verifying your link. Enter your email and we'll send a fresh one."
      }
      footer={
        <>
          Need a different account? <Link href="/signup">Sign up</Link>
        </>
      }
    >
      <form className="mt-6" onSubmit={handleResend}>
        <Field label="Email" htmlFor="callback-email">
          <Input
            id="callback-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>

        {resendError && <AuthError message={resendError} />}

        <Button type="submit" size="lg" block className="mt-5" disabled={busy}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : null}
          {busy ? "Sending…" : "Send a new link"}
        </Button>
      </form>
    </AuthShell>
  );
}
