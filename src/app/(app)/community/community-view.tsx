"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, MessageCircleQuestion } from "lucide-react";
import {
  Button,
  Dropdown,
  Empty,
  EventCard,
  EventMark,
  type EventTone,
  PageHeader,
  Segmented,
  StatusPill,
} from "@/design-system";
import { SECTIONS, SECTION_LABEL, type Subject } from "@/data/navigation";
import {
  useDoubts,
  usePostDoubt,
  useToggleStuck,
} from "@/features/community/hooks";
import type { Doubt, Sort } from "@/features/community/types";

// Each section keeps one fill, so a mixed feed is scannable by colour.
const SECTION_TONE: Record<string, EventTone> = {
  quant: "info",
  reasoning: "brand",
  english: "ok",
  ga: "warn",
  computer: "info",
};

const RELATIVE = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function ago(iso: string): string {
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000;
  const [unit, size]: [Intl.RelativeTimeFormatUnit, number] =
    seconds < 3600
      ? ["minute", 60]
      : seconds < 86_400
        ? ["hour", 3600]
        : ["day", 86_400];
  return RELATIVE.format(-Math.floor(seconds / size), unit);
}

export function CommunityView() {
  const [section, setSection] = useState<Subject | "All">("All");
  const [sort, setSort] = useState<Sort>("stuck");
  const [drafting, setDrafting] = useState(false);

  const filters = { section: section === "All" ? null : section, sort };
  const feed = useDoubts(filters);
  const toggleStuck = useToggleStuck(filters);
  const post = usePostDoubt(filters);

  const doubts = feed.data?.pages.flatMap((p) => p.doubts) ?? [];

  return (
    <div>
      <PageHeader
        title="Community"
        sub="Doubts ranked by how many people are stuck on the same thing."
        actions={
          <Button onClick={() => setDrafting((v) => !v)}>Ask a doubt</Button>
        }
      />

      <div className="max-w-4xl">
        {drafting ? (
          <DoubtForm
            pending={post.isPending}
            error={post.error?.message ?? null}
            onCancel={() => setDrafting(false)}
            onSubmit={(input) =>
              post.mutate(input, { onSuccess: () => setDrafting(false) })
            }
          />
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
            className="text-ink-3 hover:text-ink text-[13px]"
          >
            {sort === "stuck" ? "Most stuck ↓" : "Newest ↓"}
          </button>
        </div>

        {feed.isPending ? (
          <div className="text-ink-3 py-8 text-[13.5px]">Loading doubts…</div>
        ) : feed.error ? (
          <Empty
            title="Could not load doubts"
            sub="Check your connection and try again."
          />
        ) : doubts.length === 0 ? (
          <Empty
            title="Nothing open in this section"
            sub="Either everyone has it cold, or nobody has sat it yet. Ask the first doubt."
          />
        ) : (
          <>
            <ul className="grid gap-3">
              {doubts.map((d) => (
                <DoubtCard
                  key={d.id}
                  doubt={d}
                  onToggle={() =>
                    toggleStuck.mutate({ id: d.id, stuck: !d.stuckByMe })
                  }
                />
              ))}
            </ul>

            {feed.hasNextPage ? (
              <div className="mt-5 flex justify-center">
                <Button
                  variant="ghost"
                  onClick={() => feed.fetchNextPage()}
                  disabled={feed.isFetchingNextPage}
                >
                  {feed.isFetchingNextPage ? "Loading…" : "Load more"}
                </Button>
              </div>
            ) : null}
          </>
        )}

        <p className="text-ink-3 mt-8 max-w-[62ch] text-[13px] leading-relaxed">
          Marking yourself stuck is not a vote. It tags the topic on your own
          attempt map, so the doubts you press here come back as drills.
        </p>
      </div>
    </div>
  );
}

function DoubtCard({
  doubt,
  onToggle,
}: {
  doubt: Doubt;
  onToggle: () => void;
}) {
  return (
    <li>
      <EventCard
        kind={doubt.title}
        when={ago(doubt.createdAt)}
        tone={doubt.stuckByMe ? "brand" : SECTION_TONE[doubt.section]}
        mark={
          <EventMark disc>
            <MessageCircleQuestion strokeWidth={2} />
          </EventMark>
        }
        footer={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onToggle}
              aria-pressed={doubt.stuckByMe}
              className="press"
            >
              <StatusPill tone={doubt.stuckByMe ? "brand" : "soon"}>
                {doubt.stuckCount} stuck
              </StatusPill>
            </button>
            <StatusPill tone="neutral">
              {SECTION_LABEL[doubt.section]} · {doubt.topic}
            </StatusPill>
            <Link
              href={`/community/${doubt.id}`}
              aria-label={`Open ${doubt.title}`}
              className="press ml-auto"
            >
              <StatusPill tone="live">
                Open <ArrowUpRight size={14} strokeWidth={2} />
              </StatusPill>
            </Link>
          </div>
        }
      >
        {doubt.body}
      </EventCard>
    </li>
  );
}

function DoubtForm({
  pending,
  error,
  onCancel,
  onSubmit,
}: {
  pending: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (input: {
    section: Subject;
    topic: string;
    title: string;
    body: string;
  }) => void;
}) {
  const [section, setSection] = useState<Subject>(SECTIONS[0]);
  const [topic, setTopic] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  return (
    <form
      className="card mb-6 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ section, topic, title, body });
      }}
      /* A Card renders a section, and a form cannot be one — this keeps the same paper. */
    >
      <p className="text-ink-3 text-[13px]">
        A doubt has to name its section and topic — that is what makes it
        findable by the next person stuck there.
      </p>
      <input
        autoFocus
        required
        minLength={10}
        maxLength={160}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What exactly are you stuck on?"
        className="border-line placeholder:text-ink-4 focus:border-brand mt-3 w-full border-b pb-2 text-[15px] outline-none"
      />
      <textarea
        rows={3}
        required
        minLength={20}
        maxLength={4000}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What have you already tried? Which mock or paper was it in?"
        className="placeholder:text-ink-4 mt-3 w-full resize-none text-[14px] leading-relaxed outline-none"
      />
      {error ? (
        <p className="text-bad mt-2 text-[13px]">
          {error === "quota_exceeded"
            ? "You have used this month's posts."
            : "Could not post. Check the title and body lengths."}
        </p>
      ) : null}
      <div className="border-line mt-4 flex items-center gap-3 border-t pt-4">
        <Dropdown
          value={section}
          onChange={setSection}
          label="Section"
          options={SECTIONS.map((s) => ({
            value: s,
            label: SECTION_LABEL[s],
          }))}
        />
        <input
          required
          maxLength={80}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Topic, e.g. Caselet DI"
          className="rounded-ctl border-line bg-canvas h-9 border px-2.5 text-[13px] outline-none"
        />
        <span className="flex-1" />
        <Button variant="ghost" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Posting…" : "Post"}
        </Button>
      </div>
    </form>
  );
}
