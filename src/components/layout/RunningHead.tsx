"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { useModifierKey } from "@/lib/platform";
import { useRetrieval } from "@/features/retrieval/RetrievalContext";
import { ChevronDown, Search } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { AVATARS } from "@/features/profile/avatars";
import { Avatar, Divider, Kbd, MenuRow, Popover } from "@/design-system";
import { ACCOUNT_GROUP, HeaderNav, MAIN_GROUPS } from "./HeaderNav";
import { EXAMS, type ExamBoard, type Subject } from "@/data/navigation";

export const SUBJECT_INK: Record<Subject, string> = {
  "Quantitative Aptitude": "var(--color-quant)",
  "Reasoning Ability": "var(--color-reasoning)",
  "English Language": "var(--color-english)",
  "General Awareness": "var(--color-ga)",
  "Computer Aptitude": "var(--color-computer)",
};

export function upOne(pathname: string, deepLinked: boolean): string | null {
  if (deepLinked) return pathname;
  const segs = pathname.split("/").filter(Boolean);
  if (!segs.length) return null;
  if (segs.length === 1) return segs[0] === "home" ? null : "/home";
  return `/${segs.slice(0, -1).join("/")}`;
}

export function RunningHead({
  isAdmin = false,
  onTopPlan = false,
}: {
  isAdmin?: boolean;
  onTopPlan?: boolean;
}) {
  const { subject, board, setBoard, avatar, profile } = useApp();
  const { signOut, user, loading } = useAuth();
  // Neither state renders until auth resolves, so the header never flashes either way.
  const signedOut = !loading && !user;
  const signedIn = !loading && !!user;
  const { open: retrievalOpen, setOpen: setRetrievalOpen } = useRetrieval();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const mod = useModifierKey();
  const [switching, setSwitching] = useState(false);
  const [account, setAccount] = useState(false);
  const idRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  const spec = params.get("spec");
  const sit = params.get("sit");
  const parent = upOne(pathname, Boolean(spec || sit));

  const switchTo = (next: ExamBoard) => {
    setBoard(next);
    setSwitching(false);
  };

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if ((ev.metaKey || ev.ctrlKey) && /^[1-9]$/.test(ev.key)) {
        const next = EXAMS[Number(ev.key) - 1];
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
    <header className="text-white">
      <div className="flex h-20 items-center gap-5 px-6 sm:px-8">
        <Link
          href="/home"
          className="shrink-0 text-[22px] font-bold tracking-[-0.03em]"
        >
          onelystop
        </Link>

        <div className="relative shrink-0" ref={idRef}>
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={switching}
            onClick={() => setSwitching((v) => !v)}
            className="press rounded-pill text-on-frame-2 hover:text-on-frame flex h-9 items-center gap-2 pr-2.5 pl-2 text-[13px]"
          >
            <span
              className="size-1.5 rounded-full"
              style={{ background: SUBJECT_INK[subject] }}
              aria-hidden
            />
            <span>{board}</span>
            <ChevronDown size={14} className="text-on-frame-3" />
          </button>

          {switching ? (
            <Popover label="Exams covered" width={248} className="top-10.5">
              <p className="text-ink-3 px-2.5 pt-1.5 pb-1 text-[12px]">
                Exams covered
              </p>
              {EXAMS.map((e, i) => (
                <button
                  key={e}
                  type="button"
                  role="menuitemradio"
                  aria-checked={e === board}
                  onClick={() => switchTo(e)}
                  className={`press rounded-ctl flex w-full items-center gap-2 px-2.5 py-2 text-left ${
                    e === board ? "bg-brand-soft" : "hover:bg-brand-soft"
                  }`}
                >
                  <span className="min-w-0 flex-1 text-[13px]">{e}</span>
                  <Kbd>
                    {mod}
                    {i + 1}
                  </Kbd>
                </button>
              ))}
            </Popover>
          ) : null}
        </div>

        <HeaderNav groups={MAIN_GROUPS} />

        <span className="flex-1" />

        <button
          type="button"
          onClick={() => setRetrievalOpen(true)}
          className="press rounded-pill border-on-frame-line text-on-frame-2 hover:border-on-frame-3 flex h-10 items-center gap-3 border pr-1.5 pl-3.5 text-[13.5px]"
        >
          <span className="flex items-center gap-2">
            <Search size={14} />
            Search
          </span>
          <kbd className="rounded-pill border-on-frame-line border px-2 py-0.5 text-[11px]">
            {mod}K
          </kbd>
        </button>

        {signedOut ? (
          <>
            <Link
              href="/login"
              className="text-on-frame-2 hover:text-on-frame hidden h-11 items-center px-3 text-[14px] transition-colors sm:flex"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-pill text-frame flex h-11 shrink-0 items-center bg-white px-6 text-[14px] font-semibold transition-colors hover:bg-white/90"
            >
              Start free
            </Link>
          </>
        ) : null}

        <Link
          href="/upgrade"
          className={`rounded-pill text-frame h-9.5 items-center bg-white px-4.5 text-[12.5px] font-semibold transition-colors hover:bg-white/90 ${signedIn && !onTopPlan ? "hidden sm:flex" : "hidden"}`}
        >
          Upgrade
        </Link>

        <div
          className={`relative shrink-0 ${signedIn ? "" : "hidden"}`}
          ref={accountRef}
        >
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={account}
            aria-label="Account"
            onClick={() => setAccount((v) => !v)}
            className="press rounded-pill hover:bg-frame-2 flex items-center gap-2 py-1 pr-1.5 pl-1"
          >
            {/* Every account gets a mark: initials on a dark disc read as a placeholder. */}
            <Avatar size={36} tint={AVATARS[avatar ?? "indigo"].wash}>
              {AVATARS[avatar ?? "indigo"].face}
            </Avatar>
            <span className="hidden max-w-44 text-left leading-tight md:block">
              <span className="text-on-frame block truncate text-[13.5px] font-semibold">
                {profile.name || "Your account"}
              </span>
              <span className="text-on-frame-3 block truncate text-[12px]">
                {profile.email}
              </span>
            </span>
            <ChevronDown size={16} className="text-on-frame-3 shrink-0" />
          </button>

          {account ? (
            <Popover
              label="Account"
              align="right"
              width={260}
              className="top-11.5"
            >
              {ACCOUNT_GROUP.items
                .filter((i) => !(onTopPlan && i.id === "upgrade"))
                .map((i) => (
                  <MenuRow
                    key={i.id}
                    href={i.path}
                    label={i.label}
                    hint={i.hint}
                    onClick={() => setAccount(false)}
                  />
                ))}
              {isAdmin ? (
                <MenuRow
                  href="/admin"
                  label="Control room"
                  hint="Question bank, papers and access"
                  onClick={() => setAccount(false)}
                />
              ) : null}
              <Divider className="my-1" />
              <MenuRow
                label="Sign out"
                onClick={() => {
                  setAccount(false);
                  void signOut().then(() => router.replace("/"));
                }}
              />
            </Popover>
          ) : null}
        </div>
      </div>
    </header>
  );
}
