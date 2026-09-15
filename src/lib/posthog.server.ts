import "server-only";
import { PostHog } from "posthog-node";
import {
  POSTHOG_INGEST_HOST,
  POSTHOG_KEY,
  type ProductEvent,
  type ProductEventProps,
} from "@/config/posthog";
import { log } from "./log";

const REQUEST_TIMEOUT_MS = 3_000;

/** A function can freeze the moment it responds, so nothing is batched and the send is awaited; PostHog being down must never fail the caller. */
export async function captureServerEvent<E extends ProductEvent>(
  distinctId: string,
  event: E,
  properties: ProductEventProps[E],
): Promise<void> {
  if (!POSTHOG_KEY) return;

  const client = new PostHog(POSTHOG_KEY, {
    host: POSTHOG_INGEST_HOST,
    flushAt: 1,
    flushInterval: 0,
    requestTimeout: REQUEST_TIMEOUT_MS,
  });

  try {
    client.capture({ distinctId, event, properties });
    await client.shutdown();
  } catch (err) {
    log.warn("posthog.capture_failed", {
      event,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
