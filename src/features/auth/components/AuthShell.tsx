import { BookOpen } from "lucide-react";
import type { ReactNode } from "react";
import {
  Brand,
  CornerBadge,
  IndexCard,
  StatusPill,
  tintFor,
} from "@/design-system";

// The same slugs /study renders, so tintFor lands every card on the colour the user will meet after signing in.
const SHELF = [
  {
    slug: "quantitative-aptitude",
    name: "Quantitative Aptitude",
    blurb:
      "Arithmetic, interest, work and motion — the calculation core of every paper.",
    topic: "Percentages",
  },
  {
    slug: "reasoning-ability",
    name: "Reasoning Ability",
    blurb: "Seating arrangements, syllogisms, series and analytical puzzles.",
    topic: "Seating arrangement",
  },
  {
    slug: "english",
    name: "English",
    blurb: "Error detection, sentence improvement, reading comprehension.",
    topic: "Error spotting",
  },
  {
    slug: "banking-awareness",
    name: "Banking Awareness",
    blurb: "The RBI, deposits and instruments, and the payment rails.",
    topic: "Repo and reverse repo",
  },
  {
    slug: "computer-awareness",
    name: "Computer Awareness",
    blurb: "Memory, operating systems, databases and networks.",
    topic: "Networking basics",
  },
  {
    slug: "exam-guidance",
    name: "Exam Guidance",
    blurb: "Negative marking, sectional time, and how to analyse a mock.",
    topic: "Reading a notification",
  },
];

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode | null;
};

export function AuthShell({ title, subtitle, children, footer }: Props) {
  return (
    <div className="bg-canvas grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      <div className="flex flex-col px-5 pt-7 pb-8 sm:px-10 lg:px-16">
        <Brand href="/" className="self-start" />

        <div className="mx-auto flex w-full max-w-95 flex-1 flex-col justify-center py-8">
          <h1 className="text-[20px] font-semibold tracking-[-0.03em]">
            {title}
          </h1>
          <p className="text-ink-2 mt-1.5 text-[14px]">{subtitle}</p>
          {children}
        </div>

        <div className="text-ink-2 text-center text-[14px]">{footer}</div>
      </div>

      {/* A window onto the app — the frame corner, the stage, and the cards /study renders — cropped at the floor. */}
      <aside
        aria-hidden
        className="bg-frame hidden overflow-hidden pt-6 pl-6 select-none lg:block"
      >
        <div className="bg-stage pointer-events-none h-full overflow-hidden rounded-tl-[26px] px-9 pt-11">
          <p className="max-w-[30ch] text-[22px] leading-[1.25] font-bold tracking-[-0.03em]">
            The total is not the exam. Every section has its own cutoff, so
            every sitting here is scored one section at a time.
          </p>

          <div className="mt-9 grid grid-cols-2 gap-5">
            {SHELF.map((s) => (
              <IndexCard
                key={s.slug}
                className={tintFor(s.slug)}
                title={s.name}
                badge={
                  <CornerBadge tone="quiet">
                    <BookOpen size={20} />
                  </CornerBadge>
                }
                footer={<StatusPill tone="soon">{s.topic}</StatusPill>}
              >
                {s.blurb}
              </IndexCard>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
