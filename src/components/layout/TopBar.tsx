"use client";

import { useState } from "react";
import {
  Bell,
  Hexagon,
  LogOut,
  Search,
  Settings,
  User,
  Zap,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import type { ExamBoard, Subject } from "../../data/navigation";
import { Button } from "../ui/Button";
import { Dropdown } from "../ui/Dropdown";
import "./TopBar.css";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

const NOTIFICATIONS = [
  {
    id: "1",
    title: "Streak reminder",
    body: "Practise once today to keep your 12-day streak.",
    time: "2m ago",
    unread: true,
  },
  {
    id: "2",
    title: "Marker feedback ready",
    body: "Paper 2 Q5 marked · 23/25 with improvement notes.",
    time: "1h ago",
    unread: true,
  },
  {
    id: "3",
    title: "A* Memory drill due",
    body: "Epigenetics is scheduled for today’s spaced review.",
    time: "Yesterday",
    unread: false,
  },
];

export function TopBar() {
  const {
    subject,
    board,
    setSubject,
    setBoard,
    streak,
    points,
    profile,
    initials,
  } = useApp();
  const { signOut } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  return (
    <header className="topbar">
      <div className="topbar__row">
        <div className="topbar__search">
          <Search size={16} strokeWidth={1.75} />
          <input
            type="search"
            placeholder="Search topics, past papers, notes…"
            aria-label="Search"
          />
          <kbd className="topbar__kbd">⌘K</kbd>
        </div>

        <div className="topbar__controls">
          <Dropdown
            className="topbar__dd topbar__dd--subject"
            ariaLabel="Subject"
            value={subject}
            options={SUBJECTS.map((s) => ({ value: s, label: s }))}
            onChange={setSubject}
          />

          <Dropdown
            className="topbar__dd topbar__dd--board"
            ariaLabel="Exam board"
            value={board}
            options={BOARDS.map((b) => ({ value: b, label: b }))}
            onChange={setBoard}
          />

          <div className="topbar__stat" title="Streak">
            <Zap size={15} strokeWidth={2} />
            <span>{streak}</span>
          </div>
          <div className="topbar__stat" title="Points">
            <Hexagon size={15} strokeWidth={2} />
            <span>{points}</span>
          </div>

          <div className="topbar__account">
            <button
              type="button"
              className="topbar__icon-btn"
              aria-label="Notifications"
              aria-expanded={notesOpen}
              aria-haspopup="menu"
              onClick={() => {
                setNotesOpen((v) => !v);
                setMenuOpen(false);
              }}
            >
              <Bell size={17} strokeWidth={1.75} />
              <span className="topbar__dot" />
            </button>
            {notesOpen && (
              <div
                className="topbar__menu topbar__menu--notifications"
                role="menu"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="topbar__menu-head">
                  <strong>Notifications</strong>
                  <span>2 unread</span>
                </div>
                <ul className="topbar__notify-list">
                  {NOTIFICATIONS.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        className={`topbar__notify-item ${n.unread ? "topbar__notify-item--unread" : ""}`}
                        role="menuitem"
                        onClick={() => setNotesOpen(false)}
                      >
                        <span className="topbar__notify-title">{n.title}</span>
                        <span className="topbar__notify-body">{n.body}</span>
                        <span className="topbar__notify-time">{n.time}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="topbar__menu-item topbar__menu-item--center"
                  onClick={() => setNotesOpen(false)}
                >
                  Mark all as read
                </button>
              </div>
            )}
          </div>

          <Button size="sm" onClick={() => router.push("/upgrade")}>
            Upgrade
          </Button>

          <div className="topbar__account">
            <button
              type="button"
              className="topbar__avatar"
              aria-label="Account menu"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => {
                setMenuOpen((v) => !v);
                setNotesOpen(false);
              }}
            >
              {initials}
            </button>
            {menuOpen && (
              <div className="topbar__menu" role="menu">
                <div className="topbar__menu-head">
                  <strong>{profile.name}</strong>
                  <span>{profile.email}</span>
                </div>
                <Link
                  href="/profile"
                  role="menuitem"
                  className="topbar__menu-item"
                  onClick={() => setMenuOpen(false)}
                >
                  <User size={15} strokeWidth={1.75} />
                  Profile
                </Link>
                <Link
                  href="/settings"
                  role="menuitem"
                  className="topbar__menu-item"
                  onClick={() => setMenuOpen(false)}
                >
                  <Settings size={15} strokeWidth={1.75} />
                  Settings
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  className="topbar__menu-item"
                  onClick={async () => {
                    setMenuOpen(false);
                    await signOut();
                    router.replace("/");
                  }}
                >
                  <LogOut size={15} strokeWidth={1.75} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {(menuOpen || notesOpen) && (
        <button
          type="button"
          className="topbar__backdrop"
          aria-label="Close menu"
          onClick={() => {
            setMenuOpen(false);
            setNotesOpen(false);
          }}
        />
      )}
    </header>
  );
}
