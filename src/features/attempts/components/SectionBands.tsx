import { SECTION_FROM_DB, SECTION_LABEL } from "@/data/navigation";
import type { SectionProgress } from "../progress.server";
import { ACC_LINE, PACE_TARGET } from "../verdict";

// The bank stores one-word sections; anything outside that vocabulary shows as stored.
export function sectionLabel(section: string) {
  return SECTION_LABEL[SECTION_FROM_DB[section]] ?? section;
}

export type RankedSection = SectionProgress & { acc: number };

export function rankSections(
  sections: SectionProgress[],
  order: "best" | "worst",
): RankedSection[] {
  return sections
    .map((r) => ({ ...r, acc: Math.round((r.correct / r.attempted) * 100) }))
    .sort((a, b) => (order === "best" ? b.acc - a.acc : a.acc - b.acc));
}

export function SectionBands({
  sections,
  attempted,
}: {
  sections: RankedSection[];
  attempted?: boolean;
}) {
  return (
    <div className="grid gap-5">
      {sections.map((r) => {
        const under = r.acc < ACC_LINE;
        return (
          <div key={r.section}>
            <div className="flex items-baseline gap-2.5">
              <span className="min-w-0 flex-1 truncate text-[14px]">
                {sectionLabel(r.section)}
              </span>
              {attempted ? (
                <span className="tnum text-ink-3 text-[12px]">
                  {r.attempted} q
                </span>
              ) : null}
              <span
                className={`tnum text-[15px] tracking-[-0.02em] ${under ? "text-bad" : ""}`}
              >
                {r.acc}
              </span>
              {/* An untimed section reports no pace; a 0 would read as instant rather than unknown. */}
              <span
                className={`tnum w-9 text-right text-[12.5px] ${
                  r.avgSec === null
                    ? "text-ink-4"
                    : r.avgSec <= PACE_TARGET
                      ? "text-ok"
                      : "text-bad"
                }`}
              >
                {r.avgSec === null ? "—" : `${r.avgSec}s`}
              </span>
            </div>
            <div className="bg-track relative mt-2 h-[3px] rounded-full">
              <div
                className={`h-full rounded-full ${under ? "bg-bad" : "bg-ink"}`}
                style={{ width: `${r.acc}%` }}
              />
              {/* The cutoff, not a midpoint: a section is judged against this line and nothing else. */}
              <span
                className="bg-ink/45 absolute -top-1 -bottom-1 w-px"
                style={{ left: `${ACC_LINE}%` }}
                aria-hidden
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
