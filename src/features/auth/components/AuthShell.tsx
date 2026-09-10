import {
  Bell,
  Clock,
  FileText,
  GalleryVerticalEnd,
  Newspaper,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  ActiveCard,
  Brand,
  Button,
  CornerBadge,
  EventCard,
  EventMark,
  EventTime,
  PlanCard,
  StatusPill,
  Tile,
} from "@/design-system";

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

      {/* A window onto Today with a sample day in it — the frame corner, the stage, the plan — cropped at the floor. */}
      <aside
        aria-hidden
        className="bg-frame hidden overflow-hidden pt-6 pl-6 select-none lg:block"
      >
        <div className="bg-stage pointer-events-none h-full overflow-hidden rounded-tl-[26px] px-9 pt-10">
          <p className="max-w-[30ch] text-[22px] leading-tight font-bold tracking-[-0.03em]">
            The total is not the exam. Every section has its own cutoff, so
            every sitting here is scored one section at a time.
          </p>

          <div className="mt-6 grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] items-start gap-5">
            <div>
              <p className="text-[22px] leading-[1.14] font-bold tracking-[-0.03em]">
                Good evening, Aarav
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <Tile value="71%" label="accuracy" tone="info" />
                <Tile value="−22.00" label="given back" tone="bad" />
                <Tile value="49s" label="of 45s" outline />
              </div>
              <ActiveCard
                tilt
                kicker="Up next · your lowest section"
                title="Drill General Awareness"
                resumeLabel="Drill General Awareness"
                className="mt-5 mb-4 sm:pr-28"
                status={
                  <>
                    <StatusPill tone="live">
                      <Clock size={14} strokeWidth={2} />
                      15 min
                    </StatusPill>
                    <StatusPill tone="live" className="text-bad">
                      50%
                    </StatusPill>
                  </>
                }
              />
              <PlanCard
                size="sm"
                className="mb-0"
                title="IBPS PO 2025 · Prelims"
                corner={
                  <CornerBadge tone="quiet">
                    <FileText size={18} strokeWidth={1.75} />
                  </CornerBadge>
                }
                status={<StatusPill tone="ok">Cleared</StatusPill>}
                actions={<Button size="sm">Retake</Button>}
              >
                Last sitting 42.5 of 75 — cleared the 41 target by a hair.
              </PlanCard>
            </div>

            <div className="mt-11.5 grid gap-3">
              <EventCard
                kind="Current affairs"
                when="Today"
                tone="info"
                mark={
                  <EventMark disc>
                    <Newspaper strokeWidth={2} />
                  </EventMark>
                }
                footer={<EventTime>About 8 min</EventTime>}
              >
                Five questions from today&rsquo;s RBI, PIB and SEBI releases.
              </EventCard>
              <EventCard
                kind="Flashcards"
                when="12 cards"
                tone="reasoning"
                mark={
                  <EventMark disc>
                    <GalleryVerticalEnd strokeWidth={2} />
                  </EventMark>
                }
                footer={<EventTime>About 6 min</EventTime>}
              >
                Last week&rsquo;s current-affairs questions, dated.
              </EventCard>
              <EventCard
                kind="Notifications"
                when="2 unread"
                tone="warn"
                mark={
                  <EventMark disc>
                    <Bell strokeWidth={2} />
                  </EventMark>
                }
                footer={<EventTime>Open the inbox</EventTime>}
              >
                A descriptive answer came back marked.
              </EventCard>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
