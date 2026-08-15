"use client";

import { ShieldCheck } from "lucide-react";
import { useApp } from "../context/AppContext";
import { PlanGrid } from "../components/pricing/PlanGrid";

export function UpgradePage() {
  const { workingGrade, nextGrade } = useApp();

  return (
    <div className="page">
      <div className="pricing-header">
        <div className="page__eyebrow">Upgrade</div>
        <h1 className="page__title">
          You're working at {workingGrade}.{" "}
          {nextGrade
            ? `Pro is built to get you to ${nextGrade} — and beyond.`
            : "Pro keeps you there."}
        </h1>
        <p className="page__desc">
          Unlimited marking, exams, and AI tools — everything on your path to
          A*, one plan.
        </p>
      </div>

      <PlanGrid variant="app" />

      <div className="pricing-guarantee">
        <ShieldCheck size={18} strokeWidth={1.75} />
        <p>
          <strong>Grade-jump promise.</strong> Revise with Pro for 3 months —
          if your working grade doesn't climb the A* Ascent rail, we'll refund
          you in full.
        </p>
      </div>
    </div>
  );
}
