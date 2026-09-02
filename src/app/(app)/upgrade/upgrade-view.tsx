"use client";

import { ShieldCheck } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { PageHeader } from "@/design-system";
import { PlanGrid } from "@/features/pricing/components/PlanGrid";

export function UpgradeView() {
  const { workingGrade, nextGrade } = useApp();

  return (
    <>
      <PageHeader
        title={`You are tracking ${workingGrade}.${
          nextGrade
            ? ` Pro moves you to ${nextGrade}.`
            : " Pro keeps you there."
        }`}
        sub="Unlimited mocks with real sectional timing, unlimited descriptive marking, and daily current affairs — one plan, no per-paper credits."
      />

      <PlanGrid variant="app" />

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
