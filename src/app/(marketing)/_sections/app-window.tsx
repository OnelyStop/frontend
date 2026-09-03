import { cn } from "@/design-system";

const NAV_MAIN = [
  ["Home", ""],
  ["Question bank", "1,284"],
  ["Past papers", "312"],
  ["Marker", "4"],
];
const NAV_REVISE = [
  ["PYQ mixes", ""],
  ["Flashcards", "18"],
  ["Progress", ""],
];

const ANSWER_ROWS = [
  {
    mp: "MP1",
    text: "Oxygen diffuses from the alveolus into the blood",
    hit: true,
  },
  { mp: "MP2", text: "The alveolus wall is one cell thick", hit: true },
  {
    mp: "MP3",
    text: "Blood flow maintains the concentration gradient",
    hit: false,
  },
  { mp: "MP4", text: "Many alveoli give a large surface area", hit: true },
];

const ACTIVITY = [
  ["Marked", "Q4(b) · Gas exchange", "4/6", true],
  ["Marked", "Q7(c) · Le Chatelier", "5/5", true],
  ["Marked", "Q2(a) · Rate equations", "3/4", true],
  ["Queued", "Q11 · Integration by parts", "—", false],
  ["Queued", "Q5(b) · Enzyme kinetics", "—", false],
];

const SUBJECT_DOT: Record<string, string> = {
  Biology: "bg-brand",
  Chemistry: "bg-[#7a6cf0]",
  Maths: "bg-[#e0a33a]",
};

/* A drawn mock, not a screenshot: the real product screen would read as a busy
   interface at this size, and a sparse drawn card reads as a wireframe. Its
   greys are local to the illustration — it is a picture of an app, not app
   chrome, so it does not track the design system's surfaces. */
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
          Marker · OCR A H420 · Paper 1
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
            Aarav · Year 13
          </div>
          {NAV_MAIN.map(([label, count], i) => (
            <span
              key={label}
              className={cn(NAV, i === 3 ? "bg-[#ececea] font-semibold" : SOFT)}
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
          <p className={cn(GROUP, MUTE)}>Revise</p>
          {NAV_REVISE.map(([label, count]) => (
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
          <p className={cn(GROUP, MUTE)}>Subjects</p>
          {["Biology", "Chemistry", "Maths"].map((s) => (
            <span key={s} className={cn(NAV, SOFT)}>
              <em className={cn("size-2 rounded-sm", SUBJECT_DOT[s])} />
              {s}
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
              6 marks
            </span>
            <span className="text-[13px] font-semibold">
              Explain how the alveoli are adapted for efficient gas exchange.
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
              Oxygen diffuses from the alveolus into the blood because there is
              a higher concentration in the air sac. The alveolus wall is one
              cell thick, so the diffusion distance is short. There are many
              alveoli, which gives a large surface area for exchange.
            </p>
          </div>

          <p className={cn(SECTION, MUTE)}>Marking points</p>
          <div
            className={cn(
              "grid gap-px overflow-hidden rounded-lg border bg-[rgb(10_10_11/0.08)]",
              LINE,
            )}
          >
            {ANSWER_ROWS.map((r) => (
              <div
                key={r.mp}
                className="grid grid-cols-[38px_minmax(0,1fr)_16px] items-center gap-2.5 bg-white px-3 py-2.5"
              >
                <span
                  className={cn(
                    "text-[11px] font-semibold tabular-nums",
                    r.hit ? "text-brand" : MUTE,
                  )}
                >
                  {r.mp}
                </span>
                <span className="truncate">{r.text}</span>
                <span className={cn("text-right", r.hit ? "text-brand" : MUTE)}>
                  {r.hit ? "✓" : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <aside
          className={cn("hidden border-l px-4 py-4.5 xl:block", RAIL, LINE)}
        >
          <p className={cn("mb-2 text-[11px]", MUTE)}>This answer</p>
          <div className="flex items-baseline gap-[5px]">
            <span className="text-brand text-[34px] leading-none font-semibold tracking-[-0.03em]">
              4
            </span>
            <i className={cn("not-italic", MUTE)}>/ 6</i>
          </div>
          <div className="mt-3 grid gap-1.5">
            {[
              ["Band", "5"],
              ["AO3", "6/8"],
              ["Time", "7m 12s"],
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

          <p className={cn(SECTION, MUTE)}>Working grade</p>
          <div className="flex gap-1">
            {["D", "C", "B", "A", "A*"].map((g) => (
              <span
                key={g}
                className={cn(
                  "flex-1 border-t-2 py-1 text-center text-[10px] font-semibold",
                  g === "A" ? "border-brand text-brand" : cn(LINE, MUTE),
                )}
              >
                {g}
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
