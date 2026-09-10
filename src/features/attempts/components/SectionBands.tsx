import { SECTION_FROM_DB, SECTION_KEY, SECTION_LABEL } from "@/data/navigation";
import type { SectionProgress } from "../progress.server";
import { ACC_LINE, PACE_TARGET } from "../verdict";

// The bank stores one-word sections; anything outside that vocabulary shows as stored.
export function sectionLabel(section: string) {
  return SECTION_LABEL[SECTION_FROM_DB[section]] ?? section;
}

function sectionInk(section: string) {
  const key = SECTION_KEY[SECTION_FROM_DB[section]];
  return key ? `var(--color-${key})` : "var(--color-ink-4)";
}

// Each section wears its own tint, the same palette the knowledge base uses, so five rows read as five subjects.
const SECTION_BAND: Record<string, string> = {
  quant: "bg-quant-soft",
  reasoning: "bg-reasoning-soft",
  english: "bg-english-soft",
  ga: "bg-ga-soft",
  computer: "bg-computer-soft",
};

function sectionBand(section: string) {
  return SECTION_BAND[SECTION_KEY[SECTION_FROM_DB[section]]] ?? "bg-panel";
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

/** Bare on the stage: a band per section in its own tint, white paper for the track, a notch on the line. */
export function SectionBands({
  sections,
  attempted,
}: {
  sections: RankedSection[];
  /** Show how many questions each figure rests on. */
  attempted?: boolean;
}) {
  return (
    <div className="grid gap-2.5">
      {sections.map((r) => (
        <div
          key={r.section}
          className={`rounded-2xl px-4 py-3.5 ${sectionBand(r.section)}`}
        >
          <div className="flex items-baseline gap-2.5">
            <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">
              {sectionLabel(r.section)}
            </span>
            {attempted ? (
              <span className="tnum text-ink-3 text-[12px]">
                {r.attempted} q
              </span>
            ) : null}
            <span className="tnum text-[17px] leading-none tracking-[-0.02em]">
              {r.acc}%
            </span>
            {/* An untimed section reports no pace; a 0 would read as instant rather than unknown. */}
            <span
              className={`tnum w-9 text-right text-[12.5px] ${
                r.avgSec === null
                  ? "opacity-45"
                  : r.avgSec <= PACE_TARGET
                    ? "text-ok"
                    : "text-bad"
              }`}
            >
              {r.avgSec === null ? "—" : `${r.avgSec}s`}
            </span>
          </div>
          <div className="bg-canvas relative mt-2.5 h-1.5 rounded-full">
            <div
              className="h-full rounded-full"
              style={{
                width: `${r.acc}%`,
                background: sectionInk(r.section),
              }}
            />
            <span
              className="bg-ink/35 absolute -top-1 -bottom-1 w-px"
              style={{ left: `${ACC_LINE}%` }}
              aria-hidden
            />
          </div>
        </div>
      ))}
    </div>
  );
}
