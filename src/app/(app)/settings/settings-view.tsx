"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Field, Input, PageHeader, Textarea } from "@/design-system";
import {
  EXAM_TYPES,
  SECTIONS,
  SECTION_LABEL,
  type ExamBoard,
} from "@/data/navigation";
import type { Profile, ProfileUpdate } from "@/features/profile/types";
import { useApp } from "@/context/AppContext";
import { isAvatarKey, type AvatarKey } from "@/features/profile/avatars";
import { AvatarPicker } from "@/features/profile/components/AvatarPicker";
import { CloseAccountCard } from "./close-account-card";

type Draft = {
  displayName: string;
  avatar: AvatarKey | null;
  school: string;
  targetYear: string;
  bio: string;
  examBoard: ExamBoard;
  defaultSection: (typeof SECTIONS)[number];
};

function toDraft(profile: Profile | null): Draft {
  return {
    displayName: profile?.displayName ?? "",
    avatar: isAvatarKey(profile?.avatar) ? profile.avatar : null,
    school: profile?.school ?? "",
    targetYear: profile?.targetYear ? String(profile.targetYear) : "",
    bio: profile?.bio ?? "",
    examBoard: profile?.examBoard ?? "Banking",
    defaultSection: profile?.defaultSection ?? SECTIONS[0],
  };
}

// The column is nullable: a blank box should clear it, not store "".
const orNull = (v: string) => (v.trim() === "" ? null : v.trim());

function toPatch(d: Draft): ProfileUpdate {
  return {
    displayName: orNull(d.displayName),
    avatar: d.avatar,
    school: orNull(d.school),
    bio: orNull(d.bio),
    targetYear: d.targetYear.trim() === "" ? null : Number(d.targetYear),
    examBoard: d.examBoard,
    defaultSection: d.defaultSection,
  };
}

export function SettingsView({ profile }: { profile: Profile | null }) {
  const router = useRouter();
  const { initials } = useApp();
  const [draft, setDraft] = useState<Draft>(() => toDraft(profile));
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const save = async () => {
    setState("saving");
    setMessage(null);
    try {
      const res = await fetch("/api/v1/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(toPatch(draft)),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setMessage(
          body?.error === "invalid_body"
            ? "Check the target year — it has to be a year between 2000 and 2100."
            : "Could not save. Try again.",
        );
        setState("error");
        return;
      }
      setState("saved");
      router.refresh();
      window.setTimeout(() => setState("idle"), 2000);
    } catch {
      setMessage("Could not reach the server.");
      setState("error");
    }
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        sub="Your details and the exam everything is calibrated to."
        actions={
          <>
            {state === "saved" ? (
              <span className="text-ok mr-1 text-[13px] font-medium">
                Saved
              </span>
            ) : null}
            {state === "error" && message ? (
              <span className="text-bad mr-1 max-w-[36ch] text-[13px]">
                {message}
              </span>
            ) : null}
            <Button onClick={save} disabled={state === "saving"}>
              {state === "saving" ? "Saving…" : "Save changes"}
            </Button>
          </>
        }
      />

      <div className="border-line max-w-4xl border-t">
        <Row label="Avatar" hint="Without one you keep your initials.">
          <AvatarPicker
            value={draft.avatar}
            onChange={(next) => setDraft((d) => ({ ...d, avatar: next }))}
            initials={initials}
          />
        </Row>

        <Row label="Name">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="displayName">
              <Input
                id="displayName"
                value={draft.displayName}
                onChange={(e) => set("displayName", e.target.value)}
              />
            </Field>
            <Field label="Coaching / college" htmlFor="school">
              <Input
                id="school"
                value={draft.school}
                onChange={(e) => set("school", e.target.value)}
              />
            </Field>
          </div>
        </Row>

        <Row label="Target year" hint="The year you are sitting for.">
          <div className="max-w-44">
            <Input
              id="targetYear"
              inputMode="numeric"
              aria-label="Target year"
              value={draft.targetYear}
              onChange={(e) => set("targetYear", e.target.value)}
            />
          </div>
        </Row>

        <Row label="Bio" hint="Shown on your public profile.">
          <Textarea
            id="bio"
            rows={3}
            aria-label="Bio"
            value={draft.bio}
            onChange={(e) => set("bio", e.target.value)}
          />
        </Row>

        <Row
          label="Exam"
          hint="Sets the question bank, the drills and the cutoffs you are measured against."
        >
          <div className="flex flex-wrap gap-2">
            {EXAM_TYPES.map(({ value, live }) => (
              <Choice
                key={value}
                on={draft.examBoard === value}
                disabled={!live}
                onClick={() => set("examBoard", value)}
              >
                {value}
                {live ? null : <span className="ml-1.5 text-[11px]">soon</span>}
              </Choice>
            ))}
          </div>
        </Row>

        <Row label="Opens on" hint="The section the app lands you in.">
          <div className="flex flex-wrap gap-2">
            {SECTIONS.map((s) => (
              <Choice
                key={s}
                on={draft.defaultSection === s}
                onClick={() => set("defaultSection", s)}
              >
                {SECTION_LABEL[s]}
              </Choice>
            ))}
          </div>
        </Row>
      </div>

      <div className="mt-6 flex items-center gap-2">
        <Link
          href="/profile"
          className="text-ink-3 hover:text-ink inline-flex h-10 items-center text-[13px]"
        >
          View profile
        </Link>
        <Link
          href="/upgrade"
          className="text-ink-3 hover:text-ink inline-flex h-10 items-center px-3 text-[13px]"
        >
          Manage plan
        </Link>
      </div>

      <CloseAccountCard />
    </div>
  );
}

/* A settings page is a ledger, not a stack of cards: label on the left, the control on the right, a hairline between. */
function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-line grid gap-x-10 gap-y-3 border-b py-6 lg:grid-cols-[minmax(0,200px)_minmax(0,1fr)]">
      <div>
        <p className="text-[14px] font-medium">{label}</p>
        {hint ? (
          <p className="text-ink-3 mt-1 max-w-[34ch] text-[12.5px] leading-relaxed">
            {hint}
          </p>
        ) : null}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Choice({
  on,
  disabled,
  onClick,
  children,
}: {
  on: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-pill press h-10 px-4 text-[13px] font-medium transition-colors ${
        disabled
          ? "text-ink-3 cursor-not-allowed opacity-55"
          : on
            ? "bg-ink text-white"
            : "bg-panel text-ink-2 hover:bg-line-2"
      }`}
    >
      {children}
    </button>
  );
}
