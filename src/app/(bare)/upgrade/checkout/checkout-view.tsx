"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2, Lock } from "lucide-react";
import { Brand, Button, Card, SectionTitle } from "@/design-system";
import { formatAmount } from "@/features/billing/money";
import type { BillingInterval, PlanPrice } from "@/features/billing/types";

// Checkout.js is Razorpay's hosted form: card details go to them, never here.
const CHECKOUT_JS = "https://checkout.razorpay.com/v1/checkout.js";

type Callback = {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
};

type RazorpayCheckout = new (options: {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  handler: (response: Callback) => void;
  modal?: { ondismiss?: () => void };
  theme?: { color?: string };
}) => { open(): void };

declare global {
  interface Window {
    Razorpay?: RazorpayCheckout;
  }
}

type Step =
  "idle" | "creating" | "paying" | "verifying" | "pending" | "active" | "error";

const POLL_MS = 2000;
const POLL_TRIES = 15;

// Outside both shells — fewer exits on the payment step.
function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-canvas min-h-dvh">
      <header className="border-line flex h-14 items-center justify-between border-b px-5 sm:px-8 lg:px-16">
        <Brand href="/" />
        <span className="text-ink-3 inline-flex items-center gap-1.5 text-[13px]">
          <Lock size={12} strokeWidth={2} />
          Secure checkout by Razorpay
        </span>
      </header>
      <div className="mx-auto max-w-275 px-5 py-10 sm:px-8">{children}</div>
    </div>
  );
}

function Done({ title, body }: { title: string; body: string }) {
  const router = useRouter();
  return (
    <Shell>
      <div className="mx-auto max-w-130 py-16 text-center">
        <CheckCircle2 size={56} strokeWidth={1.5} className="text-ok mx-auto" />
        <h1 className="mt-6 text-[32px] tracking-[-0.03em]">{title}</h1>
        <p className="text-ink-2 mt-3 text-[15px] leading-relaxed">{body}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button onClick={() => router.push("/home")}>Start practising</Button>
          <Button variant="secondary" onClick={() => router.push("/upgrade")}>
            Manage plan
          </Button>
        </div>
      </div>
    </Shell>
  );
}

export function CheckoutView({
  interval,
  prices,
  entitled,
  billingEnabled,
}: {
  interval: BillingInterval;
  prices: PlanPrice[];
  entitled: boolean;
  billingEnabled: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const price = prices.find((p) => p.plan === "pro" && p.interval === interval);
  const other = prices.find((p) => p.plan === "pro" && p.interval !== interval);

  if (entitled)
    return (
      <Done
        title="You're already on Pro"
        body="Everything is unlocked. Manage or cancel the plan from the upgrade page."
      />
    );
  if (step === "active")
    return (
      <Done
        title="You're on Pro"
        body="Unlimited mocks, marking and the full current-affairs archive are unlocked."
      />
    );
  if (step === "pending")
    return (
      <Done
        title="Payment received"
        body="Razorpay is confirming it. Pro unlocks within a few minutes — you can keep going in the meantime."
      />
    );

  const pollUntilActive = async () => {
    for (let i = 0; i < POLL_TRIES; i++) {
      await new Promise((r) => setTimeout(r, POLL_MS));
      const res = await fetch("/api/v1/billing/status", { cache: "no-store" });
      if (res.ok && (await res.json()).active) {
        setStep("active");
        return;
      }
    }
    setStep("pending");
  };

  const verify = async (cb: Callback) => {
    setStep("verifying");
    const res = await fetch("/api/v1/billing/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(cb),
    });
    if (!res.ok) {
      setMessage(
        "The payment could not be confirmed. Nothing has been charged twice — contact support with your payment id.",
      );
      setStep("error");
      return;
    }
    const { active } = (await res.json()) as { active: boolean };
    if (active) setStep("active");
    else await pollUntilActive();
  };

  const pay = async () => {
    if (!window.Razorpay) {
      setMessage(
        "The payment form did not load. Check your connection and try again.",
      );
      setStep("error");
      return;
    }
    setStep("creating");
    setMessage(null);
    const res = await fetch("/api/v1/billing/subscription", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ interval }),
    });
    if (!res.ok) {
      const { error } = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      setMessage(
        error === "already_subscribed"
          ? "You already have an active plan."
          : error === "billing_disabled"
            ? "Payments are not open yet."
            : "Could not start the payment. Try again in a minute.",
      );
      setStep("error");
      return;
    }
    const { subscriptionId, keyId } = (await res.json()) as {
      subscriptionId: string;
      keyId: string;
    };

    setStep("paying");
    new window.Razorpay({
      key: keyId,
      subscription_id: subscriptionId,
      name: "onelystop",
      description: `Pro · ${interval}`,
      handler: (cb) => void verify(cb),
      modal: { ondismiss: () => setStep("idle") },
      theme: { color: "#111111" },
    }).open();
  };

  const busy = step === "creating" || step === "paying" || step === "verifying";
  const label =
    step === "creating"
      ? "Starting…"
      : step === "paying"
        ? "Complete payment in the Razorpay window"
        : step === "verifying"
          ? "Confirming…"
          : price
            ? `Pay ${formatAmount(price.amountMinor, price.currency)}`
            : "Unavailable";

  return (
    <Shell>
      <Script src={CHECKOUT_JS} strategy="afterInteractive" />

      <button
        type="button"
        className="text-ink-2 hover:text-ink inline-flex items-center gap-1.5 text-[14px] transition-colors"
        onClick={() => router.back()}
      >
        <ArrowLeft size={15} strokeWidth={2} />
        Back to plans
      </button>

      <h1 className="mt-5 mb-8 text-[32px] tracking-[-0.03em]">
        Upgrade to Pro
      </h1>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card>
          <SectionTitle>Payment</SectionTitle>
          <p className="text-ink-2 text-[14px] leading-relaxed">
            Razorpay opens a secure window for the card, UPI or net-banking
            details. Nothing about your payment method is stored here.
          </p>
          <div className="mt-6">
            <Button
              size="lg"
              block
              disabled={busy || !price || !billingEnabled}
              onClick={pay}
            >
              {busy ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Lock size={15} strokeWidth={2} />
              )}
              {billingEnabled ? label : "Payments are not open yet"}
            </Button>
          </div>
          {message ? (
            <p className="text-bad mt-3 text-[13px] leading-relaxed">
              {message}
            </p>
          ) : null}
          <p className="text-ink-3 mt-4 text-[12.5px] leading-relaxed">
            Renews automatically. Cancel any time from the upgrade page; access
            runs to the end of the paid period.
          </p>
        </Card>

        <Card>
          <SectionTitle>Order summary</SectionTitle>
          <div className="border-line flex items-start justify-between gap-4 border-b pb-4">
            <div>
              <div className="text-[15px] font-medium">onelystop Pro</div>
              <div className="text-ink-3 mt-0.5 text-[13.5px]">
                {interval === "yearly" ? "Yearly" : "Monthly"} billing
              </div>
            </div>
            {other ? (
              <Link
                href={`/upgrade/checkout?interval=${other.interval}`}
                className="text-ink-2 hover:text-ink shrink-0 text-[13.5px] underline underline-offset-2"
              >
                Switch to {other.interval}
              </Link>
            ) : null}
          </div>
          <dl className="mt-4 grid gap-2.5 text-[14px]">
            <div className="border-line flex justify-between text-[16px] font-semibold">
              <dt>Due today</dt>
              <dd className="tnum">
                {price ? formatAmount(price.amountMinor, price.currency) : "—"}
              </dd>
            </div>
          </dl>
          <p className="text-ink-3 mt-4 text-[13px] leading-relaxed">
            Active the moment Razorpay confirms the payment.
          </p>
        </Card>
      </div>
    </Shell>
  );
}
