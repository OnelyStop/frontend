import type { Metadata } from "next";
import { Empty, PageHeader, SectionTitle } from "@/design-system";
import { REASON_LABEL } from "@/features/question-bank/reports";
import { listReportedQuestions } from "@/features/question-bank/reports.server";

export const metadata: Metadata = { title: "Reported questions" };

export default async function Page() {
  const reported = await listReportedQuestions();

  return (
    <>
      <PageHeader
        title="Reported questions"
        sub="What learners have flagged in the bank, most reported first."
      />

      {reported.length === 0 ? (
        <Empty
          mark="⚑"
          title="Nothing reported"
          sub="Learners can flag a question from the review on any results page."
        />
      ) : (
        <>
          <SectionTitle aside={`${reported.length} open`}>
            Open reports
          </SectionTitle>

          <div className="ruled">
            {reported.map((q) => (
              <div key={q.qId} className="py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <span className="text-ink-3 text-[12.5px]">
                    {q.paperId} · Q{q.qNum ?? "?"} · {q.section ?? "no section"}
                  </span>
                  <span className="tnum text-[13px] font-medium">
                    {q.reports} {q.reports === 1 ? "report" : "reports"}
                  </span>
                </div>

                <p className="mt-1.5 max-w-[80ch] text-[14.5px] leading-relaxed">
                  {q.stem}
                </p>

                <p className="text-ink-2 mt-2 text-[13px]">
                  {q.reasons.map((r) => REASON_LABEL[r]).join(" · ")}
                </p>

                {q.notes.map((note, i) => (
                  <p
                    key={i}
                    className="text-ink-3 mt-1 max-w-[80ch] text-[12.5px] leading-relaxed"
                  >
                    “{note}”
                  </p>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
