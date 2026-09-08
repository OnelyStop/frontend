"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  Button,
  Card,
  CanvasTitle,
  Empty,
  StatusPill,
  Textarea,
} from "@/design-system";
import { SECTION_LABEL, SECTION_FROM_DB } from "@/data/navigation";
import type { DoubtThread } from "@/features/community/types";

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
    <div className="max-w-[76ch]">
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

      <Card className="mb-8">
        <p className="text-[14.5px] leading-relaxed whitespace-pre-wrap">
          {doubt.body}
        </p>
        <p className="text-ink-3 mt-5 text-[13px]">
          {doubt.author} · {WHEN.format(new Date(doubt.createdAt))}
        </p>
      </Card>

      <h2 className="mb-4 text-[18px] font-bold tracking-[-0.02em]">
        {replies.length === 0
          ? "No replies yet"
          : `${replies.length} ${replies.length === 1 ? "reply" : "replies"}`}
      </h2>

      {replies.length === 0 ? (
        <Card pad={false} className="mb-8">
          <Empty
            mark="💬"
            tone="brand"
            title="Be the first to answer"
            sub="Someone is stuck on this. A short, specific answer is worth more than a long one."
          />
        </Card>
      ) : (
        <ul className="mb-8 grid gap-3">
          {replies.map((r) => (
            <li key={r.id} className="card p-5">
              <p className="text-[14.5px] leading-relaxed whitespace-pre-wrap">
                {r.body}
              </p>
              <p className="text-ink-3 mt-4 text-[12.5px]">
                {r.author} · {WHEN.format(new Date(r.createdAt))}
              </p>
            </li>
          ))}
        </ul>
      )}

      <Card>
        <h3 className="mb-3 text-[15px] font-semibold">Add a reply</h3>
        <Textarea
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Answer the question that was asked, and say what you would skip."
          aria-label="Your reply"
        />
        {error ? <p className="text-bad mt-3 text-[13px]">{error}</p> : null}
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={send} disabled={busy || body.trim().length < 2}>
            {busy ? "Posting…" : "Post reply"}
          </Button>
          <span className="text-ink-3 text-[12.5px]">
            Replies are not metered — only starting a thread is.
          </span>
        </div>
      </Card>
    </div>
  );
}
