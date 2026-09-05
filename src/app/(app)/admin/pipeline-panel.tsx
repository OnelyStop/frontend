"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Badge, Card, SectionTitle } from "@/design-system";
import { useAdminStatus } from "@/features/admin/hooks";

const TIME = new Intl.DateTimeFormat("en-IN", {
  hour: "2-digit",
  minute: "2-digit",
  day: "2-digit",
  month: "short",
});

export function PipelinePanel() {
  const { data, error, isPending, isFetching } = useAdminStatus();

  return (
    <Card className="mt-5">
      <SectionTitle
        aside={
          <span className="text-ink-3 flex items-center gap-2 text-[13px]">
            {isFetching ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : null}
            refreshes every 10s
          </span>
        }
      >
        Current affairs pipeline
      </SectionTitle>

      {error ? (
        <div className="rounded-ctl bg-bad-soft text-bad flex items-start gap-2 px-3 py-2.5 text-[13.5px]">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <div>Could not read pipeline status ({error.message}).</div>
        </div>
      ) : isPending ? (
        <div className="text-ink-3 text-[13.5px]">Loading…</div>
      ) : data.runs.length === 0 ? (
        <div className="text-ink-3 text-[13.5px]">
          No generation run has been recorded yet.
        </div>
      ) : (
        <ul className="divide-line divide-y">
          {data.runs.map((run) => (
            <li key={run.runId} className="flex items-center gap-3 py-2.5">
              <Badge
                tone={
                  run.status === "done"
                    ? "ok"
                    : run.status === "failed"
                      ? "bad"
                      : "warn"
                }
              >
                {run.status}
              </Badge>
              <span className="tnum text-ink-3 shrink-0 text-[13px]">
                {TIME.format(new Date(run.startedAt))}
              </span>
              <span className="text-ink-3 min-w-0 flex-1 truncate text-[13px]">
                {run.day ?? "—"}
              </span>
              <span className="tnum shrink-0 text-[13px]">
                {run.published}/{run.planned} published
              </span>
              {run.errors > 0 ? (
                <span className="tnum text-bad shrink-0 text-[13px]">
                  {run.errors} errors
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
