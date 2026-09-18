"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { Button, Modal, OptionRow } from "@/design-system";
import {
  REPORT_REASONS,
  type ReportReason,
} from "@/features/question-bank/reports";

type Step = "idle" | "open" | "sending" | "sent" | "error";

export function ReportQuestion({
  qId,
  label = "Report this question",
}: {
  qId: string;
  label?: string;
}) {
  const [step, setStep] = useState<Step>("idle");
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState("");

  const send = async () => {
    if (!reason) return;
    setStep("sending");
    const res = await fetch(
      `/api/v1/questions/${encodeURIComponent(qId)}/report`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason, note: note.trim() || undefined }),
      },
    );
    setStep(res.ok ? "sent" : "error");
  };

  if (step === "sent")
    return (
      <span className="text-ink-3 inline-flex items-center gap-1.5 text-[12.5px]">
        <Flag size={13} strokeWidth={2} />
        Reported — thank you
      </span>
    );

  return (
    <>
      <button
        type="button"
        onClick={() => setStep("open")}
        className="text-ink-3 hover:text-ink inline-flex items-center gap-1.5 text-[12.5px] transition-colors"
      >
        <Flag size={13} strokeWidth={2} />
        {label}
      </button>

      {step !== "idle" ? (
        <Modal
          label="Report this question"
          onClose={() => setStep("idle")}
          className="w-[min(30rem,100%)] overflow-y-auto p-6"
        >
          <h2 className="text-[18px] font-semibold tracking-[-0.01em]">
            What is wrong with it?
          </h2>
          <p className="text-ink-2 mt-1.5 text-[13.5px] leading-relaxed">
            Nothing changes for you now — this goes to whoever maintains the
            bank.
          </p>

          <div className="mt-4 grid gap-1.5">
            {REPORT_REASONS.map((r) => (
              <OptionRow
                key={r.value}
                label={String(REPORT_REASONS.indexOf(r) + 1)}
                selected={reason === r.value}
                onSelect={() => setReason(r.value)}
              >
                {r.label}
              </OptionRow>
            ))}
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={300}
            rows={2}
            placeholder="Anything else worth knowing (optional)"
            className="border-line bg-canvas rounded-ctl mt-3 w-full resize-none border p-3 text-[14px]"
          />

          {step === "error" ? (
            <p className="text-bad mt-3 text-[13px]">
              That did not send. Try again in a moment.
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setStep("idle")}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!reason || step === "sending"}
              onClick={send}
            >
              {step === "sending" ? "Sending…" : "Send report"}
            </Button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
