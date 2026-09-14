import {
  ArrowUpRight,
  BrainCircuit,
  CreditCard,
  Hourglass,
  TimerOff,
  type LucideIcon,
} from "lucide-react";
import { ButtonLink, cn } from "@/design-system";
import { PLAN_LIMITS } from "@/features/billing/limits";
import { EYEBROW, H2, PANEL as SURFACE, Shell } from "./surface";

// The date is the point: a pledge that can be quietly edited is not one.
const PLEDGE_DATED = "5 September 2026";

const free = PLAN_LIMITS.free;

const FREE_TILES = [
  {
    n: free.mocksPerMonth,
    label: "full mocks a month",
    tone: "bg-[#fde3d6] text-[#9a4b2f]",
  },
  {
    n: free.drillsPerDay,
    label: "drills a day",
    tone: "bg-[#e6e2fb] text-[#4d3f9e]",
  },
  {
    n: free.descriptiveMarkingsPerMonth,
    label: "markings a month",
    tone: "bg-[#d8f0e5] text-[#23634a]",
  },
  {
    n: free.askOnelyPerMonth,
    label: "Ask Onely a month",
    tone: "bg-[#fbf0c6] text-[#7a5a12]",
  },
];

const CATCH_TILES: { icon: LucideIcon; label: string; tone: string }[] = [
  { icon: CreditCard, label: "No card", tone: "bg-[#dcebfa] text-[#2e5d88]" },
  { icon: Hourglass, label: "No trial", tone: "bg-[#fbe1ea] text-[#8b3b5d]" },
  {
    icon: TimerOff,
    label: "No countdown",
    tone: "bg-[#d8f0e5] text-[#23634a]",
  },
  {
    icon: BrainCircuit,
    label: "Not training data",
    tone: "bg-[#e6e2fb] text-[#4d3f9e]",
  },
];

const MARKING = [
  "A model reading a rubric",
  "Four weighted bands, each explained",
  "Fixes that quote your own lines",
  "Negative marking always shown",
];

// Same illustrative names as the community tile in the mosaic, so the page tells one story.
const ASKERS = [
  { initial: "P", tone: "bg-[#dcebfa] text-[#2e5d88]" },
  { initial: "R", tone: "bg-[#d8f0e5] text-[#23634a]" },
  { initial: "M", tone: "bg-[#e6e2fb] text-[#4d3f9e]" },
  { initial: "A", tone: "bg-[#fbf0c6] text-[#7a5a12]" },
];

const TILE =
  "grid aspect-square w-full max-w-16 place-items-center rounded-[18px] shadow-[inset_0_1px_0_rgb(255_255_255/0.6),0_1px_3px_rgb(20_40_30/0.08)]";

const NOTE = "text-ink-2 mt-4 text-[13px] leading-snug";

function Panel({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <article className={cn(SURFACE, "p-6 sm:p-7", className)}>
      <h3 className="text-[17px] font-medium tracking-[-0.01em]">{title}</h3>
      {children}
    </article>
  );
}

function Tiles({
  items,
}: {
  items: { key: string; label: string; tone: string; face: React.ReactNode }[];
}) {
  return (
    <ul className="mt-5 grid grid-cols-4 gap-3">
      {items.map(({ key, label, tone, face }) => (
        <li key={key} className="flex flex-col items-center gap-2 text-center">
          <span className={cn(TILE, tone)}>{face}</span>
          <span className="text-ink-2 text-[11.5px] leading-tight">
            {label}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Promises() {
  return (
    <Shell tone="bg-[#abdcc6]" id="promises">
      <div className="relative grid gap-10 px-6 py-12 sm:px-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.5fr)] lg:gap-14 lg:px-14 lg:py-16">
        <div className="flex flex-col items-start lg:pt-4">
          <p className={cn(EYEBROW, "text-[#23473a]/75")}>Our promises</p>
          <h2 className={cn(H2, "mt-5 max-w-[12ch]")}>
            Straight answers before you sign up
          </h2>
          <p className="mt-6 max-w-[38ch] text-[16px] leading-relaxed text-[#24463a]">
            What&rsquo;s free, how the marking works, and what happens to your
            answers, written down before you give us an email address.
          </p>

          <ButtonLink
            href="#pricing"
            size="lg"
            variant="secondary"
            className="text-ink mt-8 border-white/70 bg-white/55 shadow-xs backdrop-blur-md hover:bg-white/75"
          >
            See the plans
          </ButtonLink>

          <p className="mt-auto pt-10 text-[13px] text-[#24463a]/80">
            This version: {PLEDGE_DATED} ·{" "}
            <a
              href="/terms"
              className="decoration-ink/30 hover:decoration-ink inline-flex items-center gap-1 underline underline-offset-4"
            >
              every change is dated
              <ArrowUpRight size={13} aria-hidden />
            </a>
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Panel title="Free, forever">
            <Tiles
              items={FREE_TILES.map(({ n, label, tone }) => ({
                key: label,
                label,
                tone,
                face: (
                  <span className="tnum text-[22px] font-semibold">{n}</span>
                ),
              }))}
            />
            <p className={NOTE}>
              Plus the last {free.currentAffairsDays} days of current affairs
              and {free.communityDoubtsPerMonth} community doubts a month.
            </p>
          </Panel>

          <Panel title="No catch">
            <Tiles
              items={CATCH_TILES.map(({ icon: Icon, label, tone }) => ({
                key: label,
                label,
                tone,
                face: <Icon size={24} strokeWidth={1.8} aria-hidden />,
              }))}
            />
            <p className={NOTE}>
              Your answers are yours. Closing your account deletes them.
            </p>
          </Panel>

          <Panel title="How the marking works" className="sm:col-span-2">
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {MARKING.map((m) => (
                <li
                  key={m}
                  className="text-ink rounded-[14px] bg-[#c3e8d6] px-4 py-3 text-center text-[14px] font-medium"
                >
                  {m}
                </li>
              ))}
            </ul>
            <p className={NOTE}>
              It is fast and it is specific, and it is not an examiner.
            </p>
          </Panel>

          <Panel
            title="Community"
            className="sm:col-span-2 sm:flex sm:items-center sm:justify-between sm:gap-6"
          >
            <div className="mt-5 flex items-center gap-4 sm:mt-0">
              <div className="flex -space-x-3" aria-hidden>
                {ASKERS.map(({ initial, tone }) => (
                  <span
                    key={initial}
                    className={cn(
                      "grid size-11 place-items-center rounded-full text-[15px] font-semibold ring-2 ring-white",
                      tone,
                    )}
                  >
                    {initial}
                  </span>
                ))}
              </div>
              <div>
                <p className="text-[17px] font-semibold tracking-[-0.01em]">
                  Ask where you&rsquo;re stuck
                </p>
                <p className="text-ink-3 text-[13px] leading-snug">
                  Doubts ranked by how many people share them ·{" "}
                  {free.communityDoubtsPerMonth} free a month
                </p>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </Shell>
  );
}
