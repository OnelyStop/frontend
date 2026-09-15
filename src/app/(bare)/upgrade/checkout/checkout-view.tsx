"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Loader2,
  Lock,
  Receipt,
} from "lucide-react";
import {
  Brand,
  Button,
  Card,
  CornerBadge,
  SectionTitle,
} from "@/design-system";
import {
  PLAN_LIMITS,
  PLAN_NAME,
  quotaPhrase,
  type PlanTier,
} from "@/features/billing/limits";
import { formatAmount } from "@/features/billing/money";
import type {
  BillingInterval,
  PaidPlan,
  PlanPrice,
} from "@/features/billing/types";

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

function included(plan: PaidPlan): string[] {
  const l = PLAN_LIMITS[plan];
  const free = PLAN_LIMITS.free;
  return [
    `Unlimited mocks, up from ${free.mocks.cap} a month`,
    `Unlimited drills, up from ${free.drills.cap} a month`,
    "The whole knowledge base, every mock paper, unlimited notes",
    quotaPhrase(l.descriptiveMarkings, "descriptive markings"),
    quotaPhrase(l.askOnely, "Ask Onely questions"),
    "The whole current-affairs archive, not the last week",
    "The attempt map: what to bank and what to skip",
  ];
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-frame min-h-screen">
      <div className="flex min-h-svh w-full flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between px-5 text-white sm:px-8 lg:h-20">
          <Brand href="/" className="text-[20px] font-bold sm:text-[22px]" />
          <span className="text-on-frame-3 inline-flex shrink-0 items-center gap-1.5 text-[13px]">
            <Lock size={12} strokeWidth={2} />
            Secure checkout
            <span className="hidden sm:inline">by Razorpay</span>
          </span>
        </header>

        <div className="flex flex-1 flex-col px-3 pb-3">
          <div className="bg-stage flex flex-1 flex-col rounded-[26px] px-5 pt-8 pb-10 sm:px-10 lg:pt-11">
            <div className="mx-auto w-full max-w-275">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Done({ title, body }: { title: string; body: string }) {
  const router = useRouter();
  return (
    <Shell>
      <div className="mx-auto max-w-130 py-16 text-center">
        <CheckCircle2 size={56} strokeWidth={1.5} className="text-ok mx-auto" />
        <h1 className="mt-6 text-[26px] leading-[1.14] font-bold tracking-[-0.03em] sm:text-[29px]">
          {title}
        </h1>
        <p className="text-ink-2 mt-3 text-[15px] leading-relaxed">{body}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button onClick={() => router.push("/today")}>
            Start practising
          </Button>
          <Button variant="secondary" onClick={() => router.push("/upgrade")}>
            Manage plan
          </Button>
        </div>
      </div>
    </Shell>
  );
}

export function CheckoutView({
  plan,
  interval,
  prices,
  held,
  billingEnabled,
}: {
  plan: PaidPlan;
  interval: BillingInterval;
  prices: PlanPrice[];
  held: PlanTier | null;
  billingEnabled: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const planName = PLAN_NAME[plan];
  const price = prices.find((p) => p.plan === plan && p.interval === interval);
  const other = prices.find((p) => p.plan === plan && p.interval !== interval);

  if (held)
    return (
      <Done
        title={`You are already on ${PLAN_NAME[held]}`}
        body="Manage or cancel it from the upgrade page. Changing tier while a plan is running is done by email, not here."
      />
    );
  if (step === "active")
    return (
      <Done
        title={`You're on ${planName}`}
        body={`Unlimited mocks and drills, the whole knowledge base, ${PLAN_LIMITS[plan].descriptiveMarkings.cap} descriptive markings a month and the full current-affairs archive are unlocked.`}
      />
    );
  if (step === "pending")
    return (
      <Done
        title="Payment received"
        body={`Razorpay is confirming it. ${planName} unlocks within a few minutes — you can keep going in the meantime.`}
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
      body: JSON.stringify({ plan, interval }),
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
      description: `${planName} · ${interval}`,
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

      <h1 className="mt-4 mb-8 text-[26px] leading-[1.14] font-bold tracking-[-0.03em] sm:text-[29px]">
        Upgrade to {planName}
      </h1>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="relative">
          <CornerBadge tone="quiet">
            <Lock size={18} strokeWidth={2} />
          </CornerBadge>
          <SectionTitle>Payment</SectionTitle>
          <p className="bg-info-pale rounded-ctl text-ink-2 p-4 text-[14px] leading-relaxed">
            Razorpay opens a secure window for the card, UPI or net-banking
            details. Nothing about your payment method is stored here.
          </p>
          <div className="mt-4">
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
          <p className="bg-info-pale rounded-ctl text-ink-3 mt-3 p-4 text-[12.5px] leading-relaxed">
            Renews automatically. Cancel any time from the upgrade page; access
            runs to the end of the paid period.
          </p>
        </Card>

        <Card className="relative">
          <CornerBadge tone="quiet">
            <Receipt size={18} strokeWidth={1.75} />
          </CornerBadge>
          <SectionTitle>Order summary</SectionTitle>

          <div className="bg-brand-pale rounded-ctl flex items-start justify-between gap-4 p-4">
            <div>
              <div className="text-[15px] font-medium">
                onelystop {planName}
              </div>
              <div className="text-ink-3 mt-0.5 text-[13.5px]">
                {interval === "yearly" ? "Yearly" : "Monthly"} billing
              </div>
            </div>
            {other ? (
              <Link
                href={`/upgrade/checkout?plan=${plan}&interval=${other.interval}`}
                className="text-ink-2 hover:text-ink shrink-0 text-[13.5px] underline underline-offset-2"
              >
                Switch to {other.interval}
              </Link>
            ) : null}
          </div>

          <div className="bg-canvas rounded-ctl shadow-card mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 p-4">
            <span className="text-ink-2 text-[14px] font-medium">
              Due today
            </span>
            <span className="tnum text-[22px] font-bold tracking-[-0.02em]">
              {price ? formatAmount(price.amountMinor, price.currency) : "—"}
            </span>
            <span className="text-ink-3 w-full text-[12.5px]">
              Active the moment Razorpay confirms it
            </span>
          </div>

          <ul className="bg-brand-pale rounded-ctl mt-3 grid gap-2.5 p-4">
            {included(plan).map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-[13.5px]">
                <Check
                  size={15}
                  strokeWidth={2.5}
                  className="text-ok mt-0.5 shrink-0"
                />
                {line}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </Shell>
  );
}
