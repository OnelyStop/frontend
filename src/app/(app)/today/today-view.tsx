"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Clock,
  FileText,
  GalleryVerticalEnd,
  Map,
  Newspaper,
} from "lucide-react";
import {
  ActiveCard,
  Button,
  ButtonLink,
  Canvas,
  Card,
  CornerBadge,
  Empty,
  EventCard,
  EventMark,
  EventTime,
  PageHeader,
  PlanCard,
  RoundAction,
  SectionTitle,
  Spine,
  SpineItem,
  StatusPill,
  Tile,
} from "@/design-system";
import { useApp } from "@/context/AppContext";
import { NEGATIVE_MARK } from "@/data/navigation";
import {
  SectionBands,
  rankSections,
  sectionLabel,
} from "@/features/attempts/components/SectionBands";
import type { Progress } from "@/features/attempts/progress.server";
import { ACC_LINE, PACE_TARGET } from "@/features/attempts/verdict";
import { nextPaper, paperTitle } from "@/features/question-bank/next-paper";
import type { Mock } from "@/features/question-bank/types";

const DRILL_MINUTES = 15;

export function TodayView({
  greeting,
  today,
  progress,
  papers,
  rail,
}: {
  greeting: string;
  today: string;
  progress: Progress;
  papers: Mock[];
  rail: { currentAffairs: number; flashcards: number; unread: number };
}) {
  const router = useRouter();
  const { board, profile } = useApp();
  const { attempted, correct, wrong, avgSec, sections, week } = progress;

  const hello = profile.name
    ? `${greeting}, ${profile.name.split(" ")[0]}`
    : greeting;

  if (attempted === 0) {
    return (
      <>
        <PageHeader title={hello} />
        <Card pad={false}>
          <Empty
            title="No attempts yet"
            sub={`Sit a mock or a drill and this page fills in with your accuracy, your pace and the marks negative marking takes back on ${board}.`}
            action={<ButtonLink href="/mocks">Start a mock</ButtonLink>}
          />
        </Card>
      </>
    );
  }

  const acc = Math.round((correct / attempted) * 100);
  const lost = wrong * NEGATIVE_MARK;
  const onPace = avgSec !== null && avgSec <= PACE_TARGET;
  // Best first, so the sections needing work fall to the bottom of the list.
  const ranked = rankSections(sections, "best");
  const weakest = ranked[ranked.length - 1]!;
  const weakestName = sectionLabel(weakest.section);
  const daysSat = week.filter((d) => d.count > 0).length;
  const paper = nextPaper(papers);
  const cleared =
    paper?.score !== null && paper !== null && paper.score! >= paper.target;

  return (
    <>
      <div className="mb-7 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h1 className="text-[29px] leading-[1.14] font-bold tracking-[-0.03em]">
          {hello}
        </h1>
        <span className="text-ink-3 text-[13px]">{today}</span>
      </div>

      <Canvas
        mid={
          <>
            {/* Three figures, tinted by meaning; the pace tile is dashed because the budget is not yet met. */}
            <div className="grid grid-cols-3 gap-2.5 xl:mt-11.5">
              <Tile value={`${acc}%`} label="accuracy" tone="info" />
              <Tile
                value={`−${lost.toFixed(2)}`}
                label="given back"
                tone="bad"
              />
              <Tile
                value={avgSec === null ? "—" : `${avgSec}s`}
                label={`a question · ${PACE_TARGET}s budget`}
                tone={onPace ? "ok" : "neutral"}
                outline={!onPace}
              />
            </div>

            <SectionTitle
              className="mt-8 mb-4"
              aside={`last 30 days · ${ACC_LINE}% line`}
            >
              By section
            </SectionTitle>

            <SectionBands sections={ranked} />

            <p className="text-ink-3 mt-4 text-[12.5px] leading-relaxed">
              Accuracy on what you attempted, not a sectional score. The notch
              is the {ACC_LINE}% line.
            </p>
          </>
        }
        aside={
          <>
            <SectionTitle aside={`${daysSat} of 7 days sat`}>
              This week
            </SectionTitle>

            <div className="grid gap-3.5">
              <Link href="/current-affairs" className="block">
                <EventCard
                  kind="Current affairs"
                  when="Today"
                  tone="info"
                  mark={
                    <EventMark disc>
                      <Newspaper strokeWidth={2} />
                    </EventMark>
                  }
                  footer={
                    <EventTime>
                      {rail.currentAffairs
                        ? `${rail.currentAffairs} questions · about ${Math.max(3, rail.currentAffairs * 2)} min`
                        : "Filed after the evening news"}
                    </EventTime>
                  }
                >
                  One grounded question per major story from today&rsquo;s RBI,
                  PIB and SEBI releases, filed the way GA asks it.
                </EventCard>
              </Link>

              <Link href="/flashcards" className="block">
                <EventCard
                  kind="Flashcards"
                  when={`${rail.flashcards} cards`}
                  tone="reasoning"
                  mark={
                    <EventMark disc>
                      <GalleryVerticalEnd strokeWidth={2} />
                    </EventMark>
                  }
                  footer={
                    <EventTime>
                      About {Math.max(2, Math.round(rail.flashcards / 2))} min
                    </EventTime>
                  }
                >
                  The last seven days of current-affairs questions, dated.
                  Reveal, then mark whether you had it.
                </EventCard>
              </Link>

              <Link href="/notifications" className="block">
                <EventCard
                  kind="Notifications"
                  when={rail.unread ? `${rail.unread} unread` : "All read"}
                  tone="warn"
                  mark={
                    <EventMark disc>
                      <Bell strokeWidth={2} />
                    </EventMark>
                  }
                  footer={<EventTime>Open the inbox</EventTime>}
                >
                  Replies to your doubts, markings that came back, and anything
                  we need to tell you.
                </EventCard>
              </Link>
            </div>
          </>
        }
      >
        <Spine className="mt-1">
          <SpineItem>
            {/* At most one in-progress card per screen, or being in progress stops meaning anything. */}
            <ActiveCard
              tilt
              kicker="Up next · your lowest section"
              title={`Drill ${weakestName}`}
              resumeLabel={`Drill ${weakestName}`}
              onResume={() => router.push("/drills")}
              className="mb-0"
              status={
                <>
                  <StatusPill tone="live">
                    <Clock size={14} strokeWidth={2} />
                    {DRILL_MINUTES} min
                  </StatusPill>
                  <StatusPill tone="live" className="text-bad">
                    {Math.round((weakest.correct / weakest.attempted) * 100)}%
                    {weakest.avgSec !== null
                      ? ` · ${weakest.avgSec}s a question`
                      : ""}
                  </StatusPill>
                </>
              }
            >
              20 questions from the same bank, timed like the section.
            </ActiveCard>
          </SpineItem>

          {paper ? (
            <SpineItem>
              <PlanCard
                size="sm"
                className="mb-0"
                title={paperTitle(paper)}
                corner={
                  <CornerBadge tone="quiet">
                    <FileText size={18} strokeWidth={1.75} />
                  </CornerBadge>
                }
                status={
                  <StatusPill
                    tone={
                      paper.score === null ? "soon" : cleared ? "ok" : "bad"
                    }
                  >
                    {paper.score === null
                      ? "Not attempted"
                      : cleared
                        ? "Cleared"
                        : "Missed"}
                  </StatusPill>
                }
                actions={
                  <Button size="sm" onClick={() => router.push("/mocks")}>
                    {paper.score === null ? "Start" : "Retake"}
                  </Button>
                }
              >
                {paper.score === null
                  ? `Full paper under real sectional timing. ${paper.qs} questions, ${paper.mins} minutes, target ${paper.target}.`
                  : `Last sitting ${paper.score} of ${paper.qs} — ${cleared ? "cleared" : "missed"} the ${paper.target} target${cleared && paper.score - paper.target < 3 ? " by a hair" : ""}.`}
              </PlanCard>
            </SpineItem>
          ) : null}

          {wrong > 0 ? (
            <SpineItem>
              <PlanCard
                size="sm"
                className="mb-0"
                title={`Review ${wrong} wrong ${wrong === 1 ? "answer" : "answers"}`}
                corner={
                  <span className="bg-bad-soft text-bad absolute top-4 right-4 grid size-10 place-items-center rounded-full">
                    <Map size={18} strokeWidth={1.75} />
                  </span>
                }
                status={<StatusPill tone="soon">Upcoming</StatusPill>}
                actions={
                  <RoundAction
                    label="Open the attempt map"
                    onClick={() => router.push("/attempt-map")}
                  >
                    <Map size={18} strokeWidth={1.75} />
                  </RoundAction>
                }
              >
                They gave back {lost.toFixed(2)} marks this month. The attempt
                map shows which topics to bank and which to skip.
              </PlanCard>
            </SpineItem>
          ) : null}
        </Spine>
      </Canvas>
    </>
  );
}
