"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { Button, Empty, PageHeader, Segmented } from "@/design-system";
import { POST_QUOTA, type PlanTier } from "@/features/community/quota";
import { SECTIONS, SECTION_LABEL, type Subject } from "@/data/navigation";

/* Doubts, not a forum. Every doubt is pinned to a section and a topic, and the
   only reaction is "stuck here too" — so the page sorts by how many people are
   blocked on the same thing rather than by who wrote the wittiest reply. */

type Doubt = {
  id: string;
  section: Subject;
  topic: string;
  title: string;
  body: string;
  author: string;
  ago: string;
  stuck: number;
  answers: number;
  solved: boolean;
};

const DOUBTS: Doubt[] = [
  {
    id: "d1",
    section: "Quantitative Aptitude",
    topic: "Caselet DI",
    title: "Caselet DI is eating 4 minutes before I even know if it's doable",
    body: "In SBI PO prelims the caselet has no table — you build it from the paragraph. By the time I've drawn the grid, a third of my quant time is gone. Is there a tell in the first two lines that says leave it?",
    author: "Rohit K",
    ago: "2h",
    stuck: 214,
    answers: 11,
    solved: true,
  },
  {
    id: "d2",
    section: "Reasoning Ability",
    topic: "Puzzles & Seating",
    title: "Floor + box puzzle: when do you abandon a case you've half-built?",
    body: "I get two cases, commit to case 1, and 6 minutes later it dies. Everyone says 'eliminate early' but nobody says on what.",
    author: "Sneha M",
    ago: "5h",
    stuck: 186,
    answers: 8,
    solved: false,
  },
  {
    id: "d3",
    section: "English Language",
    topic: "Error Spotting",
    title: "Subject–verb agreement with 'one of the' — IBPS keeps trapping me",
    body: "\"One of the students who was/were present\". I picked was. Wrong. Which noun does the relative clause actually attach to?",
    author: "Arjun P",
    ago: "8h",
    stuck: 143,
    answers: 14,
    solved: true,
  },
  {
    id: "d4",
    section: "General Awareness",
    topic: "Banking Awareness",
    title: "SLR vs CRR — what actually changes for a bank's lending?",
    body: "I can recite the numbers. In the mock they asked what happens to credit creation when SLR is cut and I froze.",
    author: "Divya R",
    ago: "1d",
    stuck: 121,
    answers: 6,
    solved: false,
  },
  {
    id: "d5",
    section: "Quantitative Aptitude",
    topic: "Quadratic Comparison",
    title: "Is there a case where you genuinely cannot compare x and y?",
    body: "Roots overlap: x = {2, 5}, y = {3, 4}. Answer key says 'no relation'. Fine. But how fast can you see that without solving both fully?",
    author: "Kabir S",
    ago: "1d",
    stuck: 98,
    answers: 9,
    solved: true,
  },
  {
    id: "d6",
    section: "Computer Aptitude",
    topic: "Networking",
    title: "For IBPS Clerk, how deep does the OSI layer stuff actually go?",
    body: "Past papers only ever seem to ask layer names and one protocol each. Am I over-preparing this?",
    author: "Meera J",
    ago: "2d",
    stuck: 44,
    answers: 4,
    solved: true,
  },
];

const PLAN: PlanTier = "free";
const USED = 2;

export function CommunityView() {
  const { profile } = useApp();
  const [section, setSection] = useState<Subject | "All">("All");
  const [sort, setSort] = useState<"stuck" | "new">("stuck");
  const [stuckOn, setStuckOn] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState(false);

  const quota = POST_QUOTA[PLAN];
  const left = quota - USED;

  const list = useMemo(() => {
    const rows = DOUBTS.filter((d) => section === "All" || d.section === section);
    return sort === "stuck"
      ? [...rows].sort((a, b) => b.stuck - a.stuck)
      : rows;
  }, [section, sort]);

  const toggleStuck = (id: string) =>
    setStuckOn((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div>
      <PageHeader
        title="Community"
        sub="Doubts pinned to a section and a topic, ranked by how many people are blocked on the same thing. Not a feed."
        actions={
          <>
            {/* The quota is a thing you spend, so it is drawn, not stated. */}
            <span className="mr-1 flex items-center gap-2">
              <span className="flex gap-1" aria-hidden>
                {Array.from({ length: quota }, (_, i) => (
                  <span
                    key={i}
                    className={`h-4 w-1.5 rounded-pill ${i < left ? "bg-brand" : "bg-line"}`}
                  />
                ))}
              </span>
              <span className="tnum text-[13px] text-ink-3">
                {left} of {quota} left
              </span>
            </span>
            <Button onClick={() => setDraft((v) => !v)} disabled={left === 0}>
              Ask a doubt
            </Button>
          </>
        }
      />

      <div className="max-w-4xl">
        {draft ? (
          <form
            className="card mb-6 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              setDraft(false);
            }}
          >
            <p className="text-[13px] text-ink-3">
              Posting as {profile.name}. A doubt has to name its section and
              topic — that is what makes it findable by the next person stuck
              there.
            </p>
            <input
              autoFocus
              placeholder="What exactly are you stuck on?"
              className="mt-3 w-full border-b border-line pb-2 text-[15px] outline-none placeholder:text-ink-4 focus:border-brand"
            />
            <textarea
              rows={3}
              placeholder="What have you already tried? Which mock or paper was it in?"
              className="mt-3 w-full resize-none text-[14px] leading-relaxed outline-none placeholder:text-ink-4"
            />
            <div className="mt-4 flex items-center gap-3 border-t border-line pt-4">
              <select className="h-9 rounded-ctl border border-line bg-canvas px-2.5 text-[13px] outline-none">
                {SECTIONS.map((s) => (
                  <option key={s}>{SECTION_LABEL[s]}</option>
                ))}
              </select>
              <span className="flex-1" />
              <Button variant="ghost" onClick={() => setDraft(false)}>
                Cancel
              </Button>
              <Button type="submit">Post · uses 1 of {left}</Button>
            </div>
          </form>
        ) : null}

        <div className="mb-2 flex flex-wrap items-center gap-4">
          <Segmented
            value={section}
            options={["All", ...SECTIONS] as const}
            onChange={setSection}
            labels={{ ...SECTION_LABEL, All: "All" }}
          />
          <span className="flex-1" />
          <button
            type="button"
            onClick={() => setSort((v) => (v === "stuck" ? "new" : "stuck"))}
            className="text-[13px] text-ink-3 hover:text-ink"
          >
            {sort === "stuck" ? "Most stuck ↓" : "Newest ↓"}
          </button>
        </div>

        {list.length === 0 ? (
          <Empty
            title="Nothing open in this section"
            sub="Either everyone has it cold, or nobody has sat it yet. Ask the first doubt."
          />
        ) : (
          <ul className="grid gap-3">
            {list.map((d) => {
              const mine = stuckOn.has(d.id);
              return (
                <li
                  key={d.id}
                  className="card flex gap-4 p-5 transition-colors duration-200 hover:bg-brand-soft/40"
                >
                  {/* Stuck count, not upvotes: it measures a blind spot, so it
                      reads as a number of people, not a score. */}
                  <button
                    type="button"
                    onClick={() => toggleStuck(d.id)}
                    aria-pressed={mine}
                    className={`h-fit w-14 shrink-0 rounded-ctl border py-2 text-center transition-colors ${
                      mine
                        ? "border-brand bg-brand-soft text-brand"
                        : "border-line bg-canvas text-ink-3 hover:border-line-2 hover:text-ink"
                    }`}
                  >
                    <span className="tnum block text-[15px]">
                      {d.stuck + (mine ? 1 : 0)}
                    </span>
                    <span className="block text-[10px] leading-tight">
                      stuck
                    </span>
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[13px] text-ink-3">
                      <span className="font-medium text-ink-2">
                        {SECTION_LABEL[d.section]}
                      </span>
                      <span aria-hidden>·</span>
                      <span>{d.topic}</span>
                      {d.solved ? (
                        <span className="rounded-pill bg-ok-soft px-2.5 py-0.5 text-[13px] text-ok">
                          answered
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-1 text-[15px] font-medium leading-snug">
                      {d.title}
                    </h3>
                    <p className="mt-1 max-w-[70ch] text-[13px] leading-relaxed text-ink-3">
                      {d.body}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-[13px] text-ink-3">
                      <span>{d.author}</span>
                      <span aria-hidden>·</span>
                      <span>{d.ago} ago</span>
                      <span aria-hidden>·</span>
                      <button type="button" className="hover:text-ink">
                        {d.answers} answers
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-8 max-w-[62ch] text-[13px] leading-relaxed text-ink-3">
          Marking yourself stuck is not a vote. It tags the topic on your own
          attempt map, so the doubts you press here come back as drills.
        </p>
      </div>
    </div>
  );
}
