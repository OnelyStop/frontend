"use client";

import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
} from "lucide-react";
import type { ReactNode } from "react";
import { useApp } from "@/context/AppContext";
import {
  Brand,
  Button,
  Card,
  Field,
  Input,
  Select,
  SectionTitle,
} from "@/design-system";
import {
  ANNUAL_TOTAL,
  MONTHLY_PRICE,
  type BillingCycle,
} from "@/features/pricing/plans";
import Link from "next/link";
import { useRouter } from "next/navigation";

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.match(/.{1,4}/g)?.join(" ") ?? "";
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

// Deliberately outside both shells — fewer exits on the payment step.
function CheckoutShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-canvas min-h-dvh">
      <header className="border-line flex h-14 items-center justify-between border-b px-5 sm:px-8 lg:px-16">
        <Brand href="/" />
        <span className="text-ink-3 inline-flex items-center gap-1.5 text-[13px]">
          <Lock size={12} strokeWidth={2} />
          Secure checkout
        </span>
      </header>
      <div className="mx-auto max-w-275 px-5 py-10 sm:px-8">{children}</div>
    </div>
  );
}

export function CheckoutView({ billing }: { billing: BillingCycle }) {
  const { profile } = useApp();
  const router = useRouter();

  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [status, setStatus] = useState<"idle" | "processing" | "paid">("idle");

  const monthlyEquivalent = 12 * MONTHLY_PRICE;
  const total = billing === "annual" ? ANNUAL_TOTAL : MONTHLY_PRICE;
  const saving = billing === "annual" ? monthlyEquivalent - ANNUAL_TOTAL : 0;

  // Demo checkout — no payment backend yet, so "payment" is a staged delay
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setStatus("processing");
    window.setTimeout(() => setStatus("paid"), 1400);
  };

  if (status === "paid") {
    return (
      <CheckoutShell>
        <div className="mx-auto max-w-130 py-16 text-center">
          <CheckCircle2
            size={56}
            strokeWidth={1.5}
            className="text-ok mx-auto"
          />
          <h1 className="mt-6 text-[32px] tracking-[-0.03em]">You're on Pro</h1>
          <p className="text-ink-2 mt-3 text-[15px] leading-relaxed">
            Unlimited marking, exams, and AI tools are unlocked.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button onClick={() => router.push("/home")}>Start revising</Button>
            <Button
              variant="secondary"
              onClick={() => router.push("/settings")}
            >
              Manage plan
            </Button>
          </div>
        </div>
      </CheckoutShell>
    );
  }

  return (
    <CheckoutShell>
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
          <SectionTitle
            aside={
              <span className="text-ink-3 inline-flex items-center gap-1.5 text-[13px]">
                <Lock size={12} strokeWidth={2} /> 256-bit encryption
              </span>
            }
          >
            Payment details
          </SectionTitle>

          <form onSubmit={handleSubmit} className="grid gap-3.5">
            <Field label="Email" htmlFor="checkout-email">
              <Input
                id="checkout-email"
                type="email"
                defaultValue={profile.email}
                required
              />
            </Field>
            <Field label="Name on card" htmlFor="checkout-name">
              <Input
                id="checkout-name"
                type="text"
                placeholder="Aarav Mehta"
                autoComplete="cc-name"
                required
              />
            </Field>
            <Field label="Card number" htmlFor="checkout-card">
              <div className="rounded-ctl border-line bg-canvas focus-within:border-brand flex h-10 items-center gap-2 border px-3.5 transition-colors">
                <CreditCard
                  size={16}
                  strokeWidth={1.75}
                  className="text-ink-3 shrink-0"
                />
                <input
                  id="checkout-card"
                  inputMode="numeric"
                  placeholder="1234 5678 9012 3456"
                  autoComplete="cc-number"
                  value={card}
                  onChange={(e) => setCard(formatCardNumber(e.target.value))}
                  required
                  minLength={19}
                  className="w-full bg-transparent text-[14px] outline-none"
                />
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-3.5">
              <Field label="Expiry" htmlFor="checkout-expiry">
                <Input
                  id="checkout-expiry"
                  inputMode="numeric"
                  placeholder="MM/YY"
                  autoComplete="cc-exp"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  required
                  minLength={5}
                />
              </Field>
              <Field label="CVC" htmlFor="checkout-cvc">
                <Input
                  id="checkout-cvc"
                  inputMode="numeric"
                  placeholder="123"
                  autoComplete="cc-csc"
                  value={cvc}
                  onChange={(e) =>
                    setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  required
                  minLength={3}
                />
              </Field>
            </div>
            <Field label="Country" htmlFor="checkout-country">
              <Select id="checkout-country" defaultValue="GB">
                <option value="GB">United Kingdom</option>
                <option value="IN">India</option>
                <option value="US">United States</option>
                <option value="SG">Singapore</option>
                <option value="AE">United Arab Emirates</option>
              </Select>
            </Field>

            <Button
              type="submit"
              size="lg"
              block
              className="mt-2"
              disabled={status === "processing"}
            >
              {status === "processing" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Lock size={15} strokeWidth={2} />
              )}
              {status === "processing"
                ? "Processing…"
                : `Pay £${total.toFixed(2)}`}
            </Button>
            <p className="text-ink-3 text-[12.5px] leading-relaxed">
              Prices include VAT. Renews automatically — cancel anytime from
              Settings.
            </p>
          </form>
        </Card>

        <Card>
          <SectionTitle>Order summary</SectionTitle>

          <div className="border-line flex items-start justify-between gap-4 border-b pb-4">
            <div>
              <div className="text-[15px] font-medium">onelystop Pro</div>
              <div className="text-ink-3 mt-0.5 text-[13.5px]">
                {billing === "annual" ? "Annual" : "Monthly"} billing
              </div>
            </div>
            <Link
              href={`/upgrade/checkout?billing=${
                billing === "annual" ? "monthly" : "annual"
              }`}
              className="text-ink-2 hover:text-ink shrink-0 text-[13.5px] underline underline-offset-2"
            >
              Switch to {billing === "annual" ? "monthly" : "annual"}
            </Link>
          </div>

          <dl className="mt-4 grid gap-2.5 text-[14px]">
            {billing === "annual" ? (
              <>
                <div className="flex justify-between">
                  <dt className="text-ink-2">
                    12 months × £{MONTHLY_PRICE.toFixed(2)}
                  </dt>
                  <dd className="tnum">£{monthlyEquivalent.toFixed(2)}</dd>
                </div>
                <div className="text-ok flex justify-between">
                  <dt>Annual saving</dt>
                  <dd className="tnum">−£{saving.toFixed(2)}</dd>
                </div>
              </>
            ) : (
              <div className="flex justify-between">
                <dt className="text-ink-2">Pro monthly</dt>
                <dd className="tnum">£{MONTHLY_PRICE.toFixed(2)}</dd>
              </div>
            )}
            <div className="border-line mt-2 flex justify-between border-t pt-3 text-[16px] font-semibold">
              <dt>Due today</dt>
              <dd className="tnum">£{total.toFixed(2)}</dd>
            </div>
          </dl>

          <p className="text-ink-3 mt-4 text-[13px] leading-relaxed">
            Unlimited marking and AI exams, active the moment payment clears.
          </p>
        </Card>
      </div>
    </CheckoutShell>
  );
}
