/** PostHog's settings, shared by the browser SDK, the server client and the rewrites that relay both. */

// A project key authorises event writes and nothing else, so it ships in the bundle; it is never proof of anything.
export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";

const REGION = process.env.NEXT_PUBLIC_POSTHOG_REGION === "eu" ? "eu" : "us";

export const POSTHOG_INGEST_HOST = `https://${REGION}.i.posthog.com`;
export const POSTHOG_ASSET_HOST = `https://${REGION}-assets.i.posthog.com`;
export const POSTHOG_UI_HOST = `https://${REGION}.posthog.com`;

// Blockers match /analytics, /tracking, /telemetry and /posthog by name, so the relay is named for what it counts.
export const POSTHOG_RELAY_PATH = "/attendance";

const sample = Number(process.env.NEXT_PUBLIC_POSTHOG_REPLAY_SAMPLE);

export const POSTHOG_REPLAY_SAMPLE =
  Number.isFinite(sample) && sample >= 0 && sample <= 1 ? sample : 0.1;

// Replay follows the funnel, not the exam: a recording of a drill is the answer key on video, and the recovery token is in the URL on /reset-password.
const REPLAY_EXCLUDED = [
  "/reset-password",
  "/upgrade/checkout",
  "/drills",
  "/mocks",
  "/descriptive",
  "/results",
];

export const replayAllowed = (pathname: string): boolean =>
  !REPLAY_EXCLUDED.some((p) => pathname === p || pathname.startsWith(`${p}/`));

/** One entry per funnel step, and the properties are names and counts — never a question, an answer or a score. */
export type ProductEventProps = {
  signup_completed: { method: "password" | "google" };
  drill_started: { section: string; length: number };
  mock_started: { exam: string; exam_mode: boolean };
  checkout_started: { plan: string; interval: string };
  subscription_activated: { plan: string; interval: string };
};

export type ProductEvent = keyof ProductEventProps;

// The recovery token, the `from` path and the plan being looked at all ride in a query string or a fragment.
const stripQuery = (url: string): string => {
  const cut = url.search(/[?#]/);
  return cut === -1 ? url : url.slice(0, cut);
};

/** Every URL-bearing property, scrubbed of its query and fragment; `sanitize_properties` sees each event before it leaves the browser. */
export function scrubUrls(
  props: Record<string, unknown>,
): Record<string, unknown> {
  const clean = { ...props };
  for (const [key, value] of Object.entries(clean)) {
    const name = key.toLowerCase();
    const carriesUrl = name.includes("url") || name.includes("referrer");
    if (carriesUrl && typeof value === "string") clean[key] = stripQuery(value);
  }
  return clean;
}
