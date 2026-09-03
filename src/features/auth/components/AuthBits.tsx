"use client";

import { AlertCircle, Settings2 } from "lucide-react";
import { Button } from "@/design-system";

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

export function AuthDivider() {
  return (
    <div className="text-ink-3 my-5 flex items-center gap-3 text-[12px] font-semibold tracking-[0.08em] uppercase before:h-px before:flex-1 before:bg-current/20 before:content-[''] after:h-px after:flex-1 after:bg-current/20 after:content-['']">
      or
    </div>
  );
}

export function AuthError({ message }: { message: string }) {
  return (
    <div
      className="rounded-ctl bg-bad-soft text-bad mt-4 flex items-start gap-2 px-3 py-2.5 text-[14px] leading-snug"
      role="alert"
    >
      <AlertCircle size={15} strokeWidth={2} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function SetupNotice() {
  return (
    <div className="rounded-ctl bg-warn-soft text-warn mt-4 flex items-start gap-2 px-3 py-2.5 text-[14px] leading-snug">
      <Settings2 size={15} strokeWidth={2} className="mt-0.5 shrink-0" />
      <span>
        Supabase isn't connected yet. Create a project at supabase.com, then add{" "}
        <code className="bg-ink/6 rounded px-1 py-0.5 text-[12px]">
          NEXT_PUBLIC_SUPABASE_URL
        </code>{" "}
        and{" "}
        <code className="bg-ink/6 rounded px-1 py-0.5 text-[12px]">
          NEXT_PUBLIC_SUPABASE_ANON_KEY
        </code>{" "}
        to{" "}
        <code className="bg-ink/6 rounded px-1 py-0.5 text-[12px]">
          .env.local
        </code>{" "}
        and restart the dev server.
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
      variant="secondary"
      block
      onClick={onClick}
      disabled={disabled}
    >
      <GoogleIcon />
      Continue with Google
    </Button>
  );
}
