import { NextResponse } from "next/server";
import { db } from "@/db";
import { handleWebhook } from "@/features/billing/webhook.server";
import { log } from "@/lib/log";
import { captureServerEvent } from "@/lib/posthog.server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // The signature is over the bytes as sent — read them before anything parses.
  const rawBody = await request.text();
  const eventId = request.headers.get("x-razorpay-event-id");

  const { outcome, activated } = await handleWebhook(db, {
    rawBody,
    signature: request.headers.get("x-razorpay-signature"),
    eventId,
  });

  const bad = outcome === "invalid_signature" || outcome === "malformed";
  log[bad ? "warn" : "info"]("billing.webhook", { eventId, outcome });

  if (activated)
    await captureServerEvent(activated.userId, "subscription_activated", {
      plan: activated.plan,
      interval: activated.interval,
    });

  return NextResponse.json({ outcome }, { status: bad ? 400 : 200 });
}
