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
import { Avatar, Divider, MenuRow, Popover } from "@/design-system";
import { ACCOUNT_GROUP, HeaderNav, MAIN_GROUPS } from "./HeaderNav";
import { type Subject } from "@/data/navigation";

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
  if (segs.length === 1) return segs[0] === "today" ? null : "/today";
  return `/${segs.slice(0, -1).join("/")}`;
}

export function RunningHead({
  isAdmin = false,
  onTopPlan = false,
}: {
  isAdmin?: boolean;
  onTopPlan?: boolean;
}) {
  const { avatar, profile } = useApp();
  const { signOut, user, loading } = useAuth();
  const signedOut = !loading && !user;
  const signedIn = !loading && !!user;
  const { open: retrievalOpen, setOpen: setRetrievalOpen } = useRetrieval();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const mod = useModifierKey();
  const [account, setAccount] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  const spec = params.get("spec");
  const sit = params.get("sit");
  const parent = upOne(pathname, Boolean(spec || sit));

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key !== "Escape") return;
      if (document.documentElement.dataset.mode === "exam") return;
      if (retrievalOpen) return;

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
      <div className="flex h-16 items-center gap-3 px-5 sm:gap-5 sm:px-8 lg:h-20">
        <Link
          href="/today"
          className="shrink-0 text-[20px] font-bold tracking-[-0.03em] sm:text-[22px]"
        >
          onelystop
        </Link>

        <HeaderNav groups={MAIN_GROUPS} />

        <span className="flex-1" />

        <button
          type="button"
          aria-label="Search"
          onClick={() => setRetrievalOpen(true)}
          className="press rounded-pill border-on-frame-line text-on-frame-2 hover:border-on-frame-3 flex h-10 shrink-0 items-center gap-3 border px-3 text-[13.5px] md:pr-1.5 md:pl-3.5"
        >
          <span className="flex items-center gap-2">
            <Search size={14} />
            <span className="hidden md:inline">Search</span>
          </span>
          {/* The shortcut hint only where the key exists: touch has no ⌘. */}
          <kbd className="rounded-pill border-on-frame-line hidden border px-2 py-0.5 text-[11px] md:inline">
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
