import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Hexagon,
  Search,
  Settings,
  User,
  Zap,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import type { ExamBoard, Subject } from "../../data/navigation";
import { Button } from "../ui/Button";
import "./TopBar.css";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

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
          <label className="topbar__select">
            <span className="sr-only">Subject</span>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value as Subject)}
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label className="topbar__select topbar__select--board">
            <span className="sr-only">Exam board</span>
            <select
              value={board}
              onChange={(e) => setBoard(e.target.value as ExamBoard)}
            >
              {BOARDS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>

          <div className="topbar__stat" title="Streak">
            <Zap size={15} strokeWidth={2} />
            <span>{streak}</span>
          </div>
          <div className="topbar__stat" title="Points">
            <Hexagon size={15} strokeWidth={2} />
            <span>{points}</span>
          </div>

          <button type="button" className="topbar__icon-btn" aria-label="Notifications">
            <Bell size={17} strokeWidth={1.75} />
            <span className="topbar__dot" />
          </button>

          <Button size="sm">Upgrade</Button>

          <div className="topbar__account" ref={menuRef}>
            <button
              type="button"
              className="topbar__avatar"
              aria-label="Account menu"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOpen((v) => !v)}
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
                  to="/profile"
                  role="menuitem"
                  className="topbar__menu-item"
                  onClick={() => setMenuOpen(false)}
                >
                  <User size={15} strokeWidth={1.75} />
                  Profile
                </Link>
                <Link
                  to="/settings"
                  role="menuitem"
                  className="topbar__menu-item"
                  onClick={() => setMenuOpen(false)}
                >
                  <Settings size={15} strokeWidth={1.75} />
                  Settings
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
