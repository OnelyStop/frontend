"use client";

import { useEffect, useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useAuthForm } from "@/features/auth/hooks/useAuthForm";
import { AuthShell } from "@/features/auth/components/AuthShell";
import {
  AuthDivider,
  AuthError,
  GoogleButton,
  SetupNotice,
} from "@/features/auth/components/AuthBits";
import { Button, Field, Input } from "@/design-system";
import Link from "next/link";
import { useRouter } from "next/navigation";

const MIN_PASSWORD_LENGTH = 8;

export function SignupView() {
  const { signUp, signInWithGoogle, user, configured, googleEnabled } =
    useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (user) router.replace("/home");
  }, [user, router]);

  const { error, setError, busy, handleSubmit } = useAuthForm(
    () => signUp(email, password, name),
    (result) => {
      // Supabase withholds the session when email confirmation is required
      if (result.needsConfirmation) setSent(true);
      else router.replace("/home");
    },
  );

  const handleGoogle = async () => {
    setError(null);
    const { error: err } = await signInWithGoogle();
    if (err) setError(err);
  };

  if (sent) {
    return (
      <AuthShell
        title="Check your email"
        subtitle={`We sent a confirmation link to ${email}. Click it to activate your account.`}
        footer={
          <>
            Wrong address?{" "}
            <Link href="/signup" className="text-ink font-medium">
              Try again
            </Link>
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
            The link expires in 24 hours. Check your spam folder if it hasn't
            arrived in a couple of minutes.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Start revising free"
      subtitle="No card needed. Your first marked answer is on us."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-ink font-medium">
            Sign in
          </Link>
        </>
      }
    >
      <form className="mt-6" onSubmit={handleSubmit}>
        {!configured && <SetupNotice />}

        {googleEnabled && (
          <>
            <GoogleButton onClick={handleGoogle} disabled={busy} />
            <AuthDivider />
          </>
        )}

        <div className="grid gap-3.5">
          <Field label="Full name" htmlFor="signup-name">
            <Input
              id="signup-name"
              type="text"
              autoComplete="name"
              placeholder="Aarav Mehta"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>
          <Field label="Email" htmlFor="signup-email">
            <Input
              id="signup-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field label="Password" htmlFor="signup-password">
            <Input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={MIN_PASSWORD_LENGTH}
              required
            />
          </Field>
        </div>

        {error && <AuthError message={error} />}

        <Button
          type="submit"
          size="lg"
          block
          className="mt-5"
          disabled={busy || !configured}
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : null}
          {busy ? "Creating account…" : "Create free account"}
        </Button>
      </form>
    </AuthShell>
  );
}
