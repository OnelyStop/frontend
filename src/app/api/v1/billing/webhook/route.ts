import { NextResponse } from "next/server";
import { db } from "@/db";
import { handleWebhook } from "@/features/billing/webhook.server";
import { log } from "@/lib/log";

export const dynamic = "force-dynamic";

// Subscribe the Razorpay webhook to every subscription.* event plus
// payment.captured and payment.failed; the secret is RAZORPAY_WEBHOOK_SECRET.
export async function POST(request: Request) {
  // The signature is over the bytes as sent — read them before anything
  // parses them.
  const rawBody = await request.text();
  const eventId = request.headers.get("x-razorpay-event-id");

  const outcome = await handleWebhook(db, {
    rawBody,
    signature: request.headers.get("x-razorpay-signature"),
    eventId,
  });

  const bad = outcome === "invalid_signature" || outcome === "malformed";
  log[bad ? "warn" : "info"]("billing.webhook", { eventId, outcome });
  return NextResponse.json({ outcome }, { status: bad ? 400 : 200 });
}
