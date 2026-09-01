"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Badge, Button } from "@/design-system";
import { blockMeta } from "../blocks";
import { Markdown } from "../markdown";
import type { ChapterOutline, StudyNote, TopicOutline } from "../types";
import { NotesPanel } from "./NotesPanel";
import { TutorPanel } from "./TutorPanel";
import { FlashcardPlayer } from "./FlashcardPlayer";

const DIFFICULTY_TONE = {
  beginner: "ok",
  intermediate: "warn",
  advanced: "bad",
} as const;

const TONE_ACCENT: Record<string, string> = {
  neutral: "border-line",
  brand: "border-brand",
  warn: "border-warn",
  ok: "border-ok",
};

type Panel = "notes" | "tutor" | null;

// Deterministic across server and browser — toLocaleDateString() formats in the
// runtime's locale/timezone and mismatches on hydration (docs/rendering.md).
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function Reader({
  subjectSlug,
  chapterSlug,
  outline,
  chapters,
  initialNotes,
  signedIn,
}: {
  subjectSlug: string;
  chapterSlug: string;
  outline: TopicOutline;
  chapters: ChapterOutline[];
  initialNotes: StudyNote[];
  signedIn: boolean;
}) {
  const [panel, setPanel] = useState<Panel>(null);
  const [selectedBlockKey, setSelectedBlockKey] = useState<string | null>(null);
  const [notes, setNotes] = useState<StudyNote[]>(initialNotes);
  const [cardsOpen, setCardsOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const articleRef = useRef<HTMLElement>(null);
  const savedPctRef = useRef(0);

  const blockTitles = useMemo(
    () => Object.fromEntries(outline.blocks.map((b) => [b.stableKey, b.title])),
    [outline.blocks],
  );
  const notesByBlock = useMemo(() => {
    const m = new Map<string, number>();
    for (const n of notes)
      if (n.blockStableKey)
        m.set(n.blockStableKey, (m.get(n.blockStableKey) ?? 0) + 1);
    return m;
  }, [notes]);

  const postProgress = useCallback(
    (pct: number) => {
      if (!signedIn) return;
      const rounded = Math.round(pct);
      if (rounded <= savedPctRef.current) return;
      savedPctRef.current = rounded;
      void fetch(`/api/study/topics/${outline.id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progressPercent: rounded }),
      }).catch(() => {});
    },
    [outline.id, signedIn],
  );

  // Scroll-driven reading progress, throttled and only ever increasing.
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = articleRef.current;
        if (!el) return;
        const top = el.offsetTop;
        const seen = window.scrollY + window.innerHeight - top;
        const pct = Math.max(0, Math.min(100, (seen / el.offsetHeight) * 100));
        setProgress(pct);
        if (pct > 25) postProgress(Math.min(pct, completed ? 100 : 95));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [postProgress, completed]);

  const markComplete = () => {
    setCompleted(true);
    savedPctRef.current = 0;
    postProgress(100);
  };

  const askAbout = (blockKey: string) => {
    setSelectedBlockKey(blockKey);
    setPanel("tutor");
  };

  const noteOn = (blockKey: string) => {
    setSelectedBlockKey(blockKey);
    setPanel("notes");
  };

  const prevHref = outline.prev
    ? `/study/${subjectSlug}/${chapterSlug}/${outline.prev.slug}`
    : null;
  const nextHref = outline.next
    ? `/study/${subjectSlug}/${chapterSlug}/${outline.next.slug}`
    : null;

  return (
    <div className="lg:grid lg:grid-cols-[190px_minmax(0,1fr)] lg:gap-10">
      {/* chapter / topic tree */}
      <aside className="mb-8 hidden lg:block">
        <div className="sticky top-20">
          <p className="text-ink-3 mb-3 text-[12px]">{outline.chapter.name}</p>
          <nav className="space-y-0.5">
            {chapters
              .find((c) => c.slug === chapterSlug)
              ?.topics.map((t) => (
                <Link
                  key={t.slug}
                  href={`/study/${subjectSlug}/${chapterSlug}/${t.slug}`}
                  className={`rounded-ctl block px-2.5 py-1.5 text-[13px] leading-snug transition-colors ${
                    t.slug === outline.slug
                      ? "bg-brand-soft text-ink"
                      : "text-ink-3 hover:bg-brand-soft/50 hover:text-ink"
                  }`}
                >
                  {t.title}
                </Link>
              ))}
          </nav>
        </div>
      </aside>

      <div className="min-w-0">
        <nav className="text-ink-3 mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
          <Link href="/study" className="hover:text-ink transition-colors">
            Knowledge base
          </Link>
          <span>/</span>
          <Link
            href={`/study/${subjectSlug}`}
            className="hover:text-ink transition-colors"
          >
            {outline.subject.name}
          </Link>
          <span>/</span>
          <span className="text-ink-2">{outline.chapter.name}</span>
        </nav>

        <header className="mb-8">
          <h1 className="text-[34px] leading-[1.1] tracking-[-0.03em]">
            {outline.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <Badge tone={DIFFICULTY_TONE[outline.difficulty]}>
              {outline.difficulty}
            </Badge>
            <span className="tnum text-ink-3 text-[13px]">
              {outline.estimatedMinutes} min read
            </span>
            {outline.lastReviewedAt ? (
              <span className="text-ink-3 text-[13px]">
                · reviewed {fmtDate(outline.lastReviewedAt)}
              </span>
            ) : null}
          </div>
          <p className="text-ink-2 mt-4 max-w-[68ch] text-[15.5px] leading-[1.6]">
            {outline.summary}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              disabled={!signedIn}
              onClick={() => setPanel("tutor")}
            >
              Ask the tutor
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={!signedIn}
              onClick={() => setPanel("notes")}
            >
              Notes{notes.length ? ` (${notes.length})` : ""}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setCardsOpen(true)}
            >
              Study flashcards
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSourcesOpen((v) => !v)}
            >
              Sources ({outline.sources.length})
            </Button>
            {!signedIn ? (
              <span className="text-ink-4 text-[12px]">
                Sign in to take notes or ask the tutor
              </span>
            ) : null}
          </div>

          {sourcesOpen ? (
            <div className="border-line rounded-ctl mt-4 border p-4">
              <p className="text-ink-3 mb-2 text-[12px]">
                Facts cross-checked against these; explanations, examples and
                questions are original.
              </p>
              <ul className="space-y-2">
                {outline.sources.map((s) => (
                  <li key={s.url} className="text-[13px] leading-snug">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="text-brand underline underline-offset-2"
                    >
                      {s.title}
                    </a>
                    <span className="text-ink-3">
                      {" "}
                      — {s.publisher}
                      {s.license ? `, ${s.license}` : ""} · {s.usageMode} ·
                      retrieved {fmtDate(s.retrievedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </header>

        {/* table of contents */}
        <nav className="border-line rounded-ctl mb-8 border p-4">
          <p className="text-ink-3 mb-2 text-[12px]">On this page</p>
          <ol className="grid gap-1 sm:grid-cols-2">
            {outline.blocks.map((b) => (
              <li key={b.stableKey}>
                <a
                  href={`#block-${b.stableKey}`}
                  className="text-ink-2 hover:text-brand text-[13px] transition-colors"
                >
                  {b.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article ref={articleRef} className="space-y-10">
          {outline.blocks.map((b) => {
            const meta = blockMeta(b.type);
            return (
              <section
                key={b.stableKey}
                id={`block-${b.stableKey}`}
                className={
                  meta.tone === "neutral"
                    ? "scroll-mt-24"
                    : `scroll-mt-24 border-l-2 pl-5 ${TONE_ACCENT[meta.tone]}`
                }
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="text-ink-3 text-[13px]">{meta.label}</span>
                  {notesByBlock.get(b.stableKey) ? (
                    <span
                      className="bg-warn size-1.5 rounded-full"
                      title={`${notesByBlock.get(b.stableKey)} note(s) here`}
                    />
                  ) : null}
                </div>
                <h2 className="mb-3 text-[19px] tracking-[-0.02em]">
                  {b.title}
                </h2>
                <Markdown source={b.bodyMarkdown} />
                <div className="mt-3 flex items-center gap-3">
                  {signedIn ? (
                    <>
                      <button
                        onClick={() => askAbout(b.stableKey)}
                        className="text-ink-4 hover:text-brand text-[12px] transition-colors"
                      >
                        Ask about this section
                      </button>
                      <button
                        onClick={() => noteOn(b.stableKey)}
                        className="text-ink-4 hover:text-brand text-[12px] transition-colors"
                      >
                        Add a note
                      </button>
                    </>
                  ) : null}
                  {b.sourceKeys.length ? (
                    <span className="text-ink-4 text-[12px]">
                      source: {b.sourceKeys.join(", ")}
                    </span>
                  ) : null}
                </div>
              </section>
            );
          })}
        </article>

        <div className="border-line mt-12 flex items-center justify-between border-t pt-6">
          {prevHref ? (
            <Link
              href={prevHref}
              className="text-ink-3 hover:text-ink text-[13px] transition-colors"
            >
              ← {outline.prev!.title}
            </Link>
          ) : (
            <span />
          )}
          <Button
            size="sm"
            variant={completed || progress >= 99 ? "secondary" : "primary"}
            onClick={markComplete}
          >
            {completed ? "Marked complete" : "Mark complete"}
          </Button>
          {nextHref ? (
            <Link
              href={nextHref}
              className="text-ink-3 hover:text-ink text-[13px] transition-colors"
            >
              {outline.next!.title} →
            </Link>
          ) : (
            <span />
          )}
        </div>
      </div>

      {panel === "notes" ? (
        <NotesPanel
          topicId={outline.id}
          contentVersion={outline.contentVersion}
          anchorBlockKey={selectedBlockKey}
          blockTitles={blockTitles}
          notes={notes}
          onChange={setNotes}
          onClose={() => setPanel(null)}
        />
      ) : null}

      {panel === "tutor" ? (
        <TutorPanel
          topicSlug={outline.slug}
          selectedBlockKey={selectedBlockKey}
          blockTitles={blockTitles}
          onClose={() => setPanel(null)}
        />
      ) : null}

      {cardsOpen ? (
        <FlashcardPlayer
          topicSlug={outline.slug}
          onClose={() => setCardsOpen(false)}
        />
      ) : null}
    </div>
  );
}
