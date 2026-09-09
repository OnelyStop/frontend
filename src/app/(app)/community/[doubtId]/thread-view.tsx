"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageCircleQuestion } from "lucide-react";
import {
  Avatar,
  Button,
  Canvas,
  CanvasTitle,
  Card,
  Empty,
  EventCard,
  EventMark,
  type EventTone,
  SectionTitle,
  StatusPill,
  Textarea,
} from "@/design-system";
import { SECTION_LABEL, SECTION_FROM_DB } from "@/data/navigation";
import type { DoubtThread } from "@/features/community/types";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";

// Walked per reply so a long thread stays scannable rather than one block of colour.
const REPLY_TONES: EventTone[] = ["info", "ok", "warn", "brand"];

const WHEN = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

export function ThreadView({ thread }: { thread: DoubtThread }) {
  const router = useRouter();
  const { doubt, replies } = thread;
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    const text = body.trim();
    if (text.length < 2 || busy) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/v1/community/doubts/${doubt.id}/replies`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body: text }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(
        res.status === 429
          ? "You are replying faster than we can post. Give it a minute."
          : "That did not post. Try again.",
      );
      return;
    }
    setBody("");
    router.refresh();
  };

  return (
    <Canvas
      aside={
        <>
          <SectionTitle>Add a reply</SectionTitle>
          <Card>
            <Textarea
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Answer the question that was asked, and say what you would skip."
              aria-label="Your reply"
            />
            {error ? (
              <p className="text-bad mt-3 text-[13px]">{error}</p>
            ) : null}
            <Button
              onClick={send}
              disabled={busy || body.trim().length < 2}
              className="mt-4 w-full"
            >
              {busy ? "Posting…" : "Post reply"}
            </Button>
            <p className="text-ink-3 mt-3 text-[12.5px] leading-relaxed">
              Replies are not metered — only starting a thread is.
            </p>
          </Card>
        </>
      }
    >
      <Link
        href="/community"
        className="text-ink-2 hover:text-ink mb-6 inline-flex items-center gap-2 text-[13.5px]"
      >
        <ArrowLeft size={16} strokeWidth={2} />
        All doubts
      </Link>

      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <StatusPill tone="brand">
          {SECTION_LABEL[SECTION_FROM_DB[doubt.section]] ?? doubt.section}
        </StatusPill>
        <StatusPill tone="neutral">{doubt.topic}</StatusPill>
        <StatusPill tone={doubt.stuckCount > 0 ? "warn" : "neutral"}>
          {doubt.stuckCount} stuck
        </StatusPill>
      </div>

      <CanvasTitle>{doubt.title}</CanvasTitle>

      <div className="mb-8">
        <EventCard
          kind={doubt.author}
          when={WHEN.format(new Date(doubt.createdAt))}
          tone="brand"
          mark={
            <EventMark disc>
              <MessageCircleQuestion strokeWidth={2} />
            </EventMark>
          }
        >
          <span className="whitespace-pre-wrap">{doubt.body}</span>
        </EventCard>
      </div>

      <SectionTitle aside={replies.length ? `${replies.length}` : undefined}>
        {replies.length === 0
          ? "No replies yet"
          : replies.length === 1
            ? "1 reply"
            : `${replies.length} replies`}
      </SectionTitle>

      {replies.length === 0 ? (
        <Empty
          mark="💬"
          tone="brand"
          title="Be the first to answer"
          sub="Someone is stuck on this. A short, specific answer is worth more than a long one."
        />
      ) : (
        <ul className="grid gap-3">
          {replies.map((r, i) => (
            <li key={r.id}>
              <EventCard
                kind={r.author}
                when={WHEN.format(new Date(r.createdAt))}
                tone={REPLY_TONES[i % REPLY_TONES.length]}
                mark={<Avatar size={28}>{initials(r.author)}</Avatar>}
              >
                <span className="whitespace-pre-wrap">{r.body}</span>
              </EventCard>
            </li>
          ))}
        </ul>
      )}
    </Canvas>
  );
}
