"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input, SectionTitle } from "@/design-system";
import { useAuth } from "@/features/auth/AuthContext";

const ERRORS: Record<string, string> = {
  email_mismatch: "That doesn't match the email on this account.",
  billing_unavailable:
    "We couldn't reach the payment provider to cancel your plan. Try again in a minute.",
  rate_limited: "Too many attempts. Try again later.",
};

export function CloseAccountCard() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [confirmEmail, setConfirmEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const email = user?.email?.toLowerCase();
  const matches = !!email && confirmEmail.trim().toLowerCase() === email;

  const close = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/profile", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirmEmail: confirmEmail.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(
          ERRORS[body?.error] ??
            (res.status === 429
              ? ERRORS.rate_limited
              : "Could not close the account. Try again."),
        );
        setBusy(false);
        return;
      }
      // Stays busy: the account is gone and the page is about to be left.
      await signOut();
      router.replace("/");
    } catch {
      setError("Could not reach the server.");
      setBusy(false);
    }
  };

  return (
    <Card className="mt-5">
      <SectionTitle>Close account</SectionTitle>
      <p className="text-ink-3 -mt-2 mb-4 max-w-[60ch] text-[13px]">
        Deletes your mocks, drills, notes, doubts and marks, and cancels Pro.
        Payment records stay with Razorpay, as tax law requires. This cannot be
        undone.
      </p>
      <div className="max-w-sm">
        <Field
          label="Type your email to confirm"
          htmlFor="confirmEmail"
          error={error ?? undefined}
        >
          <Input
            id="confirmEmail"
            type="email"
            autoComplete="off"
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
          />
        </Field>
      </div>
      <Button
        variant="danger"
        className="mt-4"
        onClick={close}
        disabled={!matches || busy}
      >
        {busy ? "Closing…" : "Close account"}
      </Button>
    </Card>
  );
}
