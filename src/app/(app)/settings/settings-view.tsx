"use client";

import { useState } from "react";
import Link from "next/link";
import { useApp, type UserProfile, type UserSettings } from "@/context/AppContext";
import { Button, Card, PageHeader, SectionTitle } from "@/design-system";
import { EXAMS, SECTIONS, SECTION_SHORT } from "@/data/navigation";

const PREFS: [keyof UserSettings, string, string][] = [
  ["emailDigest", "Daily digest", "One mail at 7am: what is due and which section is under cutoff"],
  ["weeklyReport", "Weekly report", "Sunday recap of accuracy, pace and marks lost to negative marking"],
  ["practiceReminders", "Practice reminders", "A nudge when the streak is about to break"],
  ["soundEffects", "Sound cues", "Soft ticks in timed drills and exam conditions"],
  ["reduceMotion", "Reduce motion", "Minimise animation across the app"],
];

function Field({
  label,
  id,
  value,
  onChange,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="block text-[13px] text-ink-3">{label}</span>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-10 w-full rounded-ctl border border-line bg-canvas px-3 text-[14px] outline-none transition-colors focus:border-brand"
      />
    </label>
  );
}

export function SettingsView() {
  const {
    profile,
    setProfile,
    settings,
    setSettings,
    subject,
    setSubject,
    board,
    setBoard,
  } = useApp();

  const [draft, setDraft] = useState<UserProfile>(profile);
  const [prefs, setPrefs] = useState<UserSettings>(settings);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setProfile(draft);
    setSettings(prefs);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        sub="Your details, the exam everything is calibrated to, and what we email you."
        actions={
          <>
            {saved ? (
              <span className="mr-1 text-[13px] font-medium text-ok">Saved</span>
            ) : null}
            <Button onClick={save}>Save changes</Button>
          </>
        }
      />

      <Card>
        <SectionTitle>Your details</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="name"
            label="Full name"
            value={draft.name}
            onChange={(v) => setDraft({ ...draft, name: v })}
          />
          <Field
            id="email"
            label="Email"
            value={draft.email}
            onChange={(v) => setDraft({ ...draft, email: v })}
          />
          <Field
            id="school"
            label="Coaching / college"
            value={draft.school}
            onChange={(v) => setDraft({ ...draft, school: v })}
          />
          <Field
            id="examYear"
            label="Target year"
            value={draft.examYear}
            onChange={(v) => setDraft({ ...draft, examYear: v })}
          />
        </div>
        <label htmlFor="bio" className="mt-4 block">
          <span className="block text-[13px] text-ink-3">Bio</span>
          <textarea
            id="bio"
            rows={3}
            value={draft.bio}
            onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
            className="mt-1 w-full resize-none rounded-ctl border border-line bg-canvas px-3 py-2 text-[14px] leading-relaxed outline-none transition-colors focus:border-brand"
          />
        </label>
      </Card>

      <Card className="mt-5">
        <SectionTitle>Exam you are preparing for</SectionTitle>
        <p className="-mt-2 mb-4 text-[13px] text-ink-3">
          Sets the cutoffs, sectional timing and paper pattern used everywhere.
        </p>
        <div className="flex flex-wrap gap-2">
          {EXAMS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBoard(b)}
              className={`h-10 rounded-pill border px-4 text-[13px] font-medium transition-colors ${
                board === b
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
                onClick={() => setSubject(s)}
                className={`h-10 rounded-pill border px-4 text-[13px] font-medium transition-colors ${
                  subject === s
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

      <Card className="mt-5" pad={false}>
        <div className="px-6 pb-2 pt-6">
          <SectionTitle>Notifications</SectionTitle>
        </div>
        <div className="divide-y divide-line">
          {PREFS.map(([key, title, hint]) => (
            <label
              key={key}
              className="flex cursor-pointer items-start gap-3 px-6 py-4 transition-colors hover:bg-brand-soft/40"
            >
              <input
                type="checkbox"
                checked={prefs[key]}
                onChange={(e) => setPrefs({ ...prefs, [key]: e.target.checked })}
                className="mt-0.5 size-4 accent-brand"
              />
              <span>
                <span className="block text-[14px] font-medium">{title}</span>
                <span className="mt-0.5 block text-[13px] leading-relaxed text-ink-3">
                  {hint}
                </span>
              </span>
            </label>
          ))}
        </div>
      </Card>

      <div className="mt-6 flex items-center gap-5">
        <Link href="/profile" className="text-[13px] text-ink-3 hover:text-ink">
          View profile
        </Link>
        <Link href="/upgrade" className="text-[13px] text-ink-3 hover:text-ink">
          Manage plan
        </Link>
      </div>
    </div>
  );
}
