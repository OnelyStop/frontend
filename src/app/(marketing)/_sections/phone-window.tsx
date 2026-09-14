import { ChevronLeft, Ellipsis } from "lucide-react";
import { cn } from "@/design-system";

// Local colours on purpose, like AppWindow: a picture of an app must not track the design system.
const TONE = {
  blue: "border-[#a9cdef] bg-[#eef5fc]",
  yellow: "border-[#efd98a] bg-[#fffbe4]",
  coral: "border-[#ee9f95] bg-[#fdf1ee]",
  green: "border-[#a6d6b0] bg-[#effaf1]",
  plain: "border-[#e9e9ee] bg-white",
};

const SOFT = "text-[#6a6a73]";
const PANEL = "rounded-[10px] bg-white/75 px-2 py-1.5";

function Tile({
  tone,
  title,
  children,
}: {
  tone: keyof typeof TONE;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-[20px] border-[3px] p-2.5", TONE[tone])}>
      <p className="text-[13px] leading-tight font-semibold tracking-[-0.01em]">
        {title}
      </p>
      <div className="mt-2 grid gap-1.5 border-t border-black/5 pt-2">
        {children}
      </div>
    </div>
  );
}

function StatusIcons() {
  return (
    <svg width="46" height="9" viewBox="0 0 66 12" fill="currentColor">
      {[4, 6, 8, 10].map((h, i) => (
        <rect key={h} x={i * 4.5} y={12 - h} width="3" height={h} rx="0.8" />
      ))}
      <path d="M28.5 3.6a8.6 8.6 0 0 1 11 0l-1.2 1.3a6.8 6.8 0 0 0-8.6 0zM30.7 6a5.4 5.4 0 0 1 6.6 0l-1.2 1.3a3.6 3.6 0 0 0-4.2 0zM34 11.2 32.4 9.5a2.2 2.2 0 0 1 3.2 0z" />
      <rect
        x="42.5"
        y="1"
        width="20"
        height="10"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.4"
      />
      <rect x="44.5" y="3" width="14" height="6" rx="1.5" />
      <rect x="63.5" y="4" width="1.6" height="4" rx="0.8" fillOpacity="0.4" />
    </svg>
  );
}

const SIDE = "absolute w-[4px] bg-[linear-gradient(90deg,#76787f,#cfd0d4)]";

export function PhoneWindow({ className }: { className?: string }) {
  return (
    <figure
      aria-hidden
      className={cn("relative text-[#111114] select-none", className)}
    >
      <span className={cn(SIDE, "top-[15%] -left-[3px] h-7 rounded-l-sm")} />
      <span className={cn(SIDE, "top-[22%] -left-[3px] h-12 rounded-l-sm")} />
      <span className={cn(SIDE, "top-[31%] -left-[3px] h-12 rounded-l-sm")} />
      <span
        className={cn(
          SIDE,
          "top-[25%] -right-[3px] h-18 rotate-180 rounded-l-sm",
        )}
      />

      {/* Titanium rim, black glass bezel, then the screen: three radii, each inset by its padding so the corners stay concentric. */}
      <div className="rounded-[58px] bg-[linear-gradient(140deg,#e6e7ea_0%,#9b9da4_22%,#d8d9dd_48%,#7d7f86_78%,#cbccd1_100%)] p-[4px] shadow-[0_40px_80px_-20px_rgb(40_30_80/0.38)]">
        <div className="rounded-[54px] bg-[#0b0b0d] p-[9px]">
          <div className="relative aspect-[9/19.5] overflow-hidden rounded-[45px] bg-[#f3f3f6]">
            <div className="absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-[#f3f3f6] via-[#f3f3f6]/85 to-transparent" />

            <div className="absolute inset-x-0 top-0 z-20 flex h-12 items-center justify-between px-5 pt-1">
              <span className="text-[14px] font-semibold tabular-nums">
                9:41
              </span>
              <StatusIcons />
            </div>
            <div className="absolute top-2.5 left-1/2 z-20 flex h-[26px] w-[70px] -translate-x-1/2 items-center justify-end rounded-full bg-black pr-2.5">
              <span className="size-2 rounded-full bg-[#1c1f2e]" />
            </div>

            {[
              { side: "left-3", Icon: ChevronLeft },
              { side: "right-3", Icon: Ellipsis },
            ].map(({ side, Icon }) => (
              <span
                key={side}
                className={cn(
                  "absolute top-[62px] z-20 grid size-9 place-items-center rounded-full bg-white/80 shadow-[0_4px_14px_rgb(0_0_0/0.12)] ring-1 ring-black/5 backdrop-blur-md",
                  side,
                )}
              >
                <Icon size={18} strokeWidth={2} />
              </span>
            ))}

            <div className="grid grid-cols-2 items-start gap-2 px-2.5 pt-12">
              <div className="mt-14 grid gap-2">
                <Tile tone="blue" title="IBPS PO Prelims">
                  {[
                    ["Quant", "35 q · 20 min"],
                    ["Reasoning", "35 q · 20 min"],
                    ["English", "30 q · 20 min"],
                  ].map(([name, meta]) => (
                    <div key={name} className={PANEL}>
                      <p className="text-[11px] font-medium">{name}</p>
                      <p className={cn("text-[9px]", SOFT)}>{meta}</p>
                    </div>
                  ))}
                </Tile>
                <Tile tone="plain" title="Drill · Reasoning">
                  <p className={cn("text-[10px]", SOFT)}>Q7 · Floor puzzle</p>
                  <p className="text-[18px] font-semibold tabular-nums">
                    12:00
                  </p>
                </Tile>
              </div>

              {/* Starts higher than the left column, so its first card is already scrolling under the status bar. */}
              <div className="-mt-6 grid gap-2">
                <Tile tone="yellow" title="Current affairs">
                  <p className="text-[10px] font-semibold">14 March</p>
                  {[
                    "RBI eases lending norms for small finance banks",
                    "SEBI widens T+0 settlement",
                  ].map((s) => (
                    <p key={s} className={cn("text-[9px] leading-snug", SOFT)}>
                      {s}
                    </p>
                  ))}
                </Tile>
                <Tile tone="coral" title="Last mock">
                  <p className="flex items-baseline gap-1">
                    <span className="text-[19px] leading-none font-bold tracking-[-0.03em] text-[#7b3fa0] tabular-nums">
                      60.25
                    </span>
                    <span className={cn("text-[10px]", SOFT)}>/ 100</span>
                  </p>
                  <div className={PANEL}>
                    <p className="text-[10px] font-medium">Quant cleared</p>
                    <p className="text-[9px] text-[#2e8a4c]">23.75 vs 19.25</p>
                  </div>
                  <div className={PANEL}>
                    <p className="text-[10px] font-medium">English short</p>
                    <p className="text-[9px] text-[#b2463a]">4.50 under</p>
                  </div>
                </Tile>
                <Tile tone="green" title="Attempt map">
                  {[
                    "Simplification · bank",
                    "Puzzles · if time",
                    "DI sets · skip",
                  ].map((chip, i) => (
                    <span
                      key={chip}
                      className={cn(
                        "rounded-[8px] px-2 py-1 text-[9.5px]",
                        i === 2
                          ? "bg-[#7b3fa0] text-white"
                          : "bg-white/75 text-[#4a4a52]",
                      )}
                    >
                      {chip}
                    </span>
                  ))}
                </Tile>
              </div>
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}
