"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MailCheck } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useEnabledProviders } from "@/features/auth/hooks/useEnabledProviders";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { GoogleButton, SetupNotice } from "@/features/auth/components/AuthBits";
import { PasswordChecklist } from "@/features/auth/components/PasswordChecklist";
import {
  MIN_PASSWORD_LENGTH,
  passwordMeetsRules,
} from "@/features/auth/password-rules";
import {
  ChoiceCard,
  StepShell,
} from "@/features/onboarding/components/StepShell";
import {
  EMPTY_ANSWERS,
  stashAnswers,
  targetYears,
  type Answers,
} from "@/features/onboarding/answers";
import { AvatarPicker } from "@/features/profile/components/AvatarPicker";
import { Input, SECTION_TINT } from "@/design-system";
import { EXAMS, type ExamBoard } from "@/data/navigation";

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("") || "AM";

// What each board is, in the words a candidate uses — not the board's own prose.
const EXAM_HINT: Record<ExamBoard, string> = {
  "IBPS PO": "Probationary Officer, public sector banks",
  "IBPS Clerk": "Clerical cadre, public sector banks",
  "IBPS RRB": "Officer and Assistant, regional rural banks",
  "SBI PO": "Probationary Officer, State Bank of India",
  "SBI Clerk": "Junior Associate, State Bank of India",
  "RBI Grade B": "Officer Grade B, Reserve Bank of India",
};

const STEPS = ["exam", "year", "name", "avatar", "email", "password"] as const;
type Step = (typeof STEPS)[number];

export function SignupView() {
  const { signUp, signInWithGoogle, user, configured } = useAuth();
  const { google: googleEnabled } = useEnabledProviders();
  const router = useRouter();
  const [at, setAt] = useState<Step>("exam");
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (user) router.replace("/today");
  }, [user, router]);

  const index = STEPS.indexOf(at);
  const set = <K extends keyof Answers>(key: K, value: Answers[K]) =>
    setAnswers((prev) => ({ ...prev, [key]: value }));

  const go = (delta: 1 | -1) => {
    setError(null);
    const next = STEPS[index + delta];
    if (next) setAt(next);
  };

  const handleGoogle = async () => {
    setError(null);
    // The redirect leaves the page, so the answers ride in sessionStorage and the callback applies them.
    stashAnswers(answers);
    const { error: err } = await signInWithGoogle();
    if (err) setError(err);
  };

  const create = async () => {
    setBusy(true);
    setError(null);
    const res = await signUp(email, password, answers.name, answers.avatar, {
      examBoard: answers.examBoard,
      targetYear: answers.targetYear,
    });
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    // Supabase withholds the session when email confirmation is required.
    if (res.needsConfirmation) setSent(true);
    else router.replace("/today");
  };

  if (sent) {
    return (
      <AuthShell
        title="Check your email"
        subtitle={`We sent a confirmation link to ${email}. Click it to activate your account.`}
        footer={
          <>
            Wrong address?{" "}
            <Link href="/signup" className="text-ink font-medium">
              Try again
            </Link>
          </>
        }
      >
        <div className="mt-6 text-center">
          <MailCheck
            size={48}
            strokeWidth={1.5}
            className="text-brand mx-auto mb-3.5"
          />
          <p className="text-ink-2 text-[14px]">
            The link is single-use and expires soon. Check your spam folder if
            it hasn&rsquo;t arrived in a couple of minutes.
          </p>
        </div>
      </AuthShell>
    );
  }

  const shell = {
    step: index + 1,
    total: STEPS.length,
    onBack: index > 0 ? () => go(-1) : undefined,
    error,
  };
  const signIn = (
    <>
      Already have an account?{" "}
      <Link href="/login" className="text-ink font-medium">
        Sign in
      </Link>
    </>
  );

  if (at === "exam") {
    return (
      <StepShell
        {...shell}
        question="Which exam are you preparing for?"
        hint="Every paper, drill and cutoff on the app is set to this. You can change it later in Settings."
        canAdvance={answers.examBoard !== null}
        onNext={() => go(1)}
        footer={signIn}
      >
        <div
          role="radiogroup"
          aria-label="Exam"
          className="grid gap-3 sm:grid-cols-2"
        >
          {EXAMS.map((exam, i) => (
            <ChoiceCard
              key={exam}
              label={exam}
              hint={EXAM_HINT[exam]}
              tint={SECTION_TINT[i % SECTION_TINT.length]!}
              selected={answers.examBoard === exam}
              onSelect={() => set("examBoard", exam)}
            />
          ))}
        </div>
      </StepShell>
    );
  }

  if (at === "year") {
    const years = targetYears();
    return (
      <StepShell
        {...shell}
        question={`When are you sitting ${answers.examBoard}?`}
        hint="It sets how much runway your plan assumes. Nothing is locked to it."
        canAdvance
        onNext={() => go(1)}
        nextLabel={answers.targetYear === null ? "Not sure yet" : "Continue"}
      >
        <div
          role="radiogroup"
          aria-label="Target year"
          className="flex flex-wrap justify-center gap-3"
        >
          {years.map((year) => (
            <button
              key={year}
              type="button"
              role="radio"
              aria-checked={answers.targetYear === year}
              onClick={() => set("targetYear", year)}
              className={`press tnum rounded-pill px-7 py-3.5 text-[16px] font-semibold transition-shadow duration-200 ${
                answers.targetYear === year
                  ? "bg-frame shadow-lift text-white"
                  : "bg-canvas shadow-card"
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </StepShell>
    );
  }

  if (at === "name") {
    return (
      <StepShell
        {...shell}
        question="What should we call you?"
        hint="It goes on your account and nowhere a stranger can see it."
        canAdvance={answers.name.trim().length > 0}
        onNext={() => go(1)}
      >
        <Input
          autoFocus
          value={answers.name}
          onChange={(e) => set("name", e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && answers.name.trim()) go(1);
          }}
          type="text"
          autoComplete="name"
          maxLength={80}
          placeholder="Aarav Mehta"
          aria-label="Full name"
          className="mx-auto h-14 max-w-95 text-center text-[18px]"
        />
      </StepShell>
    );
  }

  if (at === "avatar") {
    return (
      <StepShell
        {...shell}
        question="Pick a face for your account."
        hint="Optional — without one you keep your initials."
        canAdvance
        onNext={() => go(1)}
        nextLabel={answers.avatar === null ? "Keep my initials" : "Continue"}
      >
        <div className="flex justify-center">
          <AvatarPicker
            value={answers.avatar}
            onChange={(next) => set("avatar", next)}
            initials={initialsOf(answers.name)}
          />
        </div>
      </StepShell>
    );
  }

  if (at === "email") {
    return (
      <StepShell
        {...shell}
        question="What's your email?"
        hint="We send the confirmation link here, and nothing else unless you ask."
        canAdvance={email.includes("@") && email.trim().length > 3}
        onNext={() => go(1)}
      >
        <Input
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && email.includes("@")) go(1);
          }}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-label="Email"
          className="mx-auto h-14 max-w-95 text-center text-[18px]"
        />

        {!configured ? <SetupNotice /> : null}

        {googleEnabled ? (
          <div className="mx-auto mt-7 max-w-95">
            <div className="text-ink-3 mb-4 flex items-center gap-3 text-[13px] before:h-px before:flex-1 before:bg-current/20 before:content-[''] after:h-px after:flex-1 after:bg-current/20 after:content-['']">
              or
            </div>
            <GoogleButton onClick={handleGoogle} disabled={busy} />
          </div>
        ) : null}
      </StepShell>
    );
  }

  const ready = passwordMeetsRules(password);
  return (
    <StepShell
      {...shell}
      question="Set a password."
      hint={`At least ${MIN_PASSWORD_LENGTH} characters, and something you have not used elsewhere.`}
      canAdvance={ready && configured}
      busy={busy}
      onNext={() => void create()}
      nextLabel="Create my account"
      footer={
        <>
          By creating an account you agree to the{" "}
          <Link href="/terms" className="text-ink-2 underline">
            terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-ink-2 underline">
            privacy policy
          </Link>
          .
        </>
      }
    >
      <div className="mx-auto max-w-95 text-left">
        <Input
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && ready) void create();
          }}
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          aria-label="Password"
          aria-describedby="password-rules"
          className="h-14 text-center text-[18px]"
        />
        <div id="password-rules" className="mt-1">
          <PasswordChecklist value={password} open />
        </div>
        {!configured ? <SetupNotice /> : null}
      </div>
    </StepShell>
  );
}
