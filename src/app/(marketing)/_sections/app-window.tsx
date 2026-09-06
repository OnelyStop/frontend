import { cn } from "@/design-system";

const NAV_MAIN = [
  ["Today", ""],
  ["Attempt map", ""],
  ["Mocks", "14"],
  ["Drills", "6"],
];
const NAV_RECALL = [
  ["Current affairs", "7"],
  ["Flashcards", "18"],
  ["Notes", ""],
];

const SECTION_ROWS = [
  {
    name: "Quant",
    detail: "22 attempted · 17 right · 5 wrong",
    net: "15.75",
    cutoff: "14.50",
    clear: true,
  },
  {
    name: "Reasoning",
    detail: "28 attempted · 21 right · 7 wrong",
    net: "19.25",
    cutoff: "18.25",
    clear: true,
  },
  {
    name: "English",
    detail: "18 attempted · 10 right · 8 wrong",
    net: "8.00",
    cutoff: "9.75",
    clear: false,
  },
];

const ACTIVITY = [
  ["Sat", "Mock 14 · IBPS PO Prelims", "43.0", true],
  ["Sat", "Mock 13 · IBPS PO Prelims", "38.5", true],
  ["Sat", "Drill · Floor puzzles", "8/10", true],
  ["Queued", "Mock 15 · SBI Clerk Prelims", "—", false],
  ["Queued", "Drill · Cloze test", "—", false],
];

const SECTION_DOT: Record<string, string> = {
  Quant: "bg-brand",
  Reasoning: "bg-[#7a6cf0]",
  English: "bg-[#e0a33a]",
};

// Greys are local to the illustration on purpose: it is a picture of an app,
// not app chrome, so it must not track the design system's surfaces.
const RAIL = "bg-[#fbfbfa]";
const LINE = "border-[rgb(10_10_11/0.08)]";
const SOFT = "text-[#5f5f68]";
const MUTE = "text-[#93939c]";
const NAV = "flex items-center gap-2 rounded-md px-2 py-1.5";
const GROUP = "mt-3.5 mb-1 pl-2 text-[11px]";
const SECTION = "mt-4.5 mb-2 text-[11px]";

export function AppWindow() {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-t-[20px] bg-[#f7f8fa] text-[12px] leading-[1.45] text-[#16161a] select-none",
        "shadow-[0_40px_80px_-24px_rgb(10_10_11/0.28)]",
      )}
      aria-hidden
    >
      <div
        className={cn(
          "flex h-[38px] items-center gap-[7px] border-b px-3.5",
          RAIL,
          LINE,
        )}
      >
        <span className="rounded-pill size-[11px] bg-[#ff5f57]" />
        <span className="rounded-pill size-[11px] bg-[#febc2e]" />
        <span className="rounded-pill size-[11px] bg-[#28c840]" />
        <span className={cn("mx-auto text-[11px]", MUTE)}>
          Attempt map · Mock 14 · IBPS PO Prelims
        </span>
      </div>

      <div className="grid min-h-[460px] lg:grid-cols-[168px_minmax(0,1fr)] xl:grid-cols-[192px_minmax(0,1fr)_232px]">
        <aside
          className={cn(
            "hidden content-start gap-px border-r px-2.5 py-3 lg:grid",
            RAIL,
            LINE,
          )}
        >
          <div className="flex items-center gap-2 px-2 pt-1 pb-3 text-[12px] font-semibold">
            <span className="size-[18px] rounded-[5px] bg-[#16161a]" />
            Aarav · IBPS PO 2026
          </div>
          {NAV_MAIN.map(([label, count], i) => (
            <span
              key={label}
              className={cn(NAV, i === 1 ? "bg-[#ececea] font-semibold" : SOFT)}
            >
              {label}
              {count ? (
                <i
                  className={cn(
                    "ml-auto text-[11px] not-italic tabular-nums",
                    MUTE,
                  )}
                >
                  {count}
                </i>
              ) : null}
            </span>
          ))}
          <p className={cn(GROUP, MUTE)}>Recall</p>
          {NAV_RECALL.map(([label, count]) => (
            <span key={label} className={cn(NAV, SOFT)}>
              {label}
              {count ? (
                <i
                  className={cn(
                    "ml-auto text-[11px] not-italic tabular-nums",
                    MUTE,
                  )}
                >
                  {count}
                </i>
              ) : null}
            </span>
          ))}
          <p className={cn(GROUP, MUTE)}>Sections</p>
          {SECTION_ROWS.map((s) => (
            <span key={s.name} className={cn(NAV, SOFT)}>
              <em className={cn("size-2 rounded-sm", SECTION_DOT[s.name])} />
              {s.name}
            </span>
          ))}
        </aside>

        <div className="min-w-0 px-5 py-4.5">
          <div className="flex items-baseline gap-2.5">
            <span
              className={cn(
                "rounded-pill shrink-0 bg-[#ececea] px-[7px] py-0.5 text-[10px] font-semibold",
                SOFT,
              )}
            >
              60 min
            </span>
            <span className="text-[13px] font-semibold">
              Mock 14 · IBPS PO Prelims · 100 questions
            </span>
          </div>

          <div
            className={cn(
              "mt-3 rounded-lg border px-3.5 py-3",
              RAIL,
              LINE,
              SOFT,
            )}
          >
            <p>
              Cleared the overall cutoff at 43.0 against 40.5 and missed English
              by 1.75. Eight wrong answers there cost 2.0 marks; skipped, the
              section clears.
            </p>
          </div>

          <p className={cn(SECTION, MUTE)}>Sections</p>
          <div
            className={cn(
              "grid gap-px overflow-hidden rounded-lg border bg-[rgb(10_10_11/0.08)]",
              LINE,
            )}
          >
            {SECTION_ROWS.map((s) => (
              <div
                key={s.name}
                className="grid grid-cols-[72px_minmax(0,1fr)_16px] items-center gap-2.5 bg-white px-3 py-2.5"
              >
                <span
                  className={cn(
                    "text-[11px] font-semibold",
                    s.clear ? "text-brand" : MUTE,
                  )}
                >
                  {s.name}
                </span>
                <span className="truncate tabular-nums">
                  {s.detail} · net {s.net} vs {s.cutoff}
                </span>
                <span
                  className={cn("text-right", s.clear ? "text-brand" : MUTE)}
                >
                  {s.clear ? "✓" : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <aside
          className={cn("hidden border-l px-4 py-4.5 xl:block", RAIL, LINE)}
        >
          <p className={cn("mb-2 text-[11px]", MUTE)}>This mock</p>
          <div className="flex items-baseline gap-[5px]">
            <span className="text-brand text-[34px] leading-none font-semibold tracking-[-0.03em]">
              43.0
            </span>
            <i className={cn("not-italic", MUTE)}>/ 100</i>
          </div>
          <div className="mt-3 grid gap-1.5">
            {[
              ["Cutoff", "40.5"],
              ["Negative", "−5.00"],
              ["Time", "59m 40s"],
            ].map(([k, v]) => (
              <div
                key={k}
                className={cn(
                  "flex justify-between border-b pb-1.5",
                  LINE,
                  MUTE,
                )}
              >
                <span>{k}</span>
                <b className="font-semibold text-[#16161a] tabular-nums">{v}</b>
              </div>
            ))}
          </div>

          <p className={cn(SECTION, MUTE)}>Cutoff band</p>
          <div className="flex gap-1">
            {["Below", "At cutoff", "Safe", "Strong"].map((band) => (
              <span
                key={band}
                className={cn(
                  "flex-1 border-t-2 py-1 text-center text-[10px] font-semibold",
                  band === "At cutoff"
                    ? "border-brand text-brand"
                    : cn(LINE, MUTE),
                )}
              >
                {band}
              </span>
            ))}
          </div>

          <p className={cn(SECTION, MUTE)}>Recent</p>
          <div className="grid gap-2">
            {ACTIVITY.map(([, q, mark, done]) => (
              <div
                key={q as string}
                className={cn(
                  "grid grid-cols-[6px_minmax(0,1fr)_auto] items-center gap-2",
                  SOFT,
                )}
              >
                <span
                  className={cn(
                    "rounded-pill size-1.5",
                    done ? "bg-brand" : "bg-[rgb(10_10_11/0.16)]",
                  )}
                />
                <span className="truncate text-[11px]">{q}</span>
                <span
                  className={cn(
                    "text-[11px] font-semibold tabular-nums",
                    done ? "text-[#16161a]" : MUTE,
                  )}
                >
                  {mark}
                </span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
