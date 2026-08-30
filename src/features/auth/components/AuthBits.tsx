"use client";

import { AlertCircle, Settings2 } from "lucide-react";
import { Button } from "@/components/marketing/Button";

export function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.35 0-4.34-1.58-5.05-3.71H.92v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.71a5.41 5.41 0 0 1 0-3.42V4.96H.92a9 9 0 0 0 0 8.08l3.03-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .92 4.96l3.03 2.33C4.66 5.16 6.65 3.58 9 3.58Z"
      />
    </svg>
  );
}

export function AuthError({ message }: { message: string }) {
  return (
    <div className="auth-form__error" role="alert">
      <AlertCircle size={15} strokeWidth={2} />
      <span>{message}</span>
    </div>
  );
}

export function SetupNotice() {
  return (
    <div className="auth-form__notice">
      <Settings2 size={15} strokeWidth={2} />
      <span>
        Supabase isn't connected yet. Create a project at supabase.com, then add{" "}
        <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>{" "}
        to <code>.env.local</code> and restart the dev server.
      </span>
    </div>
  );
}

export function GoogleButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className="auth-form__oauth"
      onClick={onClick}
      disabled={disabled}
      leftIcon={<GoogleIcon />}
    >
      Continue with Google
    </Button>
  );
}
