"use client";

import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export function ProfileView() {
  const { profile, subject, board, streak, points, initials } = useApp();

  return (
    <div className="page page--split">
      <div>
        <div className="page__eyebrow">Account</div>
        <h1 className="page__title">Profile</h1>
        <p className="page__desc">
          Your study identity across question banks, mocks, and marking tools.
        </p>

        <div className="panel" style={{ marginTop: 24 }}>
          <div
            style={{
              display: "flex",
              gap: 18,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div
              className="topbar__avatar"
              style={{ width: 72, height: 72, fontSize: 24 }}
              aria-hidden
            >
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div className="panel__title" style={{ fontSize: 22 }}>
                {profile.name}
              </div>
              <div className="panel__sub">{profile.email}</div>
              <div className="panel__sub" style={{ marginTop: 4 }}>
                {profile.school} · Exam year {profile.examYear}
              </div>
            </div>
            <Link href="/settings">
              <Button variant="outline">Edit in Settings</Button>
            </Link>
          </div>

          {profile.bio && (
            <p
              style={{
                marginTop: 18,
                paddingTop: 18,
                borderTop: "1px solid var(--color-border)",
                color: "var(--color-text-secondary)",
                lineHeight: 1.55,
                fontSize: 14,
              }}
            >
              {profile.bio}
            </p>
          )}
        </div>

        <div className="grid-3" style={{ marginTop: 16 }}>
          <div className="stat-card">
            <div className="stat-card__label">Current subject</div>
            <div className="stat-card__value" style={{ fontSize: 20 }}>
              {subject}
            </div>
            <div className="stat-card__hint">{board} board</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">Streak</div>
            <div className="stat-card__value">{streak}</div>
            <div className="stat-card__hint">Days practising</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">Points</div>
            <div className="stat-card__value">{points}</div>
            <div className="stat-card__hint">Lifetime XP</div>
          </div>
        </div>

        <div className="section-block">
          <div className="section-block__label">Activity</div>
          <div className="section-block__title">Recent study</div>
          <div className="lesson-list" style={{ marginTop: 14 }}>
            {[
              {
                title: "Marked Paper 2 Q5 — mitochondria",
                meta: "Answer Marker · 23/25 · Today",
              },
              {
                title: "PYQ mix · Genetics + Ecology",
                meta: "12 questions · Yesterday",
              },
              {
                title: "A* Memory drill · Epigenetics",
                meta: "Strength 42% → 51% · Mon",
              },
            ].map((item, i) => (
              <div
                key={item.title}
                className={`lesson-card ${i === 0 ? "lesson-card--active" : ""}`}
              >
                {i === 0 && <div className="lesson-card__start">Latest</div>}
                <div className="lesson-card__icon">
                  <span style={{ fontWeight: 800, fontSize: 12 }}>{i + 1}</span>
                </div>
                <div className="lesson-card__body">
                  <div className="lesson-card__title">{item.title}</div>
                  <div className="lesson-card__meta">{item.meta}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className="side-panel">
        <div className="cert-card">
          <div className="cert-card__title">Plan</div>
          <div
            className="cert-card__sub"
            style={{ marginTop: 8, lineHeight: 1.5 }}
          >
            Free · Upgrade for unlimited marking and AI exam generation.
          </div>
          <div style={{ marginTop: 14 }}>
            <Link href="/upgrade">
              <Button size="sm">Upgrade</Button>
            </Link>
          </div>
        </div>
        <div className="detail-list">
          <div className="detail-list__item">
            <div>
              <strong>Member since</strong>
              Jan 2026
            </div>
          </div>
          <div className="detail-list__item">
            <div>
              <strong>Focus board</strong>
              {board}
            </div>
          </div>
          <div className="detail-list__item">
            <div>
              <strong>Settings</strong>
              <Link
                href="/settings"
                style={{ color: "var(--color-primary)", fontWeight: 600 }}
              >
                Open preferences →
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
