"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useAuthForm } from "@/features/auth/hooks/useAuthForm";
import { AuthShell } from "@/features/auth/components/AuthShell";
import {
  AuthError,
  GoogleButton,
  SetupNotice,
} from "@/features/auth/components/AuthBits";
import { Button } from "@/components/ui/Button";
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
      subtitle="Pick up your path to A* where you left off."
      footer={
        <>
          New here? <Link href="/signup">Create an account</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        {!configured && <SetupNotice />}

        {googleEnabled && (
          <>
            <GoogleButton onClick={handleGoogle} disabled={busy} />
            <div className="auth-form__divider">or</div>
          </>
        )}

        <div className="form-grid">
          <div className="field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@school.ac.uk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="auth-form__meta">
              <Link href="/forgot-password">Forgot password?</Link>
            </div>
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
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}
