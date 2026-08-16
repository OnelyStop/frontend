"use client";

import { useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useAuthForm } from "@/features/auth/hooks/useAuthForm";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { AuthError, SetupNotice } from "@/features/auth/components/AuthBits";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export function ForgotPasswordView() {
  const { resetPassword, configured } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const { error, busy, handleSubmit } = useAuthForm(
    () => resetPassword(email),
    () => setSent(true),
  );

  return (
    <AuthShell
      title={sent ? "Check your email" : "Reset your password"}
      subtitle={
        sent
          ? `If an account exists for ${email}, a reset link is on its way.`
          : "We'll email you a link to set a new one."
      }
      footer={
        <>
          Remembered it? <Link href="/login">Back to sign in</Link>
        </>
      }
    >
      {sent ? (
        <div className="auth-form auth-confirm">
          <MailCheck size={48} strokeWidth={1.5} />
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          {!configured && <SetupNotice />}

          <div className="form-grid">
            <div className="field">
              <label htmlFor="reset-email">Email</label>
              <input
                id="reset-email"
                type="email"
                autoComplete="email"
                placeholder="you@school.ac.uk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {error && <AuthError message={error} />}

          <Button
            type="submit"
            size="lg"
            className="auth-form__submit"
            disabled={busy || !configured}
            leftIcon={
              busy ? <Loader2 size={16} className="auth-spinner" /> : undefined
            }
          >
            {busy ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
