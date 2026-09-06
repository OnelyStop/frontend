"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Badge, Button, Card, PageHeader, SectionTitle } from "@/design-system";
import { SUPPORT_EMAIL } from "@/config/site";
import { PLAN_LIMITS, PLAN_NAME } from "@/features/billing/limits";
import type { BillingStatus, PlanPrice } from "@/features/billing/types";
import { PlanGrid } from "@/features/pricing/components/PlanGrid";

const DATE = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function ManagePlan({ status }: { status: BillingStatus }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sub = status.subscription;
  const until = status.accessUntil
    ? DATE.format(new Date(status.accessUntil))
    : null;
  const windingDown = !!sub?.cancelledAt;
  const name = PLAN_NAME[status.plan];

  const cancel = async () => {
    if (
      !window.confirm(
        `Cancel ${name}? You keep access until the end of the paid period.`,
      )
    )
      return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/v1/billing/cancel", { method: "POST" });
    setBusy(false);
    if (!res.ok) {
      setError("Could not cancel right now. Try again in a minute.");
      return;
    }
    router.refresh();
  };

  return (
    <Card className="mb-6">
      <SectionTitle
        aside={
          <Badge tone={windingDown ? "warn" : "ok"}>
            {windingDown ? "Cancels" : "Active"}
          </Badge>
        }
      >
        Your plan
      </SectionTitle>
      <p className="text-ink-2 text-[14px] leading-relaxed">
        {windingDown
          ? `${name} ends on ${until}. Everything stays unlocked until then.`
          : `${name}, renewing on ${until}.`}
      </p>
      {!windingDown ? (
        <div className="mt-4">
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={cancel}
          >
            {busy ? "Cancelling…" : "Cancel renewal"}
          </Button>
        </div>
      ) : null}
      {error ? <p className="text-bad mt-3 text-[13px]">{error}</p> : null}
    </Card>
  );
}

export function UpgradeView({
  prices,
  status,
  billingEnabled,
}: {
  prices: PlanPrice[];
  status: BillingStatus;
  billingEnabled: boolean;
}) {
  return (
    <>
      <PageHeader
        title={
          status.active
            ? `You are on ${PLAN_NAME[status.plan]}.`
            : "Sit every paper you need."
        }
        sub={`Unlimited mocks and drills with real sectional timing, the full current-affairs archive, and ${PLAN_LIMITS.pro.descriptiveMarkingsPerMonth} descriptive markings a month on Pro or ${PLAN_LIMITS.pro_plus.descriptiveMarkingsPerMonth} on Pro+. No per-paper credits.`}
      />

      {status.active ? <ManagePlan status={status} /> : null}

      <PlanGrid
        variant="app"
        prices={prices}
        entitled={status.active}
        currentPlan={status.plan}
        billingEnabled={billingEnabled}
      />

      <div className="card mt-8 flex items-start gap-3 p-5">
        <ShieldCheck size={18} strokeWidth={1.75} className="mt-0.5 shrink-0" />
        <p className="text-ink-2 max-w-[74ch] text-[13.5px] leading-relaxed">
          <strong className="text-ink font-semibold">Target promise.</strong>{" "}
          Sit at least eight full mocks on a paid plan in three months. If your
          weakest section has not crossed its 55% sectional target on any of
          them, we refund the three months in full. Nothing counts this for you:
          claim it by writing to{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">
            {SUPPORT_EMAIL}
          </a>{" "}
          and we check the condition against your sittings before refunding.
        </p>
      </div>
    </>
  );
}
