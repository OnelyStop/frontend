import { useEffect, useState, type FormEvent } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAuthErrorFromUrl, hasPendingCodeExchange } from "../lib/supabase";
import { AuthShell } from "../components/auth/AuthShell";
import { AuthError } from "../components/auth/AuthBits";
import { Button } from "../components/ui/Button";

// Read once at module scope — the parser snapshots the hash before
// supabase-js clears it, but re-reading per render would still be wasteful
const urlError = getAuthErrorFromUrl();
// An OAuth round trip has to survive a network call to exchange the code,
// so give it materially longer than a magic-link hash that resolves locally
const SETTLE_MS = hasPendingCodeExchange() ? 8000 : 2500;

const EXPIRED_CODES = ["otp_expired", "access_denied"];

// Google returns this when the user closes or declines the consent screen —
// it isn't an expired link and shouldn't offer to resend one
const DENIED_CODES = ["provider_email_needs_verification", "user_denied"];

export function AuthCallbackPage() {
  const { user, loading, resendConfirmation } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [resent, setResent] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Give supabase-js a moment to exchange the token before deciding it failed
  const [settling, setSettling] = useState(!urlError);

  useEffect(() => {
    if (urlError) return;
    const timer = window.setTimeout(() => setSettling(false), SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (user) return <Navigate to="/home" replace />;

  if (!urlError && (loading || settling)) {
    return (
      <AuthShell
        title="Confirming your account"
        subtitle="One moment — verifying the link you clicked."
        footer={
          <>
            Taking too long? <Link to="/login">Go to sign in</Link>
          </>
        }
      >
        <div className="auth-form auth-confirm">
          <Loader2 size={40} className="auth-spinner" strokeWidth={1.5} />
        </div>
      </AuthShell>
    );
  }

  const denied = urlError && DENIED_CODES.includes(urlError.code);
  const expired =
    urlError && !denied && EXPIRED_CODES.includes(urlError.code);

  // A cancelled OAuth consent has no link to resend — send them back to sign in
  if (denied) {
    return (
      <AuthShell
        title="Sign-in was cancelled"
        subtitle="You didn't finish signing in with your provider. Nothing was changed on your account."
        footer={
          <>
            Prefer a password? <Link to="/signup">Create an account</Link>
          </>
        }
      >
        <div className="auth-form auth-confirm">
          <Button size="lg" className="auth-form__submit" onClick={() => navigate("/login")}>
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
        title="New link sent"
        subtitle={`Check ${email} for a fresh confirmation link.`}
        footer={
          <>
            Already confirmed? <Link to="/login">Sign in</Link>
          </>
        }
      >
        <div className="auth-form auth-confirm">
          <MailCheck size={48} strokeWidth={1.5} />
          <p className="auth-shell__subtitle">
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
          : urlError?.description ?? "Something went wrong verifying your link."
      }
      footer={
        <>
          Need a different account? <Link to="/signup">Sign up</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleResend}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="callback-email">Email</label>
            <input
              id="callback-email"
              type="email"
              autoComplete="email"
              placeholder="you@school.ac.uk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        {resendError && <AuthError message={resendError} />}

        <Button
          type="submit"
          size="lg"
          className="auth-form__submit"
          disabled={busy}
          leftIcon={
            busy ? <Loader2 size={16} className="auth-spinner" /> : undefined
          }
        >
          {busy ? "Sending…" : "Send a new link"}
        </Button>
      </form>
    </AuthShell>
  );
}
