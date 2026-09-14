"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useAuthForm } from "@/features/auth/hooks/useAuthForm";
import { useEnabledProviders } from "@/features/auth/hooks/useEnabledProviders";
import { AuthShell } from "@/app/(auth)/_sections/auth-shell";
import {
  AuthDivider,
  AuthError,
  GoogleButton,
  SetupNotice,
} from "@/features/auth/components/AuthBits";
import { Teddy, type TeddyMode } from "@/features/auth/components/Teddy";
import { Button, Field, Input } from "@/design-system";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function LoginView({ from }: { from: string }) {
  const { signIn, signInWithGoogle, user, configured } = useAuth();
  const { google: googleEnabled } = useEnabledProviders();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [focused, setFocused] = useState<"email" | "password" | null>(null);
  const [waving, setWaving] = useState(true);

  useEffect(() => {
    if (user) router.replace(from);
  }, [user, from, router]);

  // One hello per visit: three swings of the 0.55s wave, then the paw goes down for good.
  useEffect(() => {
    const t = setTimeout(() => setWaving(false), 1650);
    return () => clearTimeout(t);
  }, []);

  const teddyMode: TeddyMode =
    focused === "password"
      ? "password"
      : focused === "email"
        ? "email"
        : "idle";

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
      mascot={
        <Teddy
          mode={teddyMode}
          waving={waving}
          lookX={Math.min(email.length, 28) / 14 - 1}
        />
      }
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
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused(null)}
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
              onFocus={() => setFocused("password")}
              onBlur={() => setFocused(null)}
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
