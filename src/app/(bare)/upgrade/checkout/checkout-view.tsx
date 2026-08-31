"use client";
import "@/styles/global.css";

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
import { Brand } from "@/components/marketing/Logo";
import { Button } from "@/components/marketing/Button";
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
    <div className="checkout-shell">
      <header className="checkout-shell__bar">
        <Brand href="/" />
        <span className="checkout-shell__secure">
          <Lock size={12} strokeWidth={2} />
          Secure checkout
        </span>
      </header>
      <div className="checkout-shell__body">{children}</div>
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
        <div className="checkout-success">
          <CheckCircle2 size={56} strokeWidth={1.5} />
          <h1 className="page__title">You're on Pro</h1>
          <p className="page__desc">
            Unlimited marking, exams, and AI tools are unlocked. The A* Ascent
            rail is waiting — keep climbing.
          </p>
          <div className="checkout-success__actions">
            <Button onClick={() => router.push("/home")}>Start revising</Button>
            <Button variant="outline" onClick={() => router.push("/settings")}>
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
        className="checkout-back"
        onClick={() => router.back()}
      >
        <ArrowLeft size={15} strokeWidth={2} />
        Back to plans
      </button>

      <div className="page__eyebrow">Checkout</div>
      <h1 className="page__title">Upgrade to Pro</h1>

      <div className="checkout-layout">
        <form className="panel checkout-form" onSubmit={handleSubmit}>
          <div className="panel__title">Payment details</div>
          <p className="panel__sub">
            <Lock size={12} strokeWidth={2} /> Secured with 256-bit encryption
          </p>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="checkout-email">Email</label>
              <input
                id="checkout-email"
                type="email"
                defaultValue={profile.email}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="checkout-name">Name on card</label>
              <input
                id="checkout-name"
                type="text"
                placeholder="Alex Morgan"
                autoComplete="cc-name"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="checkout-card">Card number</label>
              <div className="checkout-card-input">
                <CreditCard size={16} strokeWidth={1.75} />
                <input
                  id="checkout-card"
                  inputMode="numeric"
                  placeholder="1234 5678 9012 3456"
                  autoComplete="cc-number"
                  value={card}
                  onChange={(e) => setCard(formatCardNumber(e.target.value))}
                  required
                  minLength={19}
                />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="checkout-expiry">Expiry</label>
                <input
                  id="checkout-expiry"
                  inputMode="numeric"
                  placeholder="MM/YY"
                  autoComplete="cc-exp"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  required
                  minLength={5}
                />
              </div>
              <div className="field">
                <label htmlFor="checkout-cvc">CVC</label>
                <input
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
              </div>
            </div>
            <div className="field">
              <label htmlFor="checkout-country">Country</label>
              <select id="checkout-country" defaultValue="GB">
                <option value="GB">United Kingdom</option>
                <option value="IN">India</option>
                <option value="US">United States</option>
                <option value="SG">Singapore</option>
                <option value="AE">United Arab Emirates</option>
              </select>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="checkout-pay"
            disabled={status === "processing"}
            leftIcon={
              status === "processing" ? (
                <Loader2 size={16} className="checkout-spinner" />
              ) : (
                <Lock size={15} strokeWidth={2} />
              )
            }
          >
            {status === "processing"
              ? "Processing…"
              : `Pay £${total.toFixed(2)}`}
          </Button>
          <p className="checkout-terms">
            Prices include VAT. Renews automatically — cancel anytime from
            Settings.
          </p>
        </form>

        <aside className="panel order-summary">
          <div className="panel__title">Order summary</div>
          <div className="order-summary__plan">
            <div>
              <div className="order-summary__plan-name">onelystop Pro</div>
              <div className="order-summary__plan-cycle">
                {billing === "annual" ? "Annual" : "Monthly"} billing
              </div>
            </div>
            <Link
              href={`/upgrade/checkout?billing=${
                billing === "annual" ? "monthly" : "annual"
              }`}
              className="order-summary__switch"
            >
              Switch to {billing === "annual" ? "monthly" : "annual"}
            </Link>
          </div>

          <dl className="order-summary__rows">
            {billing === "annual" ? (
              <>
                <div>
                  <dt>12 months × £{MONTHLY_PRICE.toFixed(2)}</dt>
                  <dd>£{monthlyEquivalent.toFixed(2)}</dd>
                </div>
                <div className="order-summary__saving">
                  <dt>Annual saving</dt>
                  <dd>−£{saving.toFixed(2)}</dd>
                </div>
              </>
            ) : (
              <div>
                <dt>Pro monthly</dt>
                <dd>£{MONTHLY_PRICE.toFixed(2)}</dd>
              </div>
            )}
            <div className="order-summary__total">
              <dt>Due today</dt>
              <dd>£{total.toFixed(2)}</dd>
            </div>
          </dl>

          <p className="order-summary__note">
            Unlimited marking and AI exams, active the moment payment clears.
          </p>
        </aside>
      </div>
    </CheckoutShell>
  );
}
