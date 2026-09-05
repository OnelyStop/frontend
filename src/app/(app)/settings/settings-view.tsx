"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, PageHeader, SectionTitle } from "@/design-system";
import { EXAMS, SECTIONS, SECTION_SHORT } from "@/data/navigation";
import type { Profile, ProfileUpdate } from "@/features/profile/types";

type Draft = {
  displayName: string;
  school: string;
  targetYear: string;
  bio: string;
  examBoard: (typeof EXAMS)[number];
  defaultSection: (typeof SECTIONS)[number];
};

function toDraft(profile: Profile | null): Draft {
  return {
    displayName: profile?.displayName ?? "",
    school: profile?.school ?? "",
    targetYear: profile?.targetYear ? String(profile.targetYear) : "",
    bio: profile?.bio ?? "",
    examBoard: profile?.examBoard ?? EXAMS[0],
    defaultSection: profile?.defaultSection ?? SECTIONS[0],
  };
}

// An empty box means "no value", not the empty string: the column is nullable
// and a blank school should clear it rather than store "".
const orNull = (v: string) => (v.trim() === "" ? null : v.trim());

function toPatch(d: Draft): ProfileUpdate {
  return {
    displayName: orNull(d.displayName),
    school: orNull(d.school),
    bio: orNull(d.bio),
    targetYear: d.targetYear.trim() === "" ? null : Number(d.targetYear),
    examBoard: d.examBoard,
    defaultSection: d.defaultSection,
  };
}

function Field({
  label,
  id,
  value,
  onChange,
  inputMode,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  inputMode?: "numeric";
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-ink-3 block text-[13px]">{label}</span>
      <input
        id={id}
        value={value}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-ctl border-line bg-canvas focus:border-brand mt-1 h-10 w-full border px-3 text-[14px] transition-colors outline-none"
      />
    </label>
  );
}

export function SettingsView({ profile }: { profile: Profile | null }) {
  const router = useRouter();
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
      // The header and every page read the profile on the server, so they only
      // pick up the new exam board once the route re-renders.
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

      <Card>
        <SectionTitle>Your details</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="displayName"
            label="Full name"
            value={draft.displayName}
            onChange={(v) => set("displayName", v)}
          />
          <Field
            id="school"
            label="Coaching / college"
            value={draft.school}
            onChange={(v) => set("school", v)}
          />
          <Field
            id="targetYear"
            label="Target year"
            inputMode="numeric"
            value={draft.targetYear}
            onChange={(v) => set("targetYear", v)}
          />
        </div>
        <label htmlFor="bio" className="mt-4 block">
          <span className="text-ink-3 block text-[13px]">Bio</span>
          <textarea
            id="bio"
            rows={3}
            value={draft.bio}
            onChange={(e) => set("bio", e.target.value)}
            className="rounded-ctl border-line bg-canvas focus:border-brand mt-1 w-full resize-none border px-3 py-2 text-[14px] leading-relaxed transition-colors outline-none"
          />
        </label>
      </Card>

      <Card className="mt-5">
        <SectionTitle>Exam you are preparing for</SectionTitle>
        <p className="text-ink-3 -mt-2 mb-4 text-[13px]">
          Sets the cutoffs, sectional timing and paper pattern used everywhere.
        </p>
        <div className="flex flex-wrap gap-2">
          {EXAMS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => set("examBoard", b)}
              className={`rounded-pill h-10 border px-4 text-[13px] font-medium transition-colors ${
                draft.examBoard === b
                  ? "border-ink bg-ink text-white"
                  : "border-line bg-canvas hover:border-line-2"
              }`}
            >
              {b}
            </button>
          ))}
        </div>

        <div className="mt-7">
          <SectionTitle>Section you open on</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {SECTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => set("defaultSection", s)}
                className={`rounded-pill h-10 border px-4 text-[13px] font-medium transition-colors ${
                  draft.defaultSection === s
                    ? "border-ink bg-ink text-white"
                    : "border-line bg-canvas hover:border-line-2"
                }`}
              >
                {SECTION_SHORT[s]}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="mt-6 flex items-center gap-5">
        <Link href="/profile" className="text-ink-3 hover:text-ink text-[13px]">
          View profile
        </Link>
        <Link href="/upgrade" className="text-ink-3 hover:text-ink text-[13px]">
          Manage plan
        </Link>
      </div>
    </div>
  );
}
