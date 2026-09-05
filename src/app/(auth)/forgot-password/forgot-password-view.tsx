"use client";

import { useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useAuthForm } from "@/features/auth/hooks/useAuthForm";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { AuthError, SetupNotice } from "@/features/auth/components/AuthBits";
import { Button, Field, Input } from "@/design-system";
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
          Remembered it?{" "}
          <Link href="/login" className="text-ink font-medium">
            Back to sign in
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="mt-6 text-center">
          <MailCheck
            size={48}
            strokeWidth={1.5}
            className="text-brand mx-auto"
          />
        </div>
      ) : (
        <form className="mt-6" onSubmit={handleSubmit}>
          {!configured && <SetupNotice />}

          <Field label="Email" htmlFor="reset-email">
            <Input
              id="reset-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>

          {error && <AuthError message={error} />}

          <Button
            type="submit"
            size="lg"
            block
            className="mt-5"
            disabled={busy || !configured}
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : null}
            {busy ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
