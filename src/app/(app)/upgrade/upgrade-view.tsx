"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Badge, Button, Card, PageHeader, SectionTitle } from "@/design-system";
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

  const cancel = async () => {
    if (
      !window.confirm(
        "Cancel Pro? You keep access until the end of the paid period.",
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
          ? `Pro ends on ${until}. Everything stays unlocked until then.`
          : `Pro, renewing on ${until}.`}
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
        title={status.active ? "You are on Pro." : "Sit every paper you need."}
        sub="Unlimited mocks with real sectional timing, unlimited descriptive marking, and the full current-affairs archive — one plan, no per-paper credits."
      />

      {status.active ? <ManagePlan status={status} /> : null}

      <PlanGrid
        variant="app"
        prices={prices}
        entitled={status.active}
        billingEnabled={billingEnabled}
      />

      <div className="card mt-8 flex items-start gap-3 p-5">
        <ShieldCheck size={18} strokeWidth={1.75} className="mt-0.5 shrink-0" />
        <p className="text-ink-2 max-w-[74ch] text-[13.5px] leading-relaxed">
          <strong className="text-ink font-semibold">Cutoff promise.</strong>{" "}
          Sit at least eight full mocks on Pro in three months. If your weakest
          section has not crossed its sectional cutoff, we refund the three
          months in full.
        </p>
      </div>
    </>
  );
}
