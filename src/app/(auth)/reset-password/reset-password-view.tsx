"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useAuthForm } from "@/features/auth/hooks/useAuthForm";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { AuthError, SetupNotice } from "@/features/auth/components/AuthBits";
import { Button, ButtonLink, Field, Input } from "@/design-system";
import { getAuthErrorFromUrl, type AuthUrlError } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

const MIN_PASSWORD_LENGTH = 8;

export function ResetPasswordView() {
  const { user, loading, configured, updatePassword } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [urlError, setUrlError] = useState<AuthUrlError | null>(null);

  useEffect(() => {
    setUrlError(getAuthErrorFromUrl());
  }, []);

  const { error, setError, busy, handleSubmit } = useAuthForm(
    () => updatePassword(password),
    () => router.replace("/home"),
  );

  const onSubmit = (e: FormEvent) => {
    if (password !== confirm) {
      e.preventDefault();
      setError("Those passwords don't match.");
      return;
    }
    void handleSubmit(e);
  };

  if (user) {
    return (
      <AuthShell
        title="Set a new password"
        subtitle="You'll stay signed in on this device once it's saved."
        footer={
          <>
            Changed your mind? <Link href="/home">Back to the app</Link>
          </>
        }
      >
        <form className="mt-6" onSubmit={onSubmit}>
          {!configured && <SetupNotice />}

          <div className="grid gap-3.5">
            <Field label="New password" htmlFor="reset-password">
              <Input
                id="reset-password"
                type="password"
                autoComplete="new-password"
                placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={MIN_PASSWORD_LENGTH}
                required
              />
            </Field>
            <Field label="Confirm password" htmlFor="reset-confirm">
              <Input
                id="reset-confirm"
                type="password"
                autoComplete="new-password"
                placeholder="Same again"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
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
            {busy ? "Saving…" : "Save new password"}
          </Button>
        </form>
      </AuthShell>
    );
  }

  if (!urlError && loading) {
    return (
      <AuthShell
        title="Checking your link"
        subtitle="One moment — verifying the reset link you clicked."
        footer={
          <>
            Taking too long?{" "}
            <Link href="/forgot-password">Request a new link</Link>
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

  return (
    <AuthShell
      title="That link can't be used"
      subtitle="Reset links are single-use and expire. Request a fresh one, and open it in the browser you asked from."
      footer={
        <>
          Remembered it? <Link href="/login">Back to sign in</Link>
        </>
      }
    >
      <div className="mt-6">
        <ButtonLink href="/forgot-password" size="lg" block>
          Request a new link
        </ButtonLink>
      </div>
    </AuthShell>
  );
}
