"use client";

import { useState } from "react";
import { Button, Empty, PageHeader, Segmented } from "@/design-system";
import { SECTIONS, SECTION_SHORT, type Subject } from "@/data/navigation";
import {
  useDoubts,
  usePostDoubt,
  useToggleStuck,
} from "@/features/community/hooks";
import type { Doubt, Sort } from "@/features/community/types";

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
            labels={{ ...SECTION_SHORT, All: "All" }}
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
    <li className="card hover:bg-brand-soft/40 flex gap-4 p-5 transition-colors duration-200">
      {/* Stuck count, not upvotes: it measures a blind spot, so it reads as a
          number of people, not a score. */}
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={doubt.stuckByMe}
        className={`rounded-ctl h-fit w-14 shrink-0 border py-2 text-center transition-colors ${
          doubt.stuckByMe
            ? "border-brand bg-brand-soft text-brand"
            : "border-line bg-canvas text-ink-3 hover:border-line-2 hover:text-ink"
        }`}
      >
        <span className="tnum block text-[15px]">{doubt.stuckCount}</span>
        <span className="block text-[10px] leading-tight">stuck</span>
      </button>

      <div className="min-w-0 flex-1">
        <div className="text-ink-3 flex items-center gap-2 text-[13px]">
          <span className="text-ink-2 font-medium">
            {SECTION_SHORT[doubt.section]}
          </span>
          <span aria-hidden>·</span>
          <span>{doubt.topic}</span>
        </div>
        <h3 className="mt-1 text-[15px] leading-snug font-medium">
          {doubt.title}
        </h3>
        <p className="text-ink-3 mt-1 max-w-[70ch] text-[13px] leading-relaxed">
          {doubt.body}
        </p>
        <div className="text-ink-3 mt-2 flex items-center gap-3 text-[13px]">
          <span>{doubt.author}</span>
          <span aria-hidden>·</span>
          <span>{ago(doubt.createdAt)}</span>
        </div>
      </div>
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
        <select
          value={section}
          onChange={(e) => setSection(e.target.value as Subject)}
          className="rounded-ctl border-line bg-canvas h-9 border px-2.5 text-[13px] outline-none"
        >
          {SECTIONS.map((s) => (
            <option key={s} value={s}>
              {SECTION_SHORT[s]}
            </option>
          ))}
        </select>
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
