"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { useRetrieval } from "@/features/retrieval/RetrievalContext";
import { TARGETS } from "@/features/retrieval/targets";
import { ChevronDown, Search } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { ACCOUNT_GROUP, HeaderNav, MAIN_GROUPS } from "./HeaderNav";
import type { ExamBoard, Subject } from "@/data/navigation";

export const SUBJECT_INK: Record<Subject, string> = {
  "Quantitative Aptitude": "var(--color-quant)",
  "Reasoning Ability": "var(--color-reasoning)",
  "English Language": "var(--color-english)",
  "General Awareness": "var(--color-ga)",
  "Computer Aptitude": "var(--color-computer)",
};

type Entry = {
  board: ExamBoard;
  stages: string;
  stage: string;
  date: string;
};

/** The exams this aspirant has applied for, in the order they sit. ⌘1/⌘2/⌘3. */
export const ENTERED: Entry[] = [
  {
    board: "IBPS PO",
    stages: "Prelims & Mains",
    stage: "Prelims",
    date: "12 Oct",
  },
  {
    board: "SBI PO",
    stages: "Prelims & Mains",
    stage: "Prelims",
    date: "08 Nov",
  },
  {
    board: "RBI Grade B",
    stages: "Phase 1 & 2",
    stage: "Phase 1",
    date: "23 Nov",
  },
];

const SECTION: Record<string, string> = {
  home: "Today",
  "attempt-map": "Attempt map",
  mocks: "Mocks",
  drills: "Drills",
  descriptive: "Descriptive",
  notes: "Notes",
  flashcards: "Flashcards",
  progress: "Progress",
  community: "Community",
  profile: "Profile",
  settings: "Settings",
  upgrade: "Upgrade",
  admin: "Admin",
};

function specTitle(code: string): string | null {
  return TARGETS.find((t) => t.id === `s-${code}`)?.label ?? null;
}

function sitTitle(sit: string): string {
  const m = /^(\d{4})-p(\d)$/.exec(sit);
  return m ? `${m[1]} Paper ${m[2]}` : sit;
}

function pretty(seg: string): string {
  const q = /^q(\d+)([a-z])?$/i.exec(seg);
  if (q) return `Q${q[1]}${q[2] ? `(${q[2].toLowerCase()})` : ""}`;
  if (/^\d+(\.\d+)+$/.test(seg)) return specTitle(seg) ?? seg;
  return seg.replace(/-/g, " ").replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

export type Crumb = { href: string; label: string };

/** The stack the running head prints and Esc walks back up. A deep-link param
    is a level of its own, so `?spec=3.1.2` → Index → cover sheet is three real
    URLs and the back button agrees with Esc. */
export function crumbTrail(
  pathname: string,
  spec: string | null,
  sit: string | null,
): Crumb[] {
  const segs = pathname.split("/").filter(Boolean);
  if (!segs.length || (segs.length === 1 && segs[0] === "home")) {
    return [{ href: "/home", label: "Today" }];
  }

  const trail: Crumb[] = segs.map((seg, i) => ({
    href: `/${segs.slice(0, i + 1).join("/")}`,
    label: i === 0 ? (SECTION[seg] ?? pretty(seg)) : pretty(seg),
  }));

  if (spec) {
    trail.push({
      href: `${pathname}?spec=${spec}`,
      label: specTitle(spec) ?? spec,
    });
  } else if (sit) {
    trail.push({ href: `${pathname}?sit=${sit}`, label: sitTitle(sit) });
  }
  return trail;
}

export function upOne(pathname: string, deepLinked: boolean): string | null {
  if (deepLinked) return pathname;
  const segs = pathname.split("/").filter(Boolean);
  if (!segs.length) return null;
  if (segs.length === 1) return segs[0] === "home" ? null : "/home";
  return `/${segs.slice(0, -1).join("/")}`;
}

export function RunningHead() {
  const { subject, board, setBoard, initials } = useApp();
  const { signOut } = useAuth();
  const { open: retrievalOpen, setOpen: setRetrievalOpen } = useRetrieval();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [switching, setSwitching] = useState(false);
  const [account, setAccount] = useState(false);
  const idRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  const spec = params.get("spec");
  const sit = params.get("sit");
  const parent = upOne(pathname, Boolean(spec || sit));
  const entry =
    ENTERED.find((e) => e.board === board) ??
    ({ board, stages: "", stage: "Prelims", date: "" } as Entry);

  const switchTo = (e: Entry) => {
    setBoard(e.board);
    setSwitching(false);
  };

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if ((ev.metaKey || ev.ctrlKey) && /^[123]$/.test(ev.key)) {
        const next = ENTERED[Number(ev.key) - 1];
        if (!next) return;
        ev.preventDefault();
        switchTo(next);
        return;
      }

      if (ev.key !== "Escape") return;
      // Exam conditions owns its own exit, and it asks first.
      if (document.documentElement.dataset.mode === "exam") return;
      if (retrievalOpen) return;
      if (switching) {
        setSwitching(false);
        return;
      }

      // A first Esc leaves the field you are typing in; the second goes up.
      const el = document.activeElement as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable)
      ) {
        el.blur();
        return;
      }

      if (parent) router.push(parent);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    if (!switching) return;
    const onDown = (ev: MouseEvent) => {
      if (!idRef.current?.contains(ev.target as Node)) setSwitching(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [switching]);

  useEffect(() => {
    if (!account) return;
    const onDown = (ev: MouseEvent) => {
      if (!accountRef.current?.contains(ev.target as Node)) setAccount(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [account]);

  useEffect(() => setAccount(false), [pathname]);

  return (
    <header className="border-line bg-canvas/85 sticky top-0 z-30 border-b backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1600px] items-center gap-5 px-8 lg:px-16">
        <Link
          href="/home"
          className="shrink-0 text-[18px] font-semibold tracking-[-0.03em]"
        >
          onelystop
        </Link>

        <div className="relative shrink-0" ref={idRef}>
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={switching}
            onClick={() => setSwitching((v) => !v)}
            className="rounded-pill hover:text-ink flex h-9 items-center gap-2 pr-2.5 pl-2 text-[14px] transition-colors"
          >
            <span
              className="size-1.5 rounded-full"
              style={{ background: SUBJECT_INK[subject] }}
              aria-hidden
            />
            <span>{board}</span>
            <span className="text-ink-3">{entry.stage}</span>
            <ChevronDown size={14} className="text-ink-4" />
          </button>

          {switching ? (
            <div
              role="menu"
              aria-label="Exams you have applied for"
              className="border-line bg-canvas shadow-pop absolute top-11 left-0 z-50 w-72 overflow-hidden rounded-[18px] border p-1.5"
            >
              <p className="text-ink-3 px-2.5 pt-2 pb-1.5 text-[13px]">
                You have applied for
              </p>
              {ENTERED.map((e, i) => (
                <button
                  key={e.board}
                  type="button"
                  role="menuitemradio"
                  aria-checked={e.board === board}
                  onClick={() => switchTo(e)}
                  className={`rounded-ctl flex w-full items-center gap-2 px-2.5 py-2 text-left transition-colors ${
                    e.board === board ? "bg-brand-soft" : "hover:bg-brand-soft"
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px]">{e.board}</span>
                    <span className="text-ink-3 block text-[13px]">
                      {e.stages} · {e.date}
                    </span>
                  </span>
                  <kbd className="rounded-pill border-line text-ink-3 border px-2 py-0.5 text-[11px]">
                    ⌘{i + 1}
                  </kbd>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <HeaderNav groups={MAIN_GROUPS} />

        <span className="flex-1" />

        <button
          type="button"
          onClick={() => setRetrievalOpen(true)}
          className="rounded-pill border-line-2 text-ink-3 hover:border-ink/25 flex h-10 items-center gap-5 border pr-2 pl-4 text-[14px] transition-colors"
        >
          <span className="flex items-center gap-2">
            <Search size={14} />
            Search
          </span>
          <kbd className="rounded-pill border-line border px-2 py-0.5 text-[11px]">
            ⌘K
          </kbd>
        </button>

        <Link
          href="/upgrade"
          className="rounded-pill bg-ink hover:bg-ink/85 hidden h-10 items-center px-5 text-[14px] text-white transition-colors sm:flex"
        >
          Upgrade
        </Link>

        <div className="relative shrink-0" ref={accountRef}>
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={account}
            aria-label="Account"
            onClick={() => setAccount((v) => !v)}
            className="border-line-2 hover:border-ink/25 grid size-10 place-items-center rounded-full border text-[13px] transition-colors"
          >
            {initials}
          </button>

          {account ? (
            <div
              role="menu"
              aria-label="Account"
              className="border-line bg-canvas shadow-pop absolute top-12 right-0 z-50 w-[300px] rounded-[18px] border p-1.5"
            >
              {ACCOUNT_GROUP.items.map((i) => (
                <Link
                  key={i.id}
                  href={i.path}
                  role="menuitem"
                  onClick={() => setAccount(false)}
                  className="rounded-ctl hover:bg-brand-soft block px-3 py-2.5 transition-colors"
                >
                  <span className="block text-[14px]">{i.label}</span>
                  <span className="text-ink-3 mt-0.5 block text-[13px] leading-snug">
                    {i.hint}
                  </span>
                </Link>
              ))}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setAccount(false);
                  void signOut().then(() => router.replace("/"));
                }}
                className="rounded-ctl border-line text-ink-2 hover:bg-brand-soft hover:text-ink mt-1 block w-full border-t px-3 py-2.5 text-left text-[14px] transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
