"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
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

export function LoginView({ from }: { from: string }) {
  const { signIn, signInWithGoogle, user, configured, googleEnabled } =
    useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Already signed in (e.g. hit /login directly with a live session)
  useEffect(() => {
    if (user) router.replace(from);
  }, [user, from, router]);

  const { error, setError, busy, handleSubmit } = useAuthForm(
    () => signIn(email, password),
    () => router.replace(from),
  );

  const handleGoogle = async () => {
    setError(null);
    const { error: err } = await signInWithGoogle();
    if (err) setError(err);
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Pick up where you left off."
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="text-ink font-medium">
            Create an account
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
          <Field label="Email" htmlFor="login-email">
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field label="Password" htmlFor="login-password">
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="mt-2 flex justify-end">
              <Link
                href="/forgot-password"
                className="text-ink-2 hover:text-ink text-[12.5px]"
              >
                Forgot password?
              </Link>
            </div>
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
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}
