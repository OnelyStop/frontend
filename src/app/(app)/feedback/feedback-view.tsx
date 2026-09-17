"use client";

import { useState } from "react";
import { Check, Send } from "lucide-react";
import { Button, Input, PageHeader, Textarea } from "@/design-system";

const ERROR_COPY: Record<string, string> = {
  daily_limit: "You've sent a lot today — try again tomorrow.",
  rate_limited: "Slow down a moment, then send it again.",
  invalid_body:
    "Give it a subject of at least 3 characters and a message of at least 10.",
};

export function FeedbackView({ from }: { from: string | null }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ready = subject.trim().length >= 3 && message.trim().length >= 10;

  const send = async () => {
    if (!ready || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });
      if (res.ok) {
        setSent(subject.trim());
        setSubject("");
        setMessage("");
        return;
      }
      const { error: code } = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      setError(ERROR_COPY[code ?? ""] ?? "That didn't send. Try again.");
    } catch {
      setError("That didn't send. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Feedback"
        sub="Something broken, missing, or working well? Write it the way you'd write an email — it goes straight to the people building onelystop, and every one is read."
      />

      <div className="card mx-auto max-w-[720px] overflow-hidden">
        {sent ? (
          <div className="p-10 text-center" role="status">
            <span className="bg-ok-soft text-ok mx-auto grid size-12 place-items-center rounded-full">
              <Check size={22} strokeWidth={2} />
            </span>
            <p className="mt-4 text-[18px] font-semibold tracking-[-0.01em]">
              Sent. Thank you.
            </p>
            <p className="text-ink-3 mx-auto mt-1.5 max-w-[46ch] text-[14px]">
              “{sent}” is with the team. If it needs a reply, we'll write to the
              address on your account.
            </p>
            <Button
              variant="secondary"
              className="mt-6"
              onClick={() => setSent(null)}
            >
              Write another
            </Button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <div className="border-line flex items-center gap-3 border-b px-6 py-3.5 text-[14px]">
              <span className="text-ink-3 w-16 shrink-0">To</span>
              <span className="bg-panel rounded-pill px-3 py-1 text-[13px]">
                onelystop team
              </span>
            </div>
            <div className="border-line flex items-center gap-3 border-b px-6 py-3.5 text-[14px]">
              <span className="text-ink-3 w-16 shrink-0">From</span>
              <span className="text-ink-2 truncate">
                {from ?? "Your account"}
              </span>
            </div>
            <div className="border-line flex items-center gap-3 border-b px-6 py-1.5 text-[14px]">
              <label htmlFor="fb-subject" className="text-ink-3 w-16 shrink-0">
                Subject
              </label>
              <Input
                id="fb-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={140}
                placeholder="What's this about?"
                className="h-11 flex-1 border-0 bg-transparent px-0 shadow-none focus:ring-0"
              />
            </div>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={5000}
              rows={12}
              aria-label="Message"
              placeholder="Write as much or as little as you like. What were you doing, what did you expect, and what happened?"
              className="min-h-[260px] w-full rounded-none border-0 bg-transparent px-6 py-5 shadow-none focus:ring-0"
            />
            <div className="border-line flex flex-wrap items-center gap-3 border-t px-6 py-4">
              {error ? (
                <p role="alert" className="text-bad text-[13px]">
                  {error}
                </p>
              ) : (
                <p className="tnum text-ink-3 text-[13px]">
                  {message.length > 0 ? `${message.length} / 5000` : " "}
                </p>
              )}
              <span className="flex-1" />
              <Button type="submit" disabled={!ready || sending}>
                <Send size={15} strokeWidth={2} />
                {sending ? "Sending…" : "Send"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
