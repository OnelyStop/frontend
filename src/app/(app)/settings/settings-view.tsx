"use client";

import { useState } from "react";
import { useApp, type UserProfile, type UserSettings } from "@/context/AppContext";
import type { ExamBoard, Subject } from "@/data/navigation";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import Link from "next/link";

const SUBJECTS: Subject[] = [
  "Biology",
  "Chemistry",
  "Physics",
  "Economics",
  "History",
  "English Literature",
  "Maths",
];

const BOARDS: ExamBoard[] = ["OCR", "AQA", "Edexcel", "CIE"];

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
    <div className="page" style={{ maxWidth: 860 }}>
      <div className="page__eyebrow">Account</div>
      <h1 className="page__title">Settings</h1>
      <p className="page__desc">
        Update your profile, default exam context, and notification preferences.
      </p>

      <div className="panel" style={{ marginTop: 24 }}>
        <div className="panel__title">Profile details</div>
        <div className="panel__sub">Shown on your profile and in study summaries</div>
        <div className="form-grid">
          <div className="grid-2">
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="school">School / college</label>
              <input
                id="school"
                value={draft.school}
                onChange={(e) => setDraft({ ...draft, school: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="examYear">Exam year</label>
              <input
                id="examYear"
                value={draft.examYear}
                onChange={(e) => setDraft({ ...draft, examYear: e.target.value })}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              value={draft.bio}
              onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="panel__title">Default study context</div>
        <div className="panel__sub">
          Used across the app — also editable from the top bar
        </div>
        <div className="form-grid">
          <div className="field">
            <label>Subject</label>
            <div className="chip-row">
              {SUBJECTS.map((s) => (
                <Chip key={s} active={subject === s} onClick={() => setSubject(s)}>
                  {s}
                </Chip>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Exam board</label>
            <div className="chip-row">
              {BOARDS.map((b) => (
                <Chip key={b} active={board === b} onClick={() => setBoard(b)}>
                  {b}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="panel__title">Preferences</div>
        <div className="form-grid" style={{ gap: 12 }}>
          {(
            [
              ["emailDigest", "Email digest", "Daily summary of practice and weak topics"],
              ["weeklyReport", "Weekly report", "Sunday recap of accuracy and exam scores"],
              ["practiceReminders", "Practice reminders", "Nudge when your streak is at risk"],
              ["soundEffects", "Sound effects", "Soft cues in interview and drills"],
              ["reduceMotion", "Reduce motion", "Minimise animations across the UI"],
            ] as const
          ).map(([key, title, hint]) => (
            <label
              key={key}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid var(--color-border)",
                background: "var(--color-bg-subtle)",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={prefs[key]}
                onChange={(e) => setPrefs({ ...prefs, [key]: e.target.checked })}
                style={{ marginTop: 3 }}
              />
              <span>
                <strong style={{ display: "block", fontSize: 14 }}>{title}</strong>
                <span
                  style={{
                    display: "block",
                    marginTop: 2,
                    fontSize: 13,
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {hint}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div
        style={{
          marginTop: 20,
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Button size="lg" onClick={save}>
          Save changes
        </Button>
        <Link href="/profile">
          <Button variant="outline" size="lg">
            View profile
          </Button>
        </Link>
        {saved && (
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--color-success)",
            }}
          >
            Saved
          </span>
        )}
      </div>
    </div>
  );
}
