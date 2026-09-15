import posthog from "posthog-js";
import {
  POSTHOG_KEY,
  POSTHOG_REPLAY_SAMPLE,
  replayAllowed,
  type ProductEvent,
  type ProductEventProps,
} from "@/config/posthog";

const SAMPLE_KEY = "ph_replay_sampled";

// Analytics is never worth an exception in a click handler or a render.
function safely(run: () => void): void {
  if (!POSTHOG_KEY) return;
  try {
    run();
  } catch {
    // Swallowed on purpose: a blocked or half-loaded SDK must not surface to a learner.
  }
}

export function track<E extends ProductEvent>(
  event: E,
  props: ProductEventProps[E],
): void {
  safely(() => posthog.capture(event, props));
}

export function identifyUser(userId: string): void {
  safely(() => posthog.identify(userId));
}

export function resetUser(): void {
  safely(() => posthog.reset());
}

/** Rolled once a session, not once a navigation, or a visit would be recorded in fragments with the interesting half missing. */
function sampledIn(): boolean {
  try {
    const seen = sessionStorage.getItem(SAMPLE_KEY);
    if (seen !== null) return seen === "1";
    const rolled = Math.random() < POSTHOG_REPLAY_SAMPLE;
    sessionStorage.setItem(SAMPLE_KEY, rolled ? "1" : "0");
    return rolled;
  } catch {
    return false;
  }
}

export function syncReplay(pathname: string): void {
  safely(() => {
    const wanted = replayAllowed(pathname) && sampledIn();
    if (wanted === posthog.sessionRecordingStarted()) return;
    if (wanted) posthog.startSessionRecording();
    else posthog.stopSessionRecording();
  });
}
